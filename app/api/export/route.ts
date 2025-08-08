import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { optimizeAcrossStartingNodes, buildAdjacencyMatrix, computeWaterUsed } from "@/lib/optimization";

export const runtime = "nodejs";

const querySchema = z.object({
  line: z.string().transform((v) => Number(v)).pipe(z.number().int().positive()),
  drinks: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).refine((a) => a.length >= 2, "Need at least two drinks"),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    line: url.searchParams.get("line"),
    drinks: url.searchParams.get("drinks") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { line, drinks } = parsed.data;
  const result = optimizeAcrossStartingNodes(line, drinks);
  const matrix = buildAdjacencyMatrix(line, drinks);
  const baseline = computeWaterUsed(drinks, drinks, matrix);
  const saved = baseline - result.cost;

  const rows = [
    ["Line", line.toString()],
    ["Optimal Schedule", result.order.join(" -> ")],
    ["Total Water (gallons)", result.cost.toFixed(2)],
    ["Saved Water vs Baseline (gallons)", saved.toFixed(2)],
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=optimized_schedule_line_${line}.csv`,
      "Cache-Control": "no-store",
    },
  });
}

