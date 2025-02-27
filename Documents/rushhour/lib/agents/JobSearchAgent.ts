import { Browser, Page, chromium, ElementHandle } from "playwright";
import { logger } from "../utils/logger";

export interface JobResult {
  title: string;
  location: string;
  description: string;
  applyLink: string;
  postedDate: string;
}

export interface JobSearchConfig {
  // Basic configuration
  companyName: string;
  careerPageUrl: string;

  // Selectors (optional, will try to infer if not provided)
  searchBoxSelector?: string;
  searchButtonSelector?: string;
  jobListingSelector?: string;
  titleSelector?: string;
  locationSelector?: string;
  descriptionSelector?: string;
  applyLinkSelector?: string;

  // Navigation options
  searchPath?: string;
  waitForNavigation?: boolean;
  submitSearchWithEnter?: boolean;

  // Rate limiting and behavior
  delayBetweenActions?: [number, number]; // Min and max delay in ms
  maxResults?: number;

  // Advanced options
  extraHeaders?: Record<string, string>;
  cookies?: any[];
  evaluateSearchBox?: string; // JavaScript to evaluate to find search box
  evaluateJobListings?: string; // JavaScript to evaluate to extract job listings
}

/**
 * JobSearchAgent - A configurable AI agent that mimics human behavior to search for jobs
 * on any company's career page. This agent can be adapted to work with different websites.
 */
export class JobSearchAgent {
  private browser: Browser | null = null;
  private context: any = null;
  private page: Page | null = null;
  private config: JobSearchConfig;

  constructor(config: JobSearchConfig) {
    this.config = {
      // Set default values
      delayBetweenActions: [100, 300],
      maxResults: 10,
      waitForNavigation: true,
      submitSearchWithEnter: true,
      ...config, // Override with provided config
    };
  }

  /**
   * Initialize the agent by launching a browser instance
   */
  async init(): Promise<void> {
    try {
      // Launch the browser with human-like behavior settings
      this.browser = await chromium.launch({
        headless: true, // Run in headless mode to avoid showing browser
      });

      // Create a context with human-like characteristics
      this.context = await this.browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        locale: "en-US",
        timezoneId: "America/Los_Angeles",
      });

      // Set extra headers if provided
      if (this.config.extraHeaders) {
        await this.context.setExtraHTTPHeaders(this.config.extraHeaders);
      }

      // Set cookies if provided
      if (this.config.cookies && this.config.cookies.length > 0) {
        await this.context.addCookies(this.config.cookies);
      }

      // Add human-like behavior
      await this.context.addInitScript(() => {
        // Add random delays to user interactions
        const originalClick = HTMLElement.prototype.click;
        HTMLElement.prototype.click = function () {
          const delay = Math.floor(Math.random() * 100) + 50;
          setTimeout(() => originalClick.call(this), delay);
        };
      });

      // Create a page
      this.page = await this.context.newPage();

      // Enable console logging from the browser
      if (this.page) {
        this.page.on("console", (msg) => {
          logger.info(`Browser console: ${msg.text()}`);
        });
      }

