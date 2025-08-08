import { NextResponse } from "next/server";
import { listAvailableLines } from "@/lib/excelLoader";

export const dynamic = "force-static"; // Sheet names rarely change; allow caching

export async function GET() {
  try {
    const lines = listAvailableLines().map((l) => l.line);
    return NextResponse.json({ lines });
  } catch {
    return NextResponse.json(
      { error: "Failed to read workbook" },
      { status: 500 }
    );
  }
}

