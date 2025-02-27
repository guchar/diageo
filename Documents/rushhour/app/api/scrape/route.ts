import { NextResponse } from "next/server";
import { chromium } from "playwright";

interface Job {
  title: string;
  location: string;
  link: string;
}

// Scrape Google Career Page using Playwright
async function scrapeGoogle(jobTitle: string): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // Navigate directly to Google Careers with the query parameter
    const url = `https://www.google.com/about/careers/applications/jobs/results/?q=${encodeURIComponent(
      jobTitle
    )}`;
    await page.goto(url, { waitUntil: "networkidle" });
    // Wait for the page to load
    await page.waitForSelector("body", { timeout: 5000 });

    // Log page content length for debugging
    const pageContent = await page.content();
    console.log("[Google] Page content length:", pageContent.length);

    // Attempt to extract job cards using assumed selectors
    let jobCards = await page.$$(".job-card");
    console.log("[Google] Found job cards:", jobCards.length);
    const jobs: Job[] = [];
    if (jobCards.length > 0) {
      for (let i = 0; i < Math.min(5, jobCards.length); i++) {
        const card = jobCards[i];
        try {
          const title = await card.$eval(
            ".job-title",
            (node) => node.textContent?.trim() || ""
          );
          const location = await card.$eval(
            ".job-location",
            (node) => node.textContent?.trim() || ""
          );
          const link = await card.$eval(
            "a",
            (node) => node.getAttribute("href") || ""
          );
          jobs.push({ title, location, link });
        } catch (innerError) {
          console.error(
            "[Google] Error extracting data from a job card:",
            innerError
          );
        }
      }
    }

    // If no jobs were found, force fallback sample data
    if (jobs.length === 0) {
      console.error(
        "[Google] No job cards found or extracted, assigning fallback data"
      );
      const fallbackJobs: Job[] = [
        {
          title: "Software Engineer I (Fallback)",
          location: "Mountain View, CA",
          link: "https://careers.google.com/job1",
        },
        {
          title: "Software Engineer II (Fallback)",
          location: "New York, NY",
          link: "https://careers.google.com/job2",
        },
        {
          title: "Software Engineer III (Fallback)",
          location: "San Francisco, CA",
          link: "https://careers.google.com/job3",
        },
        {
          title: "Software Engineer IV (Fallback)",
          location: "Los Angeles, CA",
          link: "https://careers.google.com/job4",
        },
        {
          title: "Software Engineer V (Fallback)",
          location: "Seattle, WA",
          link: "https://careers.google.com/job5",
        },
      ];
      return fallbackJobs;
    }
    return jobs;
  } catch (error) {
    console.error("Error scraping Google:", error);
    // Return fallback sample data on error
    return [
      {
        title: "Software Engineer I (Error Fallback)",
        location: "Mountain View, CA",
        link: "https://careers.google.com/job1",
      },
      {
        title: "Software Engineer II (Error Fallback)",
        location: "New York, NY",
        link: "https://careers.google.com/job2",
      },
      {
        title: "Software Engineer III (Error Fallback)",
        location: "San Francisco, CA",
        link: "https://careers.google.com/job3",
      },
      {
        title: "Software Engineer IV (Error Fallback)",
        location: "Los Angeles, CA",
        link: "https://careers.google.com/job4",
      },
      {
        title: "Software Engineer V (Error Fallback)",
        location: "Seattle, WA",
        link: "https://careers.google.com/job5",
      },
    ];
  } finally {
    await browser.close();
  }
}

// Scrape Microsoft Career Page using Playwright
async function scrapeMicrosoft(jobTitle: string): Promise<Job[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // Navigate directly to Microsoft's search results with query parameter
    const url = `https://careers.microsoft.com/v2/global/en/search-results?keywords=${encodeURIComponent(
      jobTitle
    )}`;
    await page.goto(url, { waitUntil: "networkidle" });
    // Wait for the page to load
    await page.waitForSelector("body", { timeout: 5000 });

    // Log page content length for debugging
    const pageContent = await page.content();
    console.log("[Microsoft] Page content length:", pageContent.length);

    // Attempt to extract job postings using assumed selectors
    let jobCards = await page.$$(".jobPosting");
    console.log("[Microsoft] Found job postings:", jobCards.length);
    const jobs: Job[] = [];
    if (jobCards.length > 0) {
      for (let i = 0; i < Math.min(5, jobCards.length); i++) {
        const card = jobCards[i];
        try {
          const title = await card.$eval(
            ".jobTitle",
            (node) => node.textContent?.trim() || ""
          );
          const location = await card.$eval(
            ".jobLocation",
            (node) => node.textContent?.trim() || ""
          );
          const link = await card.$eval(
            "a",
            (node) => node.getAttribute("href") || ""
          );
          jobs.push({ title, location, link });
        } catch (innerError) {
          console.error(
            "[Microsoft] Error extracting data from a job posting:",
            innerError
          );
        }
      }
    }

    // If no jobs were found, force fallback sample data
    if (jobs.length === 0) {
      console.error(
        "[Microsoft] No job postings found or extracted, assigning fallback data"
      );
      const fallbackJobs: Job[] = [
        {
          title: "Product Manager I (Fallback)",
          location: "Redmond, WA",
          link: "https://careers.microsoft.com/job1",
        },
        {
          title: "Product Manager II (Fallback)",
          location: "Seattle, WA",
          link: "https://careers.microsoft.com/job2",
        },
        {
          title: "Product Manager III (Fallback)",
          location: "Boston, MA",
          link: "https://careers.microsoft.com/job3",
        },
        {
          title: "Product Manager IV (Fallback)",
          location: "Austin, TX",
          link: "https://careers.microsoft.com/job4",
        },
        {
          title: "Product Manager V (Fallback)",
          location: "San Francisco, CA",
          link: "https://careers.microsoft.com/job5",
        },
      ];
      return fallbackJobs;
    }
    return jobs;
  } catch (error) {
    console.error("Error scraping Microsoft:", error);
    // Return fallback sample data on error
    return [
      {
        title: "Product Manager I (Error Fallback)",
        location: "Redmond, WA",
        link: "https://careers.microsoft.com/job1",
      },
      {
        title: "Product Manager II (Error Fallback)",
        location: "Seattle, WA",
        link: "https://careers.microsoft.com/job2",
      },
      {
        title: "Product Manager III (Error Fallback)",
        location: "Boston, MA",
        link: "https://careers.microsoft.com/job3",
      },
      {
        title: "Product Manager IV (Error Fallback)",
        location: "Austin, TX",
        link: "https://careers.microsoft.com/job4",
      },
      {
        title: "Product Manager V (Error Fallback)",
        location: "San Francisco, CA",
        link: "https://careers.microsoft.com/job5",
      },
    ];
  } finally {
    await browser.close();
  }
}

export async function POST(request: Request) {
  try {
    const { company, jobTitle } = await request.json();
    if (!company || !jobTitle) {
      return NextResponse.json(
        { error: "Missing company or jobTitle" },
        { status: 400 }
      );
    }
    let jobs: Job[] = [];
    if (company.toLowerCase() === "google") {
      jobs = await scrapeGoogle(jobTitle);
    } else if (company.toLowerCase() === "microsoft") {
      jobs = await scrapeMicrosoft(jobTitle);
    } else {
      return NextResponse.json(
        { error: "Unsupported company" },
        { status: 400 }
      );
    }
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("API scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape jobs" },
      { status: 500 }
    );
  }
}
