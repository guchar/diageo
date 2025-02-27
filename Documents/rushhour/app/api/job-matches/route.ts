import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Verify the profile belongs to the user
    const profile = await prisma.jobProfile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch job matches
    const matches = await prisma.jobMatch.findMany({
      where: { jobProfileId: profileId },
      orderBy: { postedDate: "desc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching job matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch job matches" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Job match ID is required" },
        { status: 400 }
      );
    }

    // Get user's job profiles
    const profiles = await prisma.jobProfile.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const profileIds = profiles.map((p) => p.id);

    const jobMatch = await prisma.jobMatch.findFirst({
      where: {
        id,
        jobProfileId: { in: profileIds },
      },
    });

    if (!jobMatch) {
      return NextResponse.json(
        { error: "Job match not found" },
        { status: 404 }
      );
    }

    await prisma.jobMatch.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
