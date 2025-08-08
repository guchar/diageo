import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs"; // requires FormData parsing on server

const fileSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  size: z.number().max(256 * 1024).optional(), // 256KB limit for safety
});

function parseTextToDrinks(text: string): string[] {
  const raw = text
    .replace(/\r\n?/g, "\n")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(raw));
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const meta = fileSchema.safeParse({ name: file.name, type: file.type, size: file.size });
  if (!meta.success) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  const text = await file.text();
  const drinks = parseTextToDrinks(text);
  return NextResponse.json({ drinks });
}

