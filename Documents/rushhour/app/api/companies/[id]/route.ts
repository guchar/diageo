import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        jobProfiles: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        jobProfiles: {
          where: {
            userId: user.id,
          },
          include: {
            jobMatches: {
              orderBy: {
                postedDate: "desc",
              },
              take: 5,
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
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

    // First check if the user has any job profiles for this company
    const jobProfile = await prisma.jobProfile.findFirst({
      where: {
        companyId: params.id,
        userId: user.id,
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    // Delete the job profile
    await prisma.jobProfile.delete({
      where: { id: jobProfile.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
