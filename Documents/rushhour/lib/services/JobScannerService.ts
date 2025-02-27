import { prisma } from "../prisma";
import { JobSearchAgent } from "../agents/JobSearchAgent";
import { NotificationService } from "./NotificationService";
import {
  Company,
  JobProfile,
  JobMatch,
  User,
  NotificationPreferences,
  CompanySelectors,
} from "../types";
import { logger } from "../utils/logger";

export class JobScannerService {
  private agent: JobSearchAgent;
  private notificationService: NotificationService;
  private isRunning: boolean = false;
  private scanIntervals: Map<string, number> = new Map();
  private readonly MIN_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.agent = new JobSearchAgent();
    this.notificationService = new NotificationService();
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.agent.init();
    this.scheduleScan();
  }

  private async scheduleScan() {
    while (this.isRunning) {
      await this.scanAllCompanies();
      await new Promise((resolve) => setTimeout(resolve, this.MIN_INTERVAL));
    }
  }

  private calculateNextScanInterval(company: Company): number {
    const currentInterval =
      this.scanIntervals.get(company.id) || this.MIN_INTERVAL;

    // If no last scan time, use minimum interval
    if (!company.lastScanTime) {
      return this.MIN_INTERVAL;
    }

    const hoursSinceLastScan =
      (Date.now() - company.lastScanTime.getTime()) / (60 * 60 * 1000);

    // If it's been more than 24 hours, reset to minimum interval
    if (hoursSinceLastScan > 24) {
      return this.MIN_INTERVAL;
    }

    // If no new jobs found in last scan, gradually increase interval
    const newInterval = Math.min(currentInterval * 1.5, this.MAX_INTERVAL);
    this.scanIntervals.set(company.id, newInterval);

    return newInterval;
  }

  async scanAllCompanies() {
    try {
      const companies = await prisma.company.findMany({
        include: {
          jobProfiles: {
            include: {
              user: true,
            },
          },
        },
      });

      for (const company of companies) {
        const interval = this.calculateNextScanInterval(company);
        const lastScanTime = company.lastScanTime?.getTime() || 0;

        if (Date.now() - lastScanTime >= interval) {
          await this.scanCompany(company);
        }
      }
    } catch (error) {
      logger.error("Error scanning companies:", error);
    }
  }

  private async scanCompany(company: Company) {
    try {
      // Group profiles by job title to avoid duplicate searches
      const profilesByTitle = new Map<string, JobProfile[]>();

      if (!company.jobProfiles) return;

      company.jobProfiles.forEach((profile) => {
        const existing = profilesByTitle.get(profile.jobTitle) || [];
        profilesByTitle.set(profile.jobTitle, [...existing, profile]);
      });

      // Convert Map entries to array for iteration
      const profileEntries = Array.from(profilesByTitle.entries());

      for (const [jobTitle, profiles] of profileEntries) {
        // Use the first profile for searching since they share the same title
        const searchProfile = profiles[0];
        const match = await this.agent.searchJobs(company, searchProfile);

        if (match) {
          // Check if this job was already found
          const existingMatch = await prisma.jobMatch.findFirst({
            where: {
              title: match.title,
              applyLink: match.applyLink,
              jobProfileId: {
                in: profiles.map((p: JobProfile) => p.id),
              },
            },
          });

          if (!existingMatch) {
            // Create job match for each profile with this title
            for (const profile of profiles) {
              const newMatch = await prisma.jobMatch.create({
                data: {
                  ...match,
                  jobProfileId: profile.id,
                },
              });

              if (profile.user) {
                await this.notificationService.notifyUser(
                  profile.user,
                  newMatch
                );
              }
            }
          }
        }
      }

      // Update last scan time
      await prisma.company.update({
        where: { id: company.id },
        data: { lastScanTime: new Date() },
      });
    } catch (error) {
      logger.error(`Error scanning company ${company.name}:`, error);
    }
  }

  async stop() {
    this.isRunning = false;
    await this.agent.cleanup();
  }
}
