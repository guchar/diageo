export interface OptimizationRequest {
  line_number: number;
  drinks: string[];
}

export interface OptimizationResponse {
  optimal_path: string[];
  total_water_usage: number;
  water_saved: number;
  original_water_usage: number;
}

export interface ProductionLinesResponse {
  production_lines: number[];
}

export interface DrinksResponse {
  drinks: string[];
}

export interface UploadResponse {
  drinks: string[];
  valid_drinks: string[];
  invalid_drinks: string[];
  message: string;
}
