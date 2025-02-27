import puppeteer, { Browser, Page, HTTPRequest } from "puppeteer";
import { prisma } from "./prisma";

interface SearchContext {
  company: {
    name: string;
    careerPageUrl: string;
  };
  searchCriteria: {
    jobTitle: string;
    location?: string;
    remote?: boolean;
  };
}

interface JobListing {
  title: string;
  location: string;
  description: string;
  link: string;
}

export class JobSearchAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private context: SearchContext;

  constructor(context: SearchContext) {
    this.context = context;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
    });
    this.page = await this.browser.newPage();

    // Set a realistic user agent
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Enable request interception for better performance
    await this.page.setRequestInterception(true);
    this.page.on("request", (request: HTTPRequest) => {
      const resourceType = request.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        resourceType === "media"
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Enable console logging from the page
    this.page.on("console", (msg) =>
      console.log("Browser console:", msg.text())
    );
  }

  private async randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async typeHumanLike(selector: string, text: string) {
    if (!this.page) throw new Error("Page not initialized");

    await this.page.focus(selector);
    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.randomDelay(50, 150);
    }
  }

  async findSearchBox() {
    if (!this.page) throw new Error("Page not initialized");

    console.log("🤖 Looking for the search box...");

    // Company-specific handling
    const companyName = this.context.company.name.toLowerCase();

    if (companyName === "microsoft") {
      await this.handleMicrosoftSearch();
      return "#search-box input[type='text']";
    } else if (companyName === "google") {
      await this.handleGoogleSearch();
      return 'input[aria-label="Search jobs"]';
    }

    // Generic search handling
    return await this.findGenericSearchBox();
  }

  private async handleMicrosoftSearch() {
    if (!this.page) throw new Error("Page not initialized");

    console.log("🤖 Starting Microsoft-specific search process...");

    try {
      // 1. Navigate directly to the search page to avoid redirects
      const searchUrl =
        "https://careers.microsoft.com/v2/global/en/search.html";
      console.log(`🤖 Navigating to ${searchUrl}...`);

      // Configure longer timeout and handle resources better
      await this.page.setDefaultNavigationTimeout(60000);
      await this.page.setDefaultTimeout(60000);

      // Modify request interception to only block non-essential resources
      await this.page.setRequestInterception(true);
      this.page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (
          resourceType === "image" ||
          resourceType === "font" ||
          (resourceType === "stylesheet" && !request.url().includes("critical"))
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await this.page.goto(searchUrl, {
        waitUntil: ["domcontentloaded", "networkidle2"],
        timeout: 60000,
      });

      // Wait for the page to be interactive
      console.log("🤖 Waiting for page to be interactive...");
      await this.page.waitForFunction(
        () => {
          // Check if critical elements are loaded
          const app = document.querySelector("#app, #root, [data-ph-at-id]");
          const noLoader = !document.querySelector(
            ".loading, .spinner, [aria-label*='loading']"
          );
          return app && noLoader;
        },
        { polling: 1000, timeout: 30000 }
      );

      // 2. Find and wait for the search input with multiple strategies
      console.log("🤖 Looking for search input...");
      const searchInput = await this.findSearchInputWithRetry();

      // 3. Type the search query with human-like delays
      const searchQuery = this.context.searchCriteria.jobTitle;
      console.log(`🤖 Typing search query: ${searchQuery}`);
      await this.typeHumanLike(searchInput, searchQuery);

      // 4. Submit search and wait for results
      await this.page.keyboard.press("Enter");
      console.log("🤖 Waiting for search results...");

      // 5. Wait for search results with better error handling
      await this.waitForSearchResultsWithRetry();

      console.log("🤖 Search results loaded");
      return;
    } catch (error: any) {
      console.error("🤖 Error during Microsoft search:", error.message);
      // Take a screenshot for debugging
      await this.page.screenshot({ path: "error-screenshot.png" });
      throw error;
    }
  }

  private async findSearchInputWithRetry(maxAttempts = 3): Promise<string> {
    const searchSelectors = [
      // Microsoft-specific selectors
      '[data-ph-at-id="jobs-search-box-input"]',
      '[data-ph-id="ph-page-element-page11-DbT9Cl"]',
      // Generic search selectors
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="keyword" i]',
      'input[placeholder*="job" i]',
      'input[aria-label*="search" i]',
      '[role="searchbox"]',
      "#search-box-input",
    ];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      for (const selector of searchSelectors) {
        try {
          // Wait for the element and verify it's interactive
          await this.page!.waitForSelector(selector, {
            visible: true,
            timeout: 20000,
          });

          // Verify the element is actually interactive
          const isInteractive = await this.page!.evaluate((sel) => {
            const element = document.querySelector(sel) as HTMLInputElement;
            if (!element) return false;

            const style = window.getComputedStyle(element);
            const isVisible =
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0";

            const rect = element.getBoundingClientRect();
            const hasSize = rect.width > 0 && rect.height > 0;

            return isVisible && hasSize && !element.disabled;
          }, selector);

          if (isInteractive) {
            console.log(`🤖 Found search input: ${selector}`);
            return selector;
          }
        } catch (e) {
          continue;
        }
      }

      if (attempt < maxAttempts) {
        console.log(`🤖 Attempt ${attempt} failed, retrying after delay...`);
        await this.randomDelay(2000, 5000);
      }
    }

    throw new Error(
      "Could not find interactive search input after all attempts"
    );
  }

  private async waitForSearchResultsWithRetry(maxAttempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page!.waitForFunction(
          () => {
            // Check for loading state
            const isLoading = document.querySelector(
              ".loading, .spinner, [aria-label*='loading']"
            );
            if (isLoading) return false;

            // Check for results
            const resultSelectors = [
              '[data-ph-at-id*="job-card"]',
              ".jobs-list",
              '[data-automation-id="jobsList"]',
              ".search-results",
            ];

            const hasResults = resultSelectors.some(
              (selector) => document.querySelectorAll(selector).length > 0
            );

            // Check for "no results" message
            const noResults =
              document.body.innerText.toLowerCase().includes("no results") ||
              document.body.innerText.toLowerCase().includes("no matches");

            return hasResults || noResults;
          },
          {
            timeout: 30000,
            polling: 1000,
          }
        );
        return;
      } catch (e) {
        if (attempt === maxAttempts) throw e;
        console.log(
          `🤖 Attempt ${attempt} to find results failed, retrying...`
        );
        await this.randomDelay(2000, 5000);
      }
    }
  }

  private async handleGoogleSearch() {
    if (!this.page) throw new Error("Page not initialized");

    const searchUrl = "https://careers.google.com/jobs/results/";
    console.log("🤖 Navigating to Google careers search page...");

    await this.page.goto(searchUrl, { waitUntil: "networkidle0" });
    await this.randomDelay();
  }

  private async findGenericSearchBox() {
    if (!this.page) throw new Error("Page not initialized");

    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="job" i]',
      'input[placeholder*="keyword" i]',
      'input[aria-label*="search" i]',
      'input[name*="search" i]',
      'input[name*="keyword" i]',
      "#search",
      ".search-input",
      'input[name="q"]',
      'input[role="search"]',
      'input[class*="search"]',
      'input[id*="search"]',
      'form input[type="text"]',
    ];

    for (const selector of searchSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        const searchBox = await this.page.$(selector);
        if (searchBox) {
          const isVisible = await this.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return false;
            const style = window.getComputedStyle(element);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0"
            );
          }, selector);

          if (isVisible) {
            console.log(`🤖 Found search box using selector: ${selector}`);
            return selector;
          }
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error("Could not find search box");
  }

  async searchForJobs() {
    if (!this.page) throw new Error("Page not initialized");

    console.log(`🤖 Searching for ${this.context.searchCriteria.jobTitle}...`);

    try {
      const searchBoxSelector = await this.findSearchBox();
      await this.typeHumanLike(
        searchBoxSelector,
        this.context.searchCriteria.jobTitle
      );
      await this.page.keyboard.press("Enter");
      await this.randomDelay(2000, 4000);

      // Wait for search results
      await this.waitForSearchResults();
    } catch (error) {
      console.log("🤖 Direct search failed, trying URL-based search...");
      await this.handleUrlBasedSearch();
    }
  }

  private async waitForSearchResults() {
    if (!this.page) throw new Error("Page not initialized");

    const jobTitle = this.context.searchCriteria.jobTitle.toLowerCase();
    const resultSelectors = [
      ".search-results",
      "[data-search-results]",
      "[role='list']",
      ".job-list",
      ".jobs-list",
      ".job-cards",
      // Add Microsoft-specific selectors
      "[data-ph-at-id*='job-card']",
      ".job-card",
      "[data-automation-id='job-card']",
      ".search-result-card",
    ];

    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        for (const selector of resultSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 10000 });
            console.log(`🤖 Found results with selector: ${selector}`);
            return;
          } catch (e) {
            continue;
          }
        }

        // If no specific selector found, wait for job-related content
        await this.page.waitForFunction(
          (title) => {
            const content = document.body.textContent?.toLowerCase() || "";
            return (
              content.includes(title) ||
              content.includes("job") ||
              content.includes("position") ||
              content.includes("opening")
            );
          },
          { timeout: 10000 },
          jobTitle
        );
        return;
      } catch (error: any) {
        console.log(
          `🤖 Attempt ${attempt} to find results failed:`,
          error.message
        );
        lastError =
          error instanceof Error ? error : new Error(error.toString());

        if (attempt < maxAttempts) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`🤖 Backing off for ${backoffTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw new Error(
      `Failed to find search results after ${maxAttempts} attempts. Last error: ${lastError?.message}`
    );
  }

  private async handleUrlBasedSearch() {
    if (!this.page) throw new Error("Page not initialized");

    const searchQuery = encodeURIComponent(
      this.context.searchCriteria.jobTitle
    );
    let searchUrl = this.context.company.careerPageUrl;

    // Company-specific URL patterns
    if (this.context.company.name.toLowerCase() === "microsoft") {
      searchUrl = `https://jobs.careers.microsoft.com/global/en/search?q=${searchQuery}`;
    } else if (this.context.company.name.toLowerCase() === "google") {
      searchUrl = `https://careers.google.com/jobs/results/?q=${searchQuery}`;
    } else {
      // Generic URL patterns
      if (!searchUrl.includes("?")) {
        searchUrl += "?";
      }
      searchUrl += searchUrl.endsWith("?")
        ? `q=${searchQuery}`
        : `&q=${searchQuery}`;
    }

    await this.page.goto(searchUrl, { waitUntil: "networkidle0" });
    await this.randomDelay(3000, 5000);
  }

  async extractJobListings(): Promise<JobListing[]> {
    if (!this.page) throw new Error("Page not initialized");

    console.log("🤖 Extracting job listings...");

    // Wait for any dynamic content to load
    await this.randomDelay(2000, 4000);

    // For Microsoft, try both API and UI-based extraction
    if (this.context.company.name.toLowerCase() === "microsoft") {
      try {
        // First try to parse JSON response
        const content = await this.page.content();
        if (content.includes('"jobs":')) {
          const jsonMatch = content.match(/({[\s\S]*"jobs":[\s\S]*})/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (jsonData.jobs) {
              return jsonData.jobs.map((job: any) => ({
                title: job.title || "",
                location: job.location || "",
                description: job.description || "",
                link: job.jobUrl || "",
              }));
            }
          }
        }
      } catch (e) {
        console.log(
          "🤖 Failed to extract from API response, falling back to UI extraction"
        );
      }
    }

    const jobs = await this.page.evaluate(
      (criteria: SearchContext["searchCriteria"]) => {
        function findJobElements() {
          // Microsoft-specific selectors first
          const microsoftSelectors = [
            ".jobs-list .job-tile", // Primary Microsoft selector
            "[data-automation-id='job-tile']",
            "[data-automation-id='jobsList'] > div",
            ".job-card",
            "[data-ph-at-id*='job-card']",
            "[data-ph-at-data-module='job-card']",
            ".search-result-card",
          ];

          for (const selector of microsoftSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              console.log(
                `Found ${elements.length} jobs with selector: ${selector}`
              );
              return Array.from(elements);
            }
          }

          // Fallback: Look for any elements containing job information
          const allElements = document.querySelectorAll("*");
          const jobElements = Array.from(allElements).filter((el) => {
            const text = el.textContent?.toLowerCase() || "";
            const hasTitle = text.includes(criteria.jobTitle.toLowerCase());
            const hasJobIndicator =
              text.includes("job") ||
              text.includes("position") ||
              text.includes("apply");
            const isJobCard = el.querySelector("a") || el.tagName === "A";
            return hasTitle && hasJobIndicator && isJobCard;
          });

          console.log(`Found ${jobElements.length} jobs using content search`);
          return jobElements;
        }

        function extractText(element: Element, selectors: string[]): string {
          // First try the provided selectors
          for (const selector of selectors) {
            const found = element.querySelector(selector);
            if (found) {
              const text = found.textContent?.trim();
              if (text) return text;
            }
          }

          // If no selectors match, try to find text directly in child elements
          const children = element.children;
          for (const child of Array.from(children)) {
            const text = child.textContent?.trim();
            if (text && text.length > 0) return text;
          }

          // Last resort: get text from the element itself
          return element.textContent?.trim() || "";
        }

        const jobElements = findJobElements();
        console.log(`Processing ${jobElements.length} job elements`);

        return jobElements
          .map((element) => {
            // Extract job details
            const title = extractText(element, [
              "[data-automation-id='job-title']",
              "[data-automation-id='jobTitle']",
              ".job-title",
              "[class*='title']",
              "h1, h2, h3, h4",
              "a",
            ]);

            const location = extractText(element, [
              "[data-automation-id='job-location']",
              "[data-automation-id='jobLocation']",
              ".job-location",
              "[class*='location']",
            ]);

            const description = extractText(element, [
              "[data-automation-id='job-description']",
              "[data-automation-id='jobDescription']",
              ".job-description",
              "[class*='description']",
              "p",
            ]);

            // Extract link (try multiple approaches)
            let link = "";
            const linkElement =
              element.tagName === "A" ? element : element.querySelector("a");
            if (linkElement) {
              link = linkElement.getAttribute("href") || "";
              if (!link.startsWith("http")) {
                link = new URL(link, window.location.origin).href;
              }
            }

            const job = { title, location, description, link };
            console.log("Extracted job:", job);
            return job;
          })
          .filter((job) => {
            // More lenient title matching
            const jobTitleLower = job.title.toLowerCase();
            const searchTitleLower = criteria.jobTitle.toLowerCase();
            const titleWords = searchTitleLower.split(/\s+/);

            // Check if all words from the search title appear in the job title
            const titleMatch = titleWords.every((word) =>
              jobTitleLower.includes(word)
            );

            // More lenient location matching
            const locationMatch =
              !criteria.location ||
              job.location
                .toLowerCase()
                .includes(criteria.location.toLowerCase());

            // Remote matching
            const remoteMatch =
              !criteria.remote || job.location.toLowerCase().includes("remote");

            const isValid =
              titleMatch && (locationMatch || remoteMatch) && job.link;

            if (!isValid) {
              console.log("Filtered out job:", job, {
                titleMatch,
                locationMatch,
                remoteMatch,
                hasLink: !!job.link,
              });
            }

            return isValid;
          });
      },
      this.context.searchCriteria
    );

    if (jobs.length === 0) {
      console.log("🤖 No matching jobs found");
      // Take a screenshot for debugging
      await this.page.screenshot({ path: "debug-screenshot.png" });
      return [];
    }

    console.log(`🤖 Found ${jobs.length} matching jobs:`, jobs);
    return jobs;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export async function searchJobsWithAgent(companyId: string): Promise<any[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const profile = await prisma.jobProfile.findFirst({
    where: { companyId },
  });

  if (!profile) {
    throw new Error(`No job profile found for company: ${companyId}`);
  }

  const context: SearchContext = {
    company: {
      name: company.name,
      careerPageUrl: company.careerPageUrl,
    },
    searchCriteria: {
      jobTitle: profile.jobTitle,
      location: profile.location || undefined,
      remote: profile.remote,
    },
  };

  const agent = new JobSearchAgent(context);

  try {
    await agent.initialize();
    await agent.searchForJobs();
    return await agent.extractJobListings();
  } finally {
    await agent.cleanup();
  }
}
