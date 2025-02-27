import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const jobProfileSchema = z.object({
  jobTitle: z.string().min(1),
  companyId: z.string().min(1),
  location: z.string().optional(),
  remote: z.boolean().default(false),
});

const prismaClient = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profiles = await prisma.jobProfile.findMany({
      where: { userId: session.user.id },
      include: {
        company: true,
        jobMatches: {
          orderBy: { postedDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Error fetching job profiles:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/job-profiles - Starting request");

    const session = await auth();
    console.log("Session data:", session);

    if (!session?.user?.id) {
      console.log("Unauthorized - No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);

    const { jobTitle, company, careerPageUrl, location, remote } = body;

    // Validate input
    if (!jobTitle || !company || !careerPageUrl) {
      console.log("Validation failed - Missing required fields");
      return NextResponse.json(
        { error: "Job title, company, and career page URL are required" },
        { status: 400 }
      );
    }

    // Determine job board platform from URL
    let jobBoardPlatform = "custom";
    if (careerPageUrl.includes("greenhouse.io")) {
      jobBoardPlatform = "greenhouse";
    } else if (careerPageUrl.includes("lever.co")) {
      jobBoardPlatform = "lever";
    } else if (careerPageUrl.includes("workday")) {
      jobBoardPlatform = "workday";
    }

    // Get appropriate selectors based on the platform
    const selectors = getSelectorsForPlatform(jobBoardPlatform);

    const companyId = company.toLowerCase().replace(/\s+/g, "-");
    console.log("Generated company ID:", companyId);

    // Create job profile
    console.log("Creating job profile with data:", {
      jobTitle,
      location,
      remote,
      userId: session.user.id,
      companyId,
      careerPageUrl,
      jobBoardPlatform,
    });

    const jobProfile = await prisma.jobProfile.create({
      data: {
        jobTitle,
        location: location || null,
        remote,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        company: {
          connectOrCreate: {
            where: { id: companyId },
            create: {
              id: companyId,
              name: company,
              careerPageUrl,
              jobBoardPlatform,
              selectorsConfig: JSON.stringify(selectors),
            },
          },
        },
      },
      include: {
        company: true,
        user: true,
      },
    });

    console.log("Job profile created:", jobProfile);
    return NextResponse.json(jobProfile, { status: 201 });
  } catch (error) {
    console.error("Error creating job profile:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to create job profile" },
      { status: 500 }
    );
  }
}

function getSelectorsForPlatform(platform: string) {
  switch (platform) {
    case "greenhouse":
      return {
        jobTitleSelector: ".opening-title",
        locationSelector: ".location",
        applyLinkSelector: ".apply-button",
        listingSelector: ".opening",
      };
    case "lever":
      return {
        jobTitleSelector: ".posting-title h5",
        locationSelector: ".posting-categories .location",
        applyLinkSelector: ".posting-apply",
        listingSelector: ".posting",
      };
    case "workday":
      return {
        jobTitleSelector: ".WGDC .gwt-Label",
        locationSelector: ".WGDC .gwt-Label[aria-label*='Location']",
        applyLinkSelector: ".WGDC a[aria-label*='Apply']",
        listingSelector: ".WGDC [role='row']",
      };
    default:
      return {
        jobTitleSelector: "h1, h2, h3, .job-title",
        locationSelector: ".location, [data-location]",
        applyLinkSelector: "a[href*='apply'], .apply-button",
        listingSelector: ".job-listing, .job-post, .job-card",
      };
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/job-profiles - Starting request");

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Verify the profile belongs to the user
    const profile = await prisma.jobProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.jobProfile.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting job profile:", error);
    return NextResponse.json(
      { error: "Failed to delete job profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log("PUT /api/job-profiles - Starting request");

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { jobTitle, location, remote } = body;

    // Verify the profile belongs to the user
    const profile = await prisma.jobProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedProfile = await prisma.jobProfile.update({
      where: { id },
      data: {
        jobTitle,
        location: location || null,
        remote,
      },
      include: {
        company: true,
        user: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating job profile:", error);
    return NextResponse.json(
      { error: "Failed to update job profile" },
      { status: 500 }
    );
  }
}
