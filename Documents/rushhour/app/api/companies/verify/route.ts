import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CompanyVerificationService } from "@/lib/services/CompanyVerificationService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { message: "Career page URL is required" },
        { status: 400 }
      );
    }

    const verificationService = new CompanyVerificationService();
    try {
      const result = await verificationService.verifyCareerPage(url);
      return NextResponse.json(result);
    } finally {
      await verificationService.cleanup();
    }
  } catch (error) {
    console.error("Error verifying company:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
