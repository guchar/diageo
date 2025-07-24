import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import Layout from "./components/Layout";
import ProductionLineSelector from "./components/ProductionLineSelector";
import DrinkSelector from "./components/DrinkSelector";
import Results from "./components/Results";
import { api } from "./services/api";
import type { OptimizationResponse } from "./types/api";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [results, setResults] = useState<OptimizationResponse | null>(null);

  const optimizationMutation = useMutation({
    mutationFn: api.optimizeSchedule,
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      console.error("Optimization error:", error);
    },
  });

  const handleLineChange = (line: number) => {
    setSelectedLine(line);
    setSelectedDrinks([]);
    setResults(null);
  };

  const handleDrinksChange = (drinks: string[]) => {
    setSelectedDrinks(drinks);
    setResults(null);
  };

  const handleOptimize = () => {
    if (selectedLine && selectedDrinks.length > 0) {
      optimizationMutation.mutate({
        line_number: selectedLine,
        drinks: selectedDrinks,
      });
    }
  };

  const canOptimize = selectedLine !== null && selectedDrinks.length > 1;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Production Schedule Optimizer
          </h2>
          <p className="text-gray-600">
            Select a production line and drinks to optimize your cleaning
            schedule and minimize water usage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configuration
              </h3>

              <ProductionLineSelector
                selectedLine={selectedLine}
                onLineChange={handleLineChange}
              />

              <DrinkSelector
                selectedLine={selectedLine}
                selectedDrinks={selectedDrinks}
                onDrinksChange={handleDrinksChange}
              />

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleOptimize}
                  disabled={!canOptimize || optimizationMutation.isPending}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    canOptimize && !optimizationMutation.isPending
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {optimizationMutation.isPending
                    ? "Optimizing..."
                    : "Optimize Schedule"}
                </button>

                {!canOptimize && selectedDrinks.length <= 1 && (
                  <p className="text-sm text-gray-500 text-center">
                    Please select at least 2 drinks to optimize
                  </p>
                )}

                {selectedDrinks.length > 0 && (
                  <div className="text-sm text-gray-600 text-center">
                    Selected {selectedDrinks.length} drink
                    {selectedDrinks.length !== 1 ? "s" : ""}
                    {selectedLine && ` from Line ${selectedLine}`}
                  </div>
                )}
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                How it works
              </h4>
              <p className="text-sm text-blue-700">
                Our optimization algorithm uses the Held-Karp dynamic
                programming approach to solve the Traveling Salesman Problem,
                finding the production sequence that minimizes CIP cleaning
                water usage between drinks.
              </p>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            <Results
              results={results}
              isLoading={optimizationMutation.isPending}
              error={optimizationMutation.error?.message || null}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
