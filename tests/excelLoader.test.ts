import { describe, it, expect } from "vitest";
import { listAvailableLines, getDrinksForLine } from "@/lib/excelLoader";

describe("excelLoader", () => {
  it("lists available lines from workbook", () => {
    const lines = listAvailableLines();
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
    // Ensure the object shape
    expect(lines[0]).toHaveProperty("line");
    expect(lines[0]).toHaveProperty("sheetName");
  });

  it("returns drinks for a known line", () => {
    const lines = listAvailableLines();
    const line = lines[0].line;
    const { drinks } = getDrinksForLine(line);
    expect(Array.isArray(drinks)).toBe(true);
    expect(drinks.length).toBeGreaterThan(0);
  });
});

