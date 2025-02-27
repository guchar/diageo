import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { jobTitle, companyId, location, remote } = await req.json();

    if (!jobTitle || !companyId) {
      return NextResponse.json(
        { message: "Job title and company are required" },
        { status: 400 }
      );
    }

    const profile = await prisma.jobProfile.findUnique({
      where: { id: params.id },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Job profile not found" },
        { status: 404 }
      );
    }

    if (profile.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Check if the user has access to the company through any job profile
    const hasCompanyAccess = await prisma.jobProfile.findFirst({
      where: {
        userId: user.id,
        companyId,
      },
    });

    if (!hasCompanyAccess) {
      return NextResponse.json(
        { message: "Company access denied" },
        { status: 403 }
      );
    }

    const updatedProfile = await prisma.jobProfile.update({
      where: { id: params.id },
      data: {
        jobTitle,
        companyId,
        location,
        remote,
      },
      include: { company: true },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating job profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.jobProfile.findUnique({
      where: { id: params.id },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Job profile not found" },
        { status: 404 }
      );
    }

    if (profile.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await prisma.jobProfile.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting job profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
