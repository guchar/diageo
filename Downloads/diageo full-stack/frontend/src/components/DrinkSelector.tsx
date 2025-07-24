import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

interface DrinkSelectorProps {
  selectedLine: number | null;
  selectedDrinks: string[];
  onDrinksChange: (drinks: string[]) => void;
}

function DrinkSelector({
  selectedLine,
  selectedDrinks,
  onDrinksChange,
}: DrinkSelectorProps) {
  const [inputMethod, setInputMethod] = useState<"dropdown" | "file">(
    "dropdown"
  );

  const {
    data: drinksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["drinks", selectedLine],
    queryFn: () =>
      selectedLine
        ? api.getDrinks(selectedLine)
        : Promise.resolve({ drinks: [] }),
    enabled: !!selectedLine,
  });

  const handleDrinkToggle = (drink: string) => {
    if (selectedDrinks.includes(drink)) {
      onDrinksChange(selectedDrinks.filter((d) => d !== drink));
    } else {
      onDrinksChange([...selectedDrinks, drink]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedLine) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const drinks = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        onDrinksChange(drinks);
      };
      reader.readAsText(file);
    }
  };

  const clearSelection = () => {
    onDrinksChange([]);
  };

  if (!selectedLine) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Drinks
        </label>
        <div className="bg-gray-100 border border-gray-300 text-gray-500 px-4 py-8 rounded-md text-center">
          Please select a production line first
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Select Drinks
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setInputMethod("dropdown")}
            className={`px-3 py-1 text-sm rounded ${
              inputMethod === "dropdown"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Dropdown
          </button>
          <button
            type="button"
            onClick={() => setInputMethod("file")}
            className={`px-3 py-1 text-sm rounded ${
              inputMethod === "file"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            File Upload
          </button>
        </div>
      </div>

      {inputMethod === "dropdown" && (
        <div>
          {isLoading && (
            <div className="animate-pulse bg-gray-200 h-40 rounded-md"></div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error loading drinks for this production line
            </div>
          )}

          {drinksData && (
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {drinksData.drinks.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No drinks available for this production line
                </div>
              ) : (
                <div className="p-2">
                  {drinksData.drinks.map((drink) => (
                    <label
                      key={drink}
                      className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDrinks.includes(drink)}
                        onChange={() => handleDrinkToggle(drink)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">{drink}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {inputMethod === "file" && (
        <div>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload a text file with drink names (one per line)
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <span className="mt-2 block text-sm text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                TXT or CSV files up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedDrinks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Selected drinks ({selectedDrinks.length})
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {selectedDrinks.map((drink) => (
                <span
                  key={drink}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {drink}
                  <button
                    type="button"
                    onClick={() => handleDrinkToggle(drink)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrinkSelector;
