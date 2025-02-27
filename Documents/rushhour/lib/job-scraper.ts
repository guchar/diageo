import puppeteer from "puppeteer";
import { prisma } from "./prisma";

interface ScrapedJob {
  title: string;
  location: string;
  description: string;
  applyLink: string;
  postedDate: Date;
}

interface GoogleJob {
  id: string;
  title: string;
  locations?: string[];
  summary?: string;
  description?: string;
  published_date?: string;
}

export async function scrapeJobsForCompany(
  companyId: string
): Promise<ScrapedJob[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Special handling for Google careers
  if (company.name.toLowerCase() === "google") {
    return scrapeGoogleJobs();
  }

  const selectors = JSON.parse(company.selectorsConfig);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  try {
    console.log(
      `Starting scrape for ${company.name} at ${company.careerPageUrl}`
    );
    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the career page
    await page.goto(company.careerPageUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for the job listings to load
    await page.waitForSelector(selectors.listingSelector, { timeout: 10000 });

    // Extract jobs
    const jobs = await page.evaluate((sel: any) => {
      const listings = document.querySelectorAll(sel.listingSelector);
      return Array.from(listings)
        .map((listing) => {
          const titleEl = listing.querySelector(sel.jobTitleSelector);
          const locationEl = listing.querySelector(sel.locationSelector);
          const applyEl = listing.querySelector(
            sel.applyLinkSelector
          ) as HTMLAnchorElement;

          // Get job description if available
          const descriptionEl =
            listing.querySelector(".job-description, .description") ||
            listing.querySelector("p, div[class*='description']");

          return {
            title: titleEl?.textContent?.trim() || "",
            location: locationEl?.textContent?.trim() || "",
            description: descriptionEl?.textContent?.trim() || "",
            applyLink: applyEl?.href || "",
            postedDate: new Date(),
          };
        })
        .filter((job) => job.title && job.applyLink);
    }, selectors);

    console.log(`Found ${jobs.length} jobs for ${company.name}`);
    return jobs;
  } finally {
    await browser.close();
  }
}

async function scrapeGoogleJobs(): Promise<ScrapedJob[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  try {
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    // Track network requests
    let jobsData: GoogleJob[] | null = null;
    page.on("request", (request) => {
      request.continue();
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("jobs/results/search")) {
        try {
          const data = await response.json();
          if (data && data.jobs) {
            jobsData = data.jobs;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("Navigating to Google Careers...");

    // Navigate to the search page with specific parameters
    await page.goto(
      "https://careers.google.com/api/v3/search/?distance=50&q=software%20engineer&sort_by=date_desc",
      {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 60000,
      }
    );

    // Wait for the API response
    await new Promise((r) => setTimeout(r, 5000));

    if (!jobsData) {
      // Try to get the data directly from the page
      const content = await page.content();
      try {
        const match = content.match(
          /window\.__INITIAL_STATE__\s*=\s*({[^<]*})/
        );
        if (match) {
          const data = JSON.parse(match[1]);
          jobsData = data.jobs || [];
        }
      } catch (e) {
        console.error("Error parsing page data:", e);
      }
    }

    if (!jobsData) {
      throw new Error("Could not find job listings data");
    }

    // Transform the job data into our format
    const jobs = jobsData
      .filter(
        (job: GoogleJob) =>
          job.title.toLowerCase().includes("software") &&
          job.title.toLowerCase().includes("engineer")
      )
      .map((job: GoogleJob) => ({
        title: job.title,
        location: job.locations?.join(", ") || "",
        description: job.summary || job.description || "",
        applyLink: `https://careers.google.com/jobs/results/${job.id}/`,
        postedDate: new Date(job.published_date || Date.now()),
      }));

    console.log(`Found ${jobs.length} Software Engineer jobs at Google`);
    return jobs;
  } catch (error: any) {
    console.error("Error scraping Google jobs:", error);
    console.error("Error details:", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace available",
    });
    throw error;
  } finally {
    await browser.close();
  }
}

export async function matchJobsToProfile(
  jobs: ScrapedJob[],
  profileId: string
): Promise<void> {
  const profile = await prisma.jobProfile.findUnique({
    where: { id: profileId },
    include: { company: true },
  });

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  console.log(`Matching jobs for profile: ${profile.jobTitle}`);

  for (const job of jobs) {
    // Check if this job matches the profile criteria
    const titleMatch = job.title
      .toLowerCase()
      .includes(profile.jobTitle.toLowerCase());
    const locationMatch =
      !profile.location ||
      job.location.toLowerCase().includes(profile.location.toLowerCase());
    const remoteMatch =
      !profile.remote || job.location.toLowerCase().includes("remote");

    if (titleMatch && (locationMatch || remoteMatch)) {
      // Check if we already have this job match (based on apply link)
      const existingMatch = await prisma.jobMatch.findFirst({
        where: {
          jobProfileId: profileId,
          applyLink: job.applyLink,
        },
      });

      if (!existingMatch) {
        // Create new job match
        await prisma.jobMatch.create({
          data: {
            jobProfileId: profileId,
            title: job.title,
            location: job.location,
            description: job.description,
            type: remoteMatch ? "Remote" : "On-site",
            applyLink: job.applyLink,
            postedDate: job.postedDate,
          },
        });
        console.log(`Created new job match: ${job.title}`);
      }
    }
  }
}
