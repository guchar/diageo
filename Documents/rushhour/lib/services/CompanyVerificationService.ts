import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";
import { CompanySelectors } from "../types";
import { logger } from "../utils/logger";

export class CompanyVerificationService {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async verifyCareerPage(url: string): Promise<{
    isValid: boolean;
    error?: string;
    suggestedSelectors?: CompanySelectors;
  }> {
    if (!this.browser) await this.init();
    const page = await this.browser!.newPage();

    try {
      // Configure page
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      );
      await page.setViewport({ width: 1920, height: 1080 });

      // Try to access the page
      const response = await page.goto(url, { waitUntil: "networkidle0" });

      if (!response || response.status() !== 200) {
        return {
          isValid: false,
          error: `Failed to access career page: ${response?.status()} ${response?.statusText()}`,
        };
      }

      // Attempt to auto-detect selectors
      const suggestedSelectors = await this.detectSelectors(page);

      if (!suggestedSelectors) {
        return {
          isValid: false,
          error: "Could not detect job listing elements",
        };
      }

      // Verify the detected selectors work
      const testResults = await this.testSelectors(page, suggestedSelectors);

      return {
        isValid: testResults.isValid,
        error: testResults.error,
        suggestedSelectors: testResults.isValid
          ? suggestedSelectors
          : undefined,
      };
    } catch (error) {
      logger.error("Error verifying career page:", error);
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      await page.close();
    }
  }

  private async detectSelectors(page: Page): Promise<CompanySelectors | null> {
    // Common selector patterns for job listings
    const selectorPatterns = {
      jobTitle: [
        ".job-title",
        ".position-title",
        "h2.title",
        "[data-test='job-title']",
        ".careers-listing h3",
      ],
      jobDescription: [
        ".job-description",
        ".position-description",
        "[data-test='job-description']",
        ".careers-listing p",
      ],
      jobLocation: [
        ".job-location",
        ".position-location",
        "[data-test='job-location']",
        ".careers-listing .location",
      ],
      applyLink: [
        ".apply-button",
        ".apply-link",
        "[data-test='apply-button']",
        "a[href*='apply']",
        "a[href*='job']",
      ],
    };

    const detectedSelectors: CompanySelectors = {
      jobTitle: "",
      jobDescription: "",
      jobLocation: "",
      applyLink: "",
      fallbackSelectors: [],
    };

    // Test each pattern and use the first one that finds elements
    for (const [key, patterns] of Object.entries(selectorPatterns)) {
      for (const pattern of patterns) {
        const elements = await page.$$(pattern);
        if (elements.length > 0) {
          detectedSelectors[key as keyof typeof selectorPatterns] = pattern;
          // Add unsuccessful patterns as fallback selectors
          detectedSelectors.fallbackSelectors = patterns.filter(
            (p) => p !== pattern
          );
          break;
        }
      }
    }

    // Check if we found all required selectors
    const requiredSelectors: (keyof CompanySelectors)[] = [
      "jobTitle",
      "jobDescription",
      "jobLocation",
      "applyLink",
    ];

    const hasAllRequired = requiredSelectors.every(
      (selector) => detectedSelectors[selector]
    );

    return hasAllRequired ? detectedSelectors : null;
  }

  private async testSelectors(
    page: Page,
    selectors: CompanySelectors
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Test job title selector
      const titles = await page.$$(selectors.jobTitle);
      if (titles.length === 0) {
        return {
          isValid: false,
          error: "No job titles found with the detected selector",
        };
      }

      // Test if we can extract all required information from at least one job listing
      const jobData = await page.evaluate((config: CompanySelectors) => {
        const listing = document.querySelector(config.jobTitle);
        if (!listing) return null;

        return {
          title: listing.textContent,
          description: document.querySelector(config.jobDescription)
            ?.textContent,
          location: document.querySelector(config.jobLocation)?.textContent,
          applyLink: document
            .querySelector(config.applyLink)
            ?.getAttribute("href"),
        };
      }, selectors);

      if (
        !jobData ||
        !jobData.title ||
        !jobData.description ||
        !jobData.location ||
        !jobData.applyLink
      ) {
        return {
          isValid: false,
          error: "Could not extract all required information from job listings",
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error:
          "Error testing selectors: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
