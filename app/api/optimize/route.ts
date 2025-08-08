import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  optimizeAcrossStartingNodes,
  buildAdjacencyMatrix,
  computeWaterUsed,
} from "@/lib/optimization";

const bodySchema = z.object({
  line: z.number().int().positive(),
  drinks: z.array(z.string().min(1)).min(2),
  initialSchedule: z.array(z.string().min(1)).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { line, drinks, initialSchedule } = parsed.data;
  if (drinks.length > 18) {
    return NextResponse.json(
      { error: "Too many drinks for exact optimization" },
      { status: 422 }
    );
  }

  const optimal = optimizeAcrossStartingNodes(line, drinks);
  const matrix = buildAdjacencyMatrix(line, drinks);
  const baselineOrder =
    initialSchedule && initialSchedule.length > 1 ? initialSchedule : drinks;
  const baseline = computeWaterUsed(baselineOrder, drinks, matrix);
  const saved = baseline - optimal.cost;
  return NextResponse.json({
    line,
    optimalSchedule: optimal.order,
    totalWaterGallons: round2(optimal.cost),
    savedWaterGallons: round2(saved),
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
