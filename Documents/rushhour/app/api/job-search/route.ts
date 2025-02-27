import { NextRequest, NextResponse } from "next/server";
import { GoogleJobSearchAgent } from "@/lib/agents/GoogleJobSearchAgent";
import { JobSearchAgent } from "@/lib/agents/JobSearchAgent";
import { logger } from "@/lib/utils/logger";
import { getCurrentUser } from "@/lib/auth";

interface JobSearchRequest {
  jobTitle: string;
  companyUrl: string;
}

export async function POST(req: Request) {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = performance.now();
    const body: JobSearchRequest = await req.json();
    const { jobTitle, companyUrl } = body;

    // Validate parameters
    if (!jobTitle) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }

    if (!companyUrl) {
      return NextResponse.json(
        { error: "Company URL is required" },
        { status: 400 }
      );
    }

    logger.info(`Searching for "${jobTitle}" at ${companyUrl}`);

    // Determine which agent to use based on URL
    let agent;
    if (companyUrl.includes("google.com")) {
      logger.info("Using Google job search agent");
      agent = new GoogleJobSearchAgent();
    } else {
      logger.info("Using generic job search agent");
      agent = new JobSearchAgent({
        careerPageUrl: companyUrl,
        companyName: "Custom Company",
      });
    }

    try {
      await agent.init();
      const jobs = await agent.searchJobs(jobTitle);
      const endTime = performance.now();
      const timeTaken = (endTime - startTime) / 1000; // Convert to seconds

      logger.info(
        `Search completed in ${timeTaken.toFixed(2)} seconds, found ${
          jobs.length
        } jobs`
      );

      return NextResponse.json({
        jobs,
        timeTaken,
      });
    } finally {
      // Ensure resources are cleaned up
      await agent.cleanup();
    }
  } catch (error) {
    let errorMessage = "An error occurred while searching for jobs";
    if (error instanceof Error) {
      errorMessage = error.message;
      logger.error(`Job search error: ${errorMessage}`, error);
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
