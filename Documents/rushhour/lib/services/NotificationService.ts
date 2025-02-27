import { User, JobMatch, NotificationPreferences } from "../types";
import nodemailer from "nodemailer";
import { WebClient } from "@slack/web-api";
import { logger } from "../utils/logger";
import { prisma } from "../prisma";

interface DigestItem {
  jobMatch: JobMatch;
  timestamp: Date;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private slackClient: WebClient;
  private digestQueue: Map<string, DigestItem[]> = new Map();

  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.slackClient = new WebClient(process.env.SLACK_TOKEN);
  }

  async notifyUser(user: User, jobMatch: JobMatch): Promise<void> {
    const prefs = this.parsePreferences(user.notificationPrefs);

    if (!this.isWithinQuietHours(prefs)) {
      if (prefs.frequency === "immediate") {
        await this.sendNotifications(user, jobMatch, prefs);
      } else {
        // Add to digest queue
        const userDigest = this.digestQueue.get(user.id) || [];
        userDigest.push({ jobMatch, timestamp: new Date() });
        this.digestQueue.set(user.id, userDigest);
      }
    }
  }

  private parsePreferences(
    prefs: string | NotificationPreferences
  ): NotificationPreferences {
    if (typeof prefs === "string") {
      return JSON.parse(prefs);
    }
    return prefs;
  }

  private isWithinQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours) return false;

    const now = new Date();
    const userTz = prefs.timezone || "UTC";
    const userTime = now.toLocaleTimeString("en-US", { timeZone: userTz });

    const [startHour, startMinute] = prefs.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = prefs.quietHours.end.split(":").map(Number);
    const [currentHour, currentMinute] = userTime.split(":").map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Handles overnight quiet hours
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  async processDigests(): Promise<void> {
    const digestEntries = Array.from(this.digestQueue.entries());
    for (const [userId, items] of digestEntries) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      const prefs = this.parsePreferences(user.notificationPrefs);

      if (this.shouldSendDigest(items[0]?.timestamp, prefs.frequency)) {
        const digestContent = this.formatDigest(items);
        await this.sendNotifications(user, null, prefs, digestContent);
        this.digestQueue.delete(userId);
      }
    }
  }

  private shouldSendDigest(
    timestamp: Date | undefined,
    frequency: NotificationPreferences["frequency"]
  ): boolean {
    if (!timestamp) return false;

    const now = new Date();
    const hours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    return (
      (frequency === "hourly" && hours >= 1) ||
      (frequency === "daily" && hours >= 24)
    );
  }

  private formatDigest(items: DigestItem[]): string {
    let digest = `Found ${items.length} new job matches:\n\n`;

    items.forEach(({ jobMatch }, index) => {
      digest += `${index + 1}. ${jobMatch.title}\n`;
      digest += `   Location: ${jobMatch.location}\n`;
      digest += `   Type: ${jobMatch.type}\n`;
      digest += `   Apply: ${jobMatch.applyLink}\n\n`;
    });

    return digest;
  }

  private async sendNotifications(
    user: User,
    jobMatch: JobMatch | null,
    prefs: NotificationPreferences,
    digestContent?: string
  ): Promise<void> {
    const content = digestContent || this.formatJobNotification(jobMatch!);

    try {
      if (prefs.email) {
        await this.sendEmail(user.email, content);
      }
      if (prefs.slack && prefs.slackWebhook) {
        await this.sendSlackMessage(prefs.slackWebhook, content);
      }
      // TODO: Implement SMS and push notifications
    } catch (error) {
      logger.error("Error sending notifications:", error);
    }
  }

  private formatJobNotification(jobMatch: JobMatch): string {
    return `
New job match found!

Title: ${jobMatch.title}
Location: ${jobMatch.location}
Type: ${jobMatch.type}
Description: ${jobMatch.description.substring(0, 200)}...

Apply now: ${jobMatch.applyLink}
    `.trim();
  }

  private async sendEmail(to: string, content: string): Promise<void> {
    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "New Job Matches Found",
      text: content,
    });
  }

  private async sendSlackMessage(
    webhook: string,
    content: string
  ): Promise<void> {
    await this.slackClient.chat.postMessage({
      channel: webhook,
      text: content,
      unfurl_links: true,
    });
  }
}
