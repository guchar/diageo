import { Browser, Page, chromium, ElementHandle } from "playwright";
import { logger } from "../utils/logger";

export interface JobResult {
  title: string;
  location: string;
  description: string;
  applyLink: string;
  postedDate: string;
}

/**
 * GoogleJobSearchAgent - An AI agent that mimics human behavior to search for jobs
 * on Google's career page. This agent can navigate the page, find the search box,
 * input a job title, and extract job listings from the results.
 */
export class GoogleJobSearchAgent {
  private browser: Browser | null = null;
  private context: any = null;
  private page: Page | null = null;

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

      logger.info("GoogleJobSearchAgent initialized successfully");
    } catch (error) {
      logger.error("Error initializing GoogleJobSearchAgent:", error);
      throw error;
    }
  }

  /**
   * Search for jobs on Google's career page
   * @param jobTitle The job title to search for
   * @returns Array of job results
   */
  async searchJobs(jobTitle: string): Promise<JobResult[]> {
    if (!this.page || !this.browser) {
      await this.init();
    }

    try {
      logger.info(`Starting job search for: ${jobTitle}`);

      // Navigate to Google's career page with human-like behavior
      logger.info("Navigating to Google's career page...");
      await this.page!.goto(
        "https://www.google.com/about/careers/applications/jobs/results/",
        {
          waitUntil: "networkidle",
          timeout: 60000, // 60 seconds timeout
        }
      );

      // Simulate human-like pause to observe the page
      await this.randomDelay(1000, 2000);

      // Find and interact with the search box
      logger.info("Looking for the search box...");

      // Try multiple strategies to find the search box
      const searchBoxSelectors = [
        'input[type="search"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="Find"]',
        'input[placeholder*="find"]',
        'input[aria-label*="Search"]',
        "input.search-box",
        ".search input",
        '[role="searchbox"]',
      ];

      let searchBox: ElementHandle<HTMLInputElement | SVGElement> | null = null;

      // Try each selector until we find the search box
      for (const selector of searchBoxSelectors) {
        const element = await this.page!.$(selector);
        if (element) {
          searchBox = element as ElementHandle<HTMLInputElement | SVGElement>;
          logger.info(`Found search box using selector: ${selector}`);
          break;
        }
      }

      // If we couldn't find the search box with predefined selectors, try to infer it
      if (!searchBox) {
        logger.info(
          "Search box not found with predefined selectors, trying to infer it..."
        );

        // Look for elements that might be search boxes based on their attributes or behavior
        const potentialSearchBoxes = await this.page!.$$("input");

        for (const element of potentialSearchBoxes) {
          const type = await element.getAttribute("type");
          const placeholder = await element.getAttribute("placeholder");
          const ariaLabel = await element.getAttribute("aria-label");
          const className = await element.getAttribute("class");

          // Check if this element has search-like attributes
          if (
            type === "search" ||
            type === "text" ||
            (placeholder && /search|find|job|title/i.test(placeholder)) ||
            (ariaLabel && /search|find|job|title/i.test(ariaLabel)) ||
            (className && /search/i.test(className))
          ) {
            searchBox = element;
            logger.info("Found search box by inferring from attributes");
            break;
          }
        }
      }

      if (!searchBox) {
        throw new Error("Could not find search box on Google's career page");
      }

      // Clear any existing text in the search box
      await searchBox.click({ clickCount: 3 }); // Triple click to select all text
      await searchBox.press("Backspace");

      // Type the job title with human-like typing behavior
      logger.info(`Typing job title: ${jobTitle}`);
      await this.typeHumanLike(searchBox, jobTitle);

      // Press Enter to submit the search
      await this.randomDelay(500, 1000);
      await searchBox.press("Enter");

      // Wait for results to load
      logger.info("Waiting for search results to load...");
      await this.page!.waitForLoadState("networkidle", { timeout: 30000 });

      // Give extra time for any JavaScript to run and update the DOM
      await this.randomDelay(2000, 4000);

      // Extract job results
      logger.info("Extracting job results...");
      const jobResults = await this.extractJobResults();

      logger.info(`Found ${jobResults.length} job results`);
      return jobResults;
    } catch (error) {
      logger.error("Error searching for jobs:", error);
      throw error;
    }
  }

  /**
   * Extract job results from the page
   */
  private async extractJobResults(): Promise<JobResult[]> {
    if (!this.page) throw new Error("Page not initialized");

    logger.info("Extracting job results...");

    try {
      // First, try to use Google's specific job card structure
      // Google careers job listings are typically in a grid layout with specific card design
      const googleJobSelectors = [
        ".gc-card", // Google's job card class
        ".gc-job-card",
        ".job-card",
        ".jobs-list-item",
        "[data-search-results-item]", // Data attribute for search result items
        ".search-result-card",
        ".jobs-card",
      ];

      let jobElements: ElementHandle<HTMLElement | SVGElement>[] = [];

      // Try each Google-specific selector
      for (const selector of googleJobSelectors) {
        jobElements = await this.page.$$(selector);
        if (jobElements.length > 0) {
          logger.info(
            `Found ${jobElements.length} job listings using Google-specific selector: ${selector}`
          );
          break;
        }
      }

      // If Google-specific selectors didn't work, try more specific targeting
      if (jobElements.length === 0) {
        logger.info("Trying alternative approach for Google job listings...");

        // Look for job title headings at specific levels, avoiding sidebar/filter elements
        // Inspect the structure to exclude sidebar elements
        const mainContentSelectors = [
          "main",
          "#main-content",
          ".jobs-results-content",
          ".jobs-results",
          ".search-results",
        ];

        let mainContent = null;

        // Find the main content container first
        for (const selector of mainContentSelectors) {
          mainContent = await this.page.$(selector);
          if (mainContent) {
            logger.info(
              `Found main content container using selector: ${selector}`
            );
            break;
          }
        }

        // If we found the main content, search for job cards within it
        if (mainContent) {
          // Look for elements that contain job titles within the main content
          jobElements = await mainContent.$$('h2, h3, h4, [role="listitem"]');
          logger.info(
            `Found ${jobElements.length} potential job elements within main content`
          );

          // Transform heading elements to their parent cards if needed
          if (jobElements.length > 0) {
            const cardElements = [];
            for (const element of jobElements) {
              // Check if this is a heading inside a card or the card itself
              const tagName = await element.evaluate((el) =>
                el.tagName.toLowerCase()
              );
              if (tagName === "h2" || tagName === "h3" || tagName === "h4") {
                // If it's a heading, get its parent which is likely the job card
                const cardElement = await element.evaluateHandle((node) => {
                  // Walk up to find a suitable parent that looks like a card
                  let parent = node.parentElement;
                  for (let i = 0; i < 3 && parent; i++) {
                    // Check if this parent looks like a card container
                    if (
                      parent.classList.contains("card") ||
                      parent.getAttribute("role") === "listitem" ||
                      parent.classList.contains("job") ||
                      parent.tagName === "ARTICLE" ||
                      parent.tagName === "LI"
                    ) {
                      return parent;
                    }
                    parent = parent.parentElement;
                  }
                  // If no suitable parent found, return the immediate parent
                  return node.parentElement;
                });
                cardElements.push(cardElement);
              } else {
                // If it's already a card-like element, use it directly
                cardElements.push(element);
              }
            }
            jobElements = cardElements as ElementHandle<
              HTMLElement | SVGElement
            >[];
          }
        }
      }

      // If we still haven't found job elements, try a Google-specific context evaluation to extract jobs
      if (jobElements.length === 0) {
        logger.info("Using page structure analysis to find job listings...");

        // This is a more complex approach that analyzes the page structure
        const extractedJobs = await this.page.evaluate(() => {
          const results: Array<{
            title: string;
            location: string;
            description: string;
            applyLink: string;
          }> = [];

          // Exclude sidebar elements by their characteristics
          const excludeSelectors = [
            ".filters",
            ".filter-section",
            ".search-filters",
            "#filters",
            '[aria-label="Filters"]',
            "aside",
            ".sidebar",
            ".facets",
          ];

          const excludedElements = Array.from(
            document.querySelectorAll(excludeSelectors.join(","))
          );

          // Function to check if an element is inside any of the excluded elements
          const isInsideExcluded = (element: Element): boolean => {
            for (const excluded of excludedElements) {
              if (excluded.contains(element)) return true;
            }
            return false;
          };

          // First, find all headings that might be job titles
          const headings = Array.from(
            document.querySelectorAll("h2, h3, h4")
          ).filter((heading) => !isInsideExcluded(heading));

          for (const heading of headings) {
            // Skip if this heading is explicitly labeled as a filter or category
            const headingText = heading.textContent?.trim() || "";
            if (
              headingText.toLowerCase().includes("filter") ||
              [
                "search sidebar",
                "locations",
                "experience",
                "skills & qualifications",
                "degree",
                "job types",
                "categories",
              ].includes(headingText.toLowerCase())
            ) {
              continue;
            }

            // Find a link (apply link) near this heading
            let applyLink = "";
            const nearestLink =
              heading.querySelector("a") ||
              heading.parentElement?.querySelector("a") ||
              heading.parentElement?.parentElement?.querySelector("a");
            if (nearestLink) {
              applyLink = nearestLink.getAttribute("href") || "";
            }

            // Find location and description near this heading
            const container =
              heading.closest("article") ||
              heading.closest("li") ||
              heading.closest('div[role="listitem"]') ||
              heading.parentElement?.parentElement;

            let location = "Location not specified";
            let description = "No description available";

            if (container) {
              // Look for location information
              const locationEl = container.querySelector(
                '[class*="location"], [aria-label*="location"], p:not(:first-child)'
              );
              if (locationEl && locationEl.textContent) {
                location = locationEl.textContent.trim();
              }

              // Look for description information
              const descriptionEl = container.querySelector(
                'p, [class*="description"]'
              );
              if (descriptionEl && descriptionEl.textContent) {
                description = descriptionEl.textContent.trim();
              }
            }

            // Only add valid job listings
            if (headingText && headingText.length > 3 && applyLink) {
              results.push({
                title: headingText,
                location,
                description,
                applyLink,
              });
            }
          }

          return results;
        });

        if (extractedJobs.length > 0) {
          logger.info(
            `Extracted ${extractedJobs.length} jobs using page structure analysis`
          );

          // Convert the extracted jobs to JobResult format
          return extractedJobs.map((job) => ({
            title: job.title,
            location: job.location,
            description: job.description,
            applyLink: job.applyLink.startsWith("http")
              ? job.applyLink
              : new URL(
                  job.applyLink,
                  "https://www.google.com/about/careers/applications/"
                ).href,
            postedDate: new Date().toISOString(),
          }));
        }
      }

      // If we still haven't found any jobs, fallback to our generic approach
      if (jobElements.length === 0) {
        logger.info("Falling back to generic job extraction...");
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
        ];

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
      }

      // If we found job elements, extract their data
      if (jobElements.length > 0) {
        const jobResults: JobResult[] = [];

        for (let i = 0; i < Math.min(jobElements.length, 10); i++) {
          try {
            const jobElement = jobElements[i];

            // Extract job title
            const titleElement = await jobElement.$(
              'h2, h3, h4, .title, [class*="title"]'
            );
            const title = titleElement
              ? await titleElement.textContent()
              : null;

            // Extract job location
            const locationElement = await jobElement.$(
              '[class*="location"], [aria-label*="location"], [class*="city"], [class*="address"]'
            );
            const location = locationElement
              ? await locationElement.textContent()
              : null;

            // Extract job description
            const descriptionElement = await jobElement.$(
              'p, [class*="description"], [class*="summary"]'
            );
            const description = descriptionElement
              ? await descriptionElement.textContent()
              : null;

            // Extract apply link
            const linkElement = await jobElement.$("a");
            let applyLink = null;
            if (linkElement) {
              applyLink = await linkElement.getAttribute("href");
              // Make relative URLs absolute
              if (applyLink && !applyLink.startsWith("http")) {
                applyLink = new URL(
                  applyLink,
                  "https://www.google.com/about/careers/applications/"
                ).href;
              }
            }

            // Skip elements that match filter/sidebar categories
            const titleText = title?.toLowerCase() || "";
            if (
              titleText &&
              ![
                "search sidebar",
                "locations",
                "experience",
                "skills & qualifications",
                "degree",
                "job types",
                "categories",
              ].includes(titleText.toLowerCase())
            ) {
              // Only add jobs with at least a title
              if (title) {
                jobResults.push({
                  title: title.trim(),
                  location: location
                    ? location.trim()
                    : "Location not specified",
                  description: description
                    ? description.trim()
                    : "No description available",
                  applyLink: applyLink || "#",
                  postedDate: new Date().toISOString(),
                });
              }
            } else {
              logger.info(`Skipping filter/category element: ${titleText}`);
            }
          } catch (error) {
            logger.error(`Error extracting data from job element ${i}:`, error);
          }
        }

        logger.info(`Found ${jobResults.length} valid job results`);
        return jobResults;
      }

      // If we couldn't find anything, return an empty array
      logger.warn("No job listings found on the page");
      return [];
    } catch (error) {
      logger.error("Error extracting job results:", error);
      return [];
    }
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
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = this.randomNumber(min, max);
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

    logger.info("GoogleJobSearchAgent cleaned up successfully");
  }
}
