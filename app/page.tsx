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
  const [lineParam] = useQueryParam("line");
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
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Production Scheduler
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Optimize your drink production sequence
          </p>
        </div>
        <div className="flex gap-3">
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
            className="btn-secondary"
          >
            Reset
          </button>
          {result && (
            <Link
              href={`/api/export?line=${selectedLine}&drinks=${selectedDrinks.join(
                ","
              )}`}
              className="btn-secondary"
            >
              Export CSV
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-8 pb-16 lg:grid-cols-12">
        <section className="lg:col-span-4 space-y-6">
          {/* Production Line Selection */}
          <div className="panel p-6">
            <div className="section-label">Production Line</div>
            <div className="relative">
              <select
                className="soft-input w-full pr-10"
                value={selectedLine != null ? String(selectedLine) : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateParams((next) => {
                    if (!value) next.delete("line");
                    else next.set("line", value);
                    next.delete("drinks");
                  });
                  setResult(null);
                  setUploadedFileName(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <option value="">Choose a line...</option>
                {lines?.lines.map((line) => (
                  <option key={line} value={String(line)}>
                    Line {line}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
              </svg>
            </div>
          </div>

          {/* Drinks Selection */}
          <div className="panel p-6">
            <div className="section-label">Select Drinks</div>
            <input
              placeholder="Search drinks..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="soft-input w-full mb-4"
            />
            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <div className="max-h-64 overflow-auto custom-scrollbar">
                {!selectedLine && (
                  <div className="p-4 text-sm text-zinc-400 text-center">
                    Select a production line first
                  </div>
                )}
                {selectedLine && !drinksData && (
                  <div className="p-4 text-sm text-zinc-400 text-center">
                    Loading drinks...
                  </div>
                )}
                {filteredDrinks.map((d) => {
                  const isSelected = selectedDrinks.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDrink(d)}
                      className={`drink-item ${isSelected ? "selected" : ""}`}
                      aria-pressed={isSelected}
                    >
                      <span className="truncate pr-3 text-sm">{d}</span>
                      {isSelected && (
                        <span className="badge badge-selected flex-shrink-0">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3">
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
                className="btn-secondary text-sm"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload List
                </span>
              </button>
              {uploadedFileName && (
                <span className="text-xs text-zinc-500 truncate max-w-32">
                  {uploadedFileName}
                </span>
              )}
            </div>

            {selectedDrinks.length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <div className="text-xs font-medium text-zinc-500 mb-2">
                    Selected ({selectedDrinks.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDrinks.map((d, i) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs text-zinc-700"
                      >
                        <span className="text-zinc-400">{i + 1}.</span> {d.length > 20 ? d.slice(0, 20) + "..." : d}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status & Action */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="section-label mb-0">Status</div>
              <div className={`flex items-center gap-2 text-xs font-medium ${
                selectedLine && selectedDrinks.length >= 2 ? "text-emerald-600" : "text-zinc-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  selectedLine && selectedDrinks.length >= 2 ? "bg-emerald-500" : "bg-zinc-300"
                }`} />
                {selectedLine && selectedDrinks.length >= 2 ? "Ready" : "Not ready"}
              </div>
            </div>
            
            <div className="space-y-2.5 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Line</span>
                <span className="font-medium">{selectedLine ? `Line ${selectedLine}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Drinks</span>
                <span className="font-medium">{selectedDrinks.length}</span>
              </div>
            </div>

            <button
              disabled={
                !selectedLine || selectedDrinks.length < 2 || optimizing
              }
              onClick={runOptimization}
              className="btn-primary w-full"
            >
              {optimizing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Optimizing...
                </span>
              ) : (
                "Optimize Schedule"
              )}
            </button>
          </div>
        </section>

        {/* Results Panel */}
        <section className="lg:col-span-8 panel p-6">
          <div className="section-label">Optimized Schedule</div>
          
          {!result ? (
            <div className="empty-state rounded-xl border border-dashed border-zinc-200 mt-2" style={{ minHeight: 320 }}>
              <svg className="w-12 h-12 text-zinc-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm font-medium text-zinc-500">No schedule generated yet</p>
              <p className="text-xs text-zinc-400 mt-1">Select drinks and optimize to see results</p>
            </div>
          ) : (
            <div className="animate-fade-in mt-2">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Total Water Usage
                  </div>
                  <div className="text-xl font-semibold text-zinc-900">
                    {result.totalWaterGallons.toFixed(1)} <span className="text-sm font-normal text-zinc-500">gal</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Water Saved
                  </div>
                  <div className="text-xl font-semibold text-emerald-600">
                    {result.savedWaterGallons.toFixed(1)} <span className="text-sm font-normal text-emerald-500">gal</span>
                  </div>
                  {result.savedWaterGallons === 0 && (
                    <div className="text-xs text-zinc-400 mt-0.5">Already optimal</div>
                  )}
                </div>
              </div>

              {/* Schedule List */}
              <div className="max-h-[400px] overflow-auto custom-scrollbar pr-2">
                {result.optimalSchedule.map((d, index) => (
                  <div key={d} className="schedule-item">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500 mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-zinc-800">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
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
