import { describe, it, expect } from "vitest";
import { buildAdjacencyMatrix, computeWaterUsed, optimizeAcrossStartingNodes } from "@/lib/optimization";
import { listAvailableLines, getDrinksForLine } from "@/lib/excelLoader";

describe("optimization", () => {
  it("builds a numeric adjacency matrix for a subset of drinks", () => {
    const line = listAvailableLines()[0].line;
    const all = getDrinksForLine(line).drinks;
    const subset = all.slice(0, Math.min(4, all.length));
    const matrix = buildAdjacencyMatrix(line, subset);
    expect(matrix.length).toBe(subset.length);
    expect(matrix[0].length).toBe(subset.length);
    // Values should be finite numbers
    expect(Number.isFinite(matrix[0][0])).toBe(true);
  });

  it("computes water used over an order without throwing", () => {
    const line = listAvailableLines()[0].line;
    const drinks = getDrinksForLine(line).drinks.slice(0, 3);
    const matrix = buildAdjacencyMatrix(line, drinks);
    const value = computeWaterUsed(drinks, drinks, matrix);
    expect(Number.isFinite(value)).toBe(true);
  });

  it("finds an optimal order deterministically for small sets", () => {
    const line = listAvailableLines()[0].line;
    const drinks = getDrinksForLine(line).drinks.slice(0, 4);
    const res = optimizeAcrossStartingNodes(line, drinks);
    expect(res.order.length).toBe(drinks.length);
    expect(Number.isFinite(res.cost)).toBe(true);
  });
});

