import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDrinksForLine } from "@/lib/excelLoader";

const querySchema = z.object({
  line: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ line: url.searchParams.get("line") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid line" }, { status: 400 });
  }
  try {
    const data = getDrinksForLine(parsed.data.line);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load drinks for line" },
      { status: 404 }
    );
  }
}

