import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";

export interface LineSheet {
  line: number;
  sheetName: string;
}

export interface DrinksTable {
  line: number;
  drinks: string[];
}

// Mapping from cleaning process labels to numeric costs (gallons)
export const CLEANING_PROCESS_MAPPING: Record<string, number> = {
  A: 0,
  "A/VR": 1002.32,
  VR: 1002.32,
  "CIP 3": 2860.15,
  "CIP 5": 7500,
  H: 5,
  K: 6,
};

let cachedWorkbook: XLSX.WorkBook | null = null;

function getWorkbook(): XLSX.WorkBook {
  if (cachedWorkbook) return cachedWorkbook;
  const dataPath = path.join(process.cwd(), "data", "CIP Combined.xlsx");
  const fileBuffer = fs.readFileSync(dataPath);
  cachedWorkbook = XLSX.read(fileBuffer, { type: "buffer" });
  return cachedWorkbook;
}

export function listAvailableLines(): LineSheet[] {
  const wb = getWorkbook();
  const lines: LineSheet[] = [];
  for (const name of wb.SheetNames) {
    const match = name.match(/^Line\s+(\d+)$/i);
    if (match) {
      lines.push({ line: Number(match[1]), sheetName: name });
    }
  }
  return lines.sort((a, b) => a.line - b.line);
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "");
}

export function getDrinksForLine(line: number): DrinksTable {
  const wb = getWorkbook();
  const sheetName = `Line ${line}`;
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    throw new Error(`Sheet not found for line ${line}`);
  }
  const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: 8000, // default value parity with original script
  });

  // Normalize headers
  const normalized = json.map((row) => {
    const entry: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      const k = trimString(key);
      // Apply mapping for process labels when cell value is one of the labels
      let v: unknown = val;
      if (typeof v === "string") {
        const maybe =
          CLEANING_PROCESS_MAPPING[
            v.trim() as keyof typeof CLEANING_PROCESS_MAPPING
          ];
        if (maybe !== undefined) v = maybe;
      }
      entry[k] = v;
    }
    return entry;
  });

  // Assume a "Drinks" column exists
  const drinks = Array.from(
    new Set(
      normalized
        .map((row) => trimString((row as Record<string, unknown>)["Drinks"]))
        .filter((name) => name.length > 0)
    )
  );

  return { line, drinks };
}
