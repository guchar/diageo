import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

interface ProductionLineSelectorProps {
  selectedLine: number | null;
  onLineChange: (line: number) => void;
}

function ProductionLineSelector({
  selectedLine,
  onLineChange,
}: ProductionLineSelectorProps) {
  const {
    data: linesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["production-lines"],
    queryFn: api.getProductionLines,
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Production Line
        </label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Production Line
        </label>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading production lines
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Production Line
      </label>
      <select
        value={selectedLine || ""}
        onChange={(e) => onLineChange(Number(e.target.value))}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Choose a production line...</option>
        {linesData?.production_lines.map((line) => (
          <option key={line} value={line}>
            Line {line}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProductionLineSelector;