      logger.info(`JobSearchAgent initialized for ${this.config.companyName}`);
    } catch (error) {
      logger.error(
        `Error initializing JobSearchAgent for ${this.config.companyName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Search for jobs on the company's career page
   * @param jobTitle The job title to search for
   * @returns Array of job results
   */
  async searchJobs(jobTitle: string): Promise<JobResult[]> {
    if (!this.page || !this.browser) {
      await this.init();
    }

    try {
      logger.info(
        `Starting job search for "${jobTitle}" at ${this.config.companyName}`
      );

      // Navigate to the company's career page
      const fullUrl = this.config.searchPath
        ? new URL(this.config.searchPath, this.config.careerPageUrl).href
        : this.config.careerPageUrl;

      logger.info(`Navigating to ${fullUrl}`);
      await this.page!.goto(fullUrl, {
        waitUntil: "networkidle",
        timeout: 60000, // 60 seconds timeout
      });

      // Simulate human-like pause to observe the page
      await this.randomDelay();

      // Find and interact with the search box
      logger.info("Looking for the search box...");
      const searchBox = await this.findSearchBox();

      if (!searchBox) {
        throw new Error(
          `Could not find search box on ${this.config.companyName}'s career page`
        );
      }

      // Clear any existing text in the search box
      await searchBox.click({ clickCount: 3 }); // Triple click to select all text
      await searchBox.press("Backspace");

      // Type the job title with human-like typing behavior
      logger.info(`Typing job title: ${jobTitle}`);
      await this.typeHumanLike(searchBox, jobTitle);

      // Either press Enter or click the search button
      if (this.config.submitSearchWithEnter) {
        await this.randomDelay(500, 1000);
        await searchBox.press("Enter");
      } else if (this.config.searchButtonSelector) {
        // Try to find and click the search button
        const searchButton = await this.page!.$(
          this.config.searchButtonSelector
        );
        if (searchButton) {
          await this.randomDelay(500, 1000);
          await searchButton.click();
        } else {
          // Fallback to Enter if button not found
          await this.randomDelay(500, 1000);
          await searchBox.press("Enter");
        }
      }

      // Wait for results to load
      logger.info("Waiting for search results to load...");
      if (this.config.waitForNavigation) {
        await this.page!.waitForLoadState("networkidle", { timeout: 30000 });
      } else {
        // If we don't expect navigation, wait for content to update
        await this.page!.waitForTimeout(3000);
      }

      // Give extra time for any JavaScript to run and update the DOM
      await this.randomDelay(2000, 4000);

      // Extract job results
      logger.info("Extracting job results...");
      const jobResults = await this.extractJobResults();

      logger.info(`Found ${jobResults.length} job results`);
      return jobResults;
    } catch (error) {
      logger.error(
        `Error searching for jobs at ${this.config.companyName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Find the search box on the page using configured selectors or inference
   */
  private async findSearchBox(): Promise<ElementHandle<
    HTMLInputElement | SVGElement
  > | null> {
    if (!this.page) return null;

    // If a specific selector is provided, try that first
    if (this.config.searchBoxSelector) {
      const element = await this.page.$(this.config.searchBoxSelector);
      if (element) {
        logger.info(
          `Found search box using provided selector: ${this.config.searchBoxSelector}`
        );
        return element as ElementHandle<HTMLInputElement | SVGElement>;
      }
    }

    // If JavaScript evaluation is provided, try that
    if (this.config.evaluateSearchBox) {
      try {
        const element = await this.page.evaluateHandle(
          this.config.evaluateSearchBox
        );
        if (element) {
          logger.info("Found search box using provided JavaScript evaluation");
          // Cast to unknown first to fix type conversion issue
          return element as unknown as ElementHandle<
            HTMLInputElement | SVGElement
          >;
        }
      } catch (error) {
        logger.error("Error evaluating JavaScript for search box:", error);
      }
    }

    // Try common search box selectors
    const searchBoxSelectors = [
      'input[type="search"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="Find"]',
      'input[placeholder*="find"]',
      'input[placeholder*="job"]',
      'input[placeholder*="Job"]',
      'input[aria-label*="Search"]',
      "input.search-box",
      ".search input",
      '[role="searchbox"]',
    ];

    // Try each selector until we find the search box
    for (const selector of searchBoxSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        logger.info(`Found search box using generic selector: ${selector}`);
        return element as ElementHandle<HTMLInputElement | SVGElement>;
      }
    }

    // If we still can't find it, try to infer from input elements
    logger.info(
      "Search box not found with predefined selectors, trying to infer it..."
    );
    const potentialSearchBoxes = await this.page.$$("input");

    for (const element of potentialSearchBoxes) {
      const type = await element.getAttribute("type");
      const placeholder = await element.getAttribute("placeholder");
      const ariaLabel = await element.getAttribute("aria-label");
      const className = await element.getAttribute("class");
      const id = await element.getAttribute("id");
      const name = await element.getAttribute("name");

      // Check if this element has search-like attributes
      if (
        type === "search" ||
        type === "text" ||
        (placeholder &&
          /search|find|job|title|position|keyword/i.test(placeholder)) ||
        (ariaLabel &&
          /search|find|job|title|position|keyword/i.test(ariaLabel)) ||
        (className && /search/i.test(className)) ||
        (id && /search/i.test(id)) ||
        (name && /search|q|query|keyword/i.test(name))
      ) {
        logger.info("Found search box by inferring from attributes");
        return element as ElementHandle<HTMLInputElement | SVGElement>;
      }
    }

    return null;
  }

  /**
   * Extract job results from the page
   */
  private async extractJobResults(): Promise<JobResult[]> {
    if (!this.page) throw new Error("Page not initialized");

    // If JavaScript evaluation is provided, try that
    if (this.config.evaluateJobListings) {
      try {
        const rawResults = await this.page.evaluate(
          this.config.evaluateJobListings
        );
        if (Array.isArray(rawResults)) {
          logger.info(
            `Found ${rawResults.length} job listings using JavaScript evaluation`
          );
          return rawResults.slice(0, this.config.maxResults);
        }
      } catch (error) {
        logger.error("Error evaluating JavaScript for job listings:", error);
      }
    }

    // If specific selector is provided, use that
    if (this.config.jobListingSelector) {
      const jobElements = await this.page.$$(this.config.jobListingSelector);
      if (jobElements.length > 0) {
        logger.info(
          `Found ${jobElements.length} job listings using provided selector`
        );
        return this.extractJobDataFromElements(jobElements);
      }
    }

    // Try common selectors for job listings
    const jobListingSelectors = [
      ".job-result", // Generic class name
      ".career-card",
      ".job-card",
      '[role="listitem"]',
      ".jobs-list > div", // Common pattern
      "article", // Often used for job listings
      ".results-list > div",
      ".job-list > div",
      '.careers-results div[class*="job"]',
      '[data-automation-id="jobListing"]', // Workday
      ".job-tile", // Common in many sites
    ];

    let jobElements: ElementHandle<HTMLElement | SVGElement>[] = [];

    // Try each selector until we find job listings
    for (const selector of jobListingSelectors) {
      jobElements = await this.page.$$(selector);
      if (jobElements.length > 0) {
        logger.info(
          `Found ${jobElements.length} job listings using selector: ${selector}`
        );
        break;
      }
    }

    // If we couldn't find job listings with predefined selectors, try to infer them
    if (jobElements.length === 0) {
      logger.info(
        "Job listings not found with predefined selectors, trying to infer them..."
      );

      // Look for header elements that might contain job titles
      const jobTitleElements = await this.page.$$(
        'h2, h3, h4, .title, [class*="title"]'
      );

      // Check if each title element might be part of a job listing
      for (const titleElement of jobTitleElements) {
        const parentElement = await titleElement.evaluateHandle(
          (node) => node.parentElement
        );
        jobElements.push(parentElement as ElementHandle<HTMLElement>);
      }

      logger.info(`Inferred ${jobElements.length} potential job listings`);
    }

    return this.extractJobDataFromElements(jobElements);
  }

  /**
   * Extract job data from elements
   */
  private async extractJobDataFromElements(
    jobElements: ElementHandle<HTMLElement | SVGElement>[]
  ): Promise<JobResult[]> {
    const jobResults: JobResult[] = [];

    for (
      let i = 0;
      i < Math.min(jobElements.length, this.config.maxResults || 10);
      i++
    ) {
      try {
        const jobElement = jobElements[i];

        // Extract job title
        let titleElement = null;
        if (this.config.titleSelector) {
          titleElement = await jobElement.$(this.config.titleSelector);
        } else {
          titleElement = await jobElement.$(
            'h2, h3, h4, .title, [class*="title"]'
          );
        }
        const title = titleElement ? await titleElement.textContent() : null;

        // Extract job location
        let locationElement = null;
        if (this.config.locationSelector) {
          locationElement = await jobElement.$(this.config.locationSelector);
        } else {
          locationElement = await jobElement.$(
            '[class*="location"], [aria-label*="location"], [class*="city"], [class*="address"]'
          );
        }
        const location = locationElement
          ? await locationElement.textContent()
          : null;

        // Extract job description
        let descriptionElement = null;
        if (this.config.descriptionSelector) {
          descriptionElement = await jobElement.$(
            this.config.descriptionSelector
          );
        } else {
          descriptionElement = await jobElement.$(
            'p, [class*="description"], [class*="summary"]'
          );
        }
        const description = descriptionElement
          ? await descriptionElement.textContent()
          : null;

        // Extract apply link
        let linkElement = null;
        let applyLink = null;
        if (this.config.applyLinkSelector) {
          linkElement = await jobElement.$(this.config.applyLinkSelector);
        } else {
          linkElement = await jobElement.$("a");
        }

        if (linkElement) {
          applyLink = await linkElement.getAttribute("href");
          // Make relative URLs absolute
          if (applyLink && !applyLink.startsWith("http")) {
            applyLink = new URL(applyLink, this.config.careerPageUrl).href;
          }
        }

        // Only add jobs with at least a title
        if (title) {
          jobResults.push({
            title: title.trim(),
            location: location ? location.trim() : "Location not specified",
            description: description
              ? description.trim()
              : "No description available",
            applyLink: applyLink || "#",
            postedDate: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error(`Error extracting data from job element ${i}:`, error);
      }
    }

    return jobResults;
  }

  /**
   * Type text with human-like behavior (variable speed, occasional mistakes)
   */
  private async typeHumanLike(
    element: ElementHandle<HTMLElement | SVGElement>,
    text: string
  ): Promise<void> {
    for (let i = 0; i < text.length; i++) {
      // Occasionally make a typing "mistake" and correct it
      if (Math.random() < 0.05) {
        // 5% chance of typo
        const wrongChar = String.fromCharCode(text.charCodeAt(i) + 1);
        await element.type(wrongChar, { delay: this.randomNumber(100, 200) });
        await this.randomDelay(200, 400);
        await element.press("Backspace");
        await this.randomDelay(100, 200);
      }

      // Type the correct character with variable speed
      await element.type(text[i], { delay: this.randomNumber(80, 180) });

      // Occasionally pause while typing (as humans do)
      if (Math.random() < 0.1) {
        // 10% chance of pause
        await this.randomDelay(300, 800);
      }
    }
  }

  /**
   * Generate a random number between min and max
   */
  private randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Wait for a random amount of time between min and max milliseconds
   */
  private async randomDelay(min?: number, max?: number): Promise<void> {
    const [defaultMin, defaultMax] = this.config.delayBetweenActions || [
      100, 300,
    ];
    const actualMin = min || defaultMin;
    const actualMax = max || defaultMax;
    const delay = this.randomNumber(actualMin, actualMax);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    logger.info(
      `JobSearchAgent for ${this.config.companyName} cleaned up successfully`
    );
  }
}
