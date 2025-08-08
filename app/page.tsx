"use client";
import { Suspense, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type OptimizeResponse = {
  line: number;
  optimalSchedule: string[];
  totalWaterGallons: number;
  savedWaterGallons: number;
};

function useQueryParam(
  name: string
): [string | null, (v: string | null) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const value = params.get(name);
  function setValue(v: string | null) {
    const next = new URLSearchParams(params.toString());
    if (v == null || v === "") next.delete(name);
    else next.set(name, v);
    const query = next.toString();
    router.push(query ? `/?${query}` : "/");
  }
  return [value, setValue];
}

function useQueryParamsUpdater(): (
  updater: (next: URLSearchParams) => void
) => void {
  const params = useSearchParams();
  const router = useRouter();
  return function update(updater: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    updater(next);
    const query = next.toString();
    router.push(query ? `/?${query}` : "/");
  };
}

function SchedulerApp() {
  const [lineParam, setLineParam] = useQueryParam("line");
  const [drinksParam, setDrinksParam] = useQueryParam("drinks");
  const updateParams = useQueryParamsUpdater();
  const selectedLine = lineParam ? Number(lineParam) : undefined;
  const selectedDrinks = useMemo(
    () => (drinksParam ? drinksParam.split(",").filter(Boolean) : []),
    [drinksParam]
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const { data: lines } = useQuery({
    queryKey: ["lines"],
    queryFn: async () => {
      const res = await fetch("/api/lines");
      return (await res.json()) as { lines: number[] };
    },
  });

  const { data: drinksData } = useQuery({
    queryKey: ["drinks", selectedLine],
    enabled: !!selectedLine,
    queryFn: async () => {
      const res = await fetch(`/api/drinks?line=${selectedLine}`);
      return (await res.json()) as { line: number; drinks: string[] };
    },
  });

  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  function parseCsvTokens(text: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
        const cleaned = current.replace(/\r/g, "").replace(/\n/g, " ").trim();
        if (cleaned) tokens.push(cleaned);
        current = "";
      } else {
        current += ch;
      }
    }
    const cleaned = current.replace(/\r/g, "").replace(/\n/g, " ").trim();
    if (cleaned) tokens.push(cleaned);
    return Array.from(new Set(tokens));
  }

  function normalizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  async function runOptimization() {
    if (!selectedLine || selectedDrinks.length < 2) return;
    setOptimizing(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line: selectedLine, drinks: selectedDrinks }),
      });
      const json = (await res.json()) as OptimizeResponse;
      setResult(json);
    } finally {
      setOptimizing(false);
    }
  }

  function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const tokens = parseCsvTokens(text);
      // If we know the drinks for the selected line, filter/map to canonical names
      let finalList = tokens;
      const available = drinksData?.drinks ?? [];
      if (available.length > 0) {
        const normalizedToOriginal = new Map<string, string>();
        for (const d of available) {
          normalizedToOriginal.set(normalizeName(d), d);
        }
        finalList = tokens
          .map((t) => normalizedToOriginal.get(normalizeName(t)) ?? null)
          .filter((v): v is string => Boolean(v));
      }
      const dedup = Array.from(new Set(finalList));
      setDrinksParam(dedup.join(","));
    };
    reader.readAsText(file);
  }

  function toggleDrink(drink: string) {
    if (!drink) return;
    const next = new Set(selectedDrinks);
    if (next.has(drink)) next.delete(drink);
    else next.add(drink);
    setDrinksParam(Array.from(next).join(","));
  }

  const [filter, setFilter] = useState("");
  const filteredDrinks = useMemo(() => {
    const list = drinksData?.drinks ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => d.toLowerCase().includes(q));
  }, [drinksData?.drinks, filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Drink Production Scheduler
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Plan, optimize, and export production runs with a calm, focused UI.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              updateParams((next) => {
                next.delete("line");
                next.delete("drinks");
              });
              setResult(null);
              setUploadedFileName(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="rounded border px-3 py-2 text-sm bg-white hover:bg-gray-50"
          >
            Reset
          </button>
          {result && (
            <Link
              href={`/api/export?line=${selectedLine}&drinks=${selectedDrinks.join(
                ","
              )}`}
              className="rounded border px-3 py-2 text-sm bg-white hover:bg-gray-50"
            >
              Export
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-12">
        <section className="lg:col-span-4 space-y-4">
          <div className="panel p-4">
            <h2 className="text-sm font-medium">Select Production Line</h2>
            <p className="text-xs text-gray-500 mb-2">
              Choose the production line for scheduling optimization
            </p>
            <div className="relative">
              <select
                className="soft-input mt-1 w-full pr-9"
                value={selectedLine != null ? String(selectedLine) : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateParams((next) => {
                    if (!value) next.delete("line");
                    else next.set("line", value);
                    next.delete("drinks");
                  });
                  setResult(null);
                  // Clear any uploaded file indicator when switching lines
                  setUploadedFileName(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <option value="">Select line</option>
                {lines?.lines.map((line) => (
                  <option key={line} value={String(line)}>
                    Line {line}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
              </svg>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-medium">Select Drinks</h2>
            <p className="text-xs text-gray-500 mb-2">
              Tap to add/remove drinks. Upload a list file if you prefer.
            </p>
            <input
              placeholder="Search drinks…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="soft-input mb-2 w-full"
            />
            <div className="mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200">
              {!selectedLine && (
                <div className="p-3 text-sm text-gray-500">
                  Select production line first
                </div>
              )}
              {selectedLine && !drinksData && (
                <div className="p-3 text-sm text-gray-500">Loading drinks…</div>
              )}
              {filteredDrinks.map((d) => {
                const isSelected = selectedDrinks.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDrink(d)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="truncate pr-2">{d}</span>
                    {isSelected && (
                      <span className="ml-2 inline-flex h-5 items-center rounded-sm bg-gray-100 px-1.5 text-[11px] text-gray-600">
                        Added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={onUploadChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="soft-input px-3 py-2 text-sm hover:bg-gray-50"
              >
                Upload list
              </button>
              {uploadedFileName && (
                <span className="text-xs text-gray-500 truncate">
                  {uploadedFileName}
                </span>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-medium text-gray-700 mb-1">
                Drinks chosen
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedDrinks.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-48">{d}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${d}`}
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => toggleDrink(d)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedDrinks.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-medium">Status</h2>
            <div className="text-sm mt-2 space-y-1">
              <div>
                <span className="text-gray-500">Production Line:</span>{" "}
                <span>{selectedLine ?? "None selected"}</span>
              </div>
              <div>
                <span className="text-gray-500">Drinks:</span>{" "}
                <span>{selectedDrinks.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{" "}
                <span>{optimizing ? "Optimizing" : "Waiting"}</span>
              </div>
              <div>
                <span className="text-gray-500">Ready to Optimize:</span>{" "}
                <span>
                  {selectedLine && selectedDrinks.length >= 2 ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-medium">Run Optimization</h2>
            <button
              disabled={
                !selectedLine || selectedDrinks.length < 2 || optimizing
              }
              onClick={runOptimization}
              className="mt-3 w-full rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {optimizing ? "Running..." : "Optimize Production Schedule"}
            </button>
          </div>
        </section>

        <section className="lg:col-span-8 panel p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-medium">Production Schedule</h2>
              <p className="text-xs text-gray-500 mt-1">
                Ordered list of runs based on your current selections.
              </p>
            </div>
          </div>
          {!result ? (
            <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-gray-200 text-gray-500 text-sm">
              Select drinks on the left to generate a schedule.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="max-h-[520px] overflow-auto rounded-xl">
                <ol className="list-decimal pl-5 pr-2 space-y-1.5 text-sm">
                  {result.optimalSchedule.map((d) => (
                    <li key={d} className="leading-6">
                      <span className="font-medium">{d}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat
                  label="Total Water"
                  value={`${result.totalWaterGallons.toFixed(2)} gallons`}
                />
                <Stat
                  label="Saved Water"
                  value={`${result.savedWaterGallons.toFixed(2)} gallons`}
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SchedulerApp />
    </Suspense>
  );
}
