"use client";
import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type OptimizeResponse = {
  line: number;
  optimalSchedule: string[];
  totalWaterGallons: number;
  savedWaterGallons: number;
};

function useQueryParam(name: string): [string | null, (v: string | null) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const value = params.get(name);
  function setValue(v: string | null) {
    const next = new URLSearchParams(params.toString());
    if (v == null || v === "") next.delete(name);
    else next.set(name, v);
    router.push(`/?${next.toString()}`);
  }
  return [value, setValue];
}

function SchedulerApp() {
  const [lineParam, setLineParam] = useQueryParam("line");
  const [drinksParam, setDrinksParam] = useQueryParam("drinks");
  const selectedLine = lineParam ? Number(lineParam) : undefined;
  const selectedDrinks = useMemo(
    () => (drinksParam ? drinksParam.split(",").filter(Boolean) : []),
    [drinksParam]
  );

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
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = text
        .replace(/\r\n?/g, "\n")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      const dedup = Array.from(new Set(parsed));
      setDrinksParam(dedup.join(","));
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold">Drink Production Scheduler</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setLineParam(null);
              setDrinksParam(null);
              setResult(null);
            }}
            className="rounded border px-3 py-2 text-sm bg-white"
          >
            Reset
          </button>
          {result && (
            <Link
              href={`/api/export?line=${selectedLine}&drinks=${selectedDrinks.join(",")}`}
              className="rounded border px-3 py-2 text-sm bg-white"
            >
              Export
            </Link>
          )}
        </div>
      </header>

      <main className="grid gap-6 px-6 pb-12 md:grid-cols-3">
        <section className="md:col-span-1 space-y-4">
          <div className="rounded border bg-white p-4">
            <h2 className="text-sm font-medium">Select Production Line</h2>
            <p className="text-xs text-gray-500 mb-2">Choose the production line for scheduling optimization</p>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={selectedLine ?? ""}
              onChange={(e) => {
                setLineParam(e.target.value || null);
                setDrinksParam(null);
                setResult(null);
              }}
            >
              <option value="">Select line</option>
              {lines?.lines.map((line) => (
                <option key={line} value={line}>
                  Line {line}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded border bg-white p-4">
            <h2 className="text-sm font-medium">Select Drinks</h2>
            <p className="text-xs text-gray-500 mb-2">Choose drinks from the dropdown or upload a file</p>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              multiple
              size={6}
              disabled={!drinksData}
              value={selectedDrinks}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                setDrinksParam(values.join(","));
              }}
            >
              {!selectedLine && <option>Select production line first</option>}
              {drinksData?.drinks.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <input type="file" accept=".txt,.csv" onChange={onUploadChange} />
            </div>
          </div>

          <div className="rounded border bg-white p-4">
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
                <span>{selectedLine && selectedDrinks.length >= 2 ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <h2 className="text-sm font-medium">Run Optimization</h2>
            <button
              disabled={!selectedLine || selectedDrinks.length < 2 || optimizing}
              onClick={runOptimization}
              className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {optimizing ? "Running..." : "Optimize Production Schedule"}
            </button>
          </div>
        </section>

        <section className="md:col-span-2 rounded border bg-white p-4">
          <h2 className="text-sm font-medium">Production Schedule</h2>
          {!result ? (
            <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
              No drinks selected
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <ol className="list-decimal pl-5">
                {result.optimalSchedule.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ol>
              <div className="text-sm">
                <div>Total Water: {result.totalWaterGallons.toFixed(2)} gallons</div>
                <div>Saved Water: {result.savedWaterGallons.toFixed(2)} gallons</div>
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
