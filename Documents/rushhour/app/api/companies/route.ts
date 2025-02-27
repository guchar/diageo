import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CompanySelectors } from "@/lib/types";

const companySchema = z.object({
  name: z.string().min(1),
  careerPageUrl: z.string().url(),
  selectorsConfig: z.object({
    jobTitle: z.string(),
    jobDescription: z.string(),
    jobLocation: z.string(),
    jobType: z.string(),
    applyLink: z.string(),
    postedDate: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = companySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        name: validatedData.name,
        careerPageUrl: validatedData.careerPageUrl,
        selectorsConfig: JSON.stringify(validatedData.selectorsConfig),
        jobProfiles: {
          create: [],
        },
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const companies = await prisma.company.findMany({
      include: {
        jobProfiles: {
          where: { userId: user.id },
          include: { user: true },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new NextResponse("Company ID is required", { status: 400 });
    }

    // First check if the user has any job profiles for this company
    const jobProfile = await prisma.jobProfile.findFirst({
      where: {
        companyId: id,
        userId: user.id,
      },
    });

    if (!jobProfile) {
      return new NextResponse("Company not found", { status: 404 });
    }

    // Delete the job profile
    await prisma.jobProfile.delete({
      where: { id: jobProfile.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
