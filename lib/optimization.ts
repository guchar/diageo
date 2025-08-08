import * as XLSX from "xlsx";
// Note: excelLoader used elsewhere; no direct usage here
import path from "node:path";
import fs from "node:fs";

type Matrix = number[][];

interface OptimizationResult {
  cost: number;
  order: string[];
}

function readNormalizedRows(line: number): Record<string, unknown>[] {
  const dataPath = path.join(process.cwd(), "data", "CIP Combined.xlsx");
  const fileBuffer = fs.readFileSync(dataPath);
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const ws = wb.Sheets[`Line ${line}`];
  if (!ws) throw new Error(`Sheet not found for line ${line}`);
  const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: 8000,
  });
  // Normalize string values (trim); mapping already handled in excelLoader
  return json.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      out[typeof k === "string" ? k.trim() : String(k)] =
        typeof v === "string" ? v.trim() : v;
    }
    return out;
  });
}

export function buildAdjacencyMatrix(line: number, drinks: string[]): Matrix {
  const rows = readNormalizedRows(line);
  const drinkToRow: Record<string, Record<string, unknown>> = {};
  for (const row of rows) {
    const name = String(row["Drinks"] ?? "").trim();
    if (name) drinkToRow[name] = row;
  }

  const n = drinks.length;
  const matrix: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) {
        matrix[i][j] = 0;
        continue;
      }
      const from = drinkToRow[drinks[i]] ?? {};
      const raw = (from as Record<string, unknown>)[drinks[j]];
      const val = typeof raw === "number" ? raw : Number(raw);
      matrix[i][j] = Number.isFinite(val) ? (val as number) : 8000;
    }
  }
  return matrix;
}

export function computeWaterUsed(
  order: string[],
  drinks: string[],
  matrix: Matrix
): number {
  const index: Record<string, number> = Object.fromEntries(
    drinks.map((d, idx) => [d, idx])
  );
  let total = 0;
  for (let i = 0; i < order.length - 1; i += 1) {
    const from = index[order[i]];
    const to = index[order[i + 1]];
    total += matrix[from][to];
  }
  return total;
}

// Held–Karp variant for Hamiltonian path (no return edge), start at node 0
export function heldKarpPath(
  matrix: Matrix,
  names: string[]
): OptimizationResult {
  const n = matrix.length;
  const C: Record<string, [number, number]> = {};
  function key(bits: number, k: number): string {
    return `${bits}|${k}`;
  }

  for (let k = 1; k < n; k += 1) {
    C[key(1 << k, k)] = [matrix[0][k], 0];
  }

  for (let subsetSize = 2; subsetSize < n; subsetSize += 1) {
    // subsets of size subsetSize from nodes 1..n-1
    const nodes = Array.from({ length: n - 1 }, (_, i) => i + 1);
    const combos = combinations(nodes, subsetSize);
    for (const subset of combos) {
      let bits = 0;
      for (const bit of subset) bits |= 1 << bit;
      for (const k of subset) {
        const prevBits = bits & ~(1 << k);
        let best: [number, number] | null = null;
        for (const m of subset) {
          if (m === k) continue;
          const prev = C[key(prevBits, m)];
          if (!prev) continue;
          const cost = prev[0] + matrix[m][k];
          if (!best || cost < best[0]) best = [cost, m];
        }
        if (best) C[key(bits, k)] = best;
      }
    }
  }

  const allBits = (1 << n) - 1;
  const subsetBits = allBits & ~1; // exclude start node 0
  let bestEnd = -1;
  let bestCost = Number.POSITIVE_INFINITY;
  for (let k = 1; k < n; k += 1) {
    const entry = C[key(subsetBits, k)];
    if (entry && entry[0] < bestCost) {
      bestCost = entry[0];
      bestEnd = k;
    }
  }

  // Backtrack path
  const pathIdx: number[] = [bestEnd];
  let bits = subsetBits;
  let parent = bestEnd;
  for (let i = n - 2; i >= 1; i -= 1) {
    const entry = C[key(bits, parent)];
    if (!entry) break;
    const prev = entry[1];
    pathIdx.push(prev);
    bits &= ~(1 << parent);
    parent = prev;
  }
  pathIdx.push(0);
  pathIdx.reverse();

  const order = pathIdx.map((i) => names[i]);
  return { cost: computeWaterUsed(order, names, matrix), order };
}

export function optimizeAcrossStartingNodes(
  line: number,
  selected: string[]
): OptimizationResult {
  const names = selected;
  let best: OptimizationResult | null = null;
  for (let s = 0; s < names.length; s += 1) {
    const rotated = [...names.slice(s), ...names.slice(0, s)];
    const matrix = buildAdjacencyMatrix(line, rotated);
    const res = heldKarpPath(matrix, rotated);
    if (!best || res.cost < best.cost) best = res;
  }
  return best as OptimizationResult;
}

function combinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = array.length;
  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < n; i += 1) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

export type { OptimizationResult };
