export interface OptimizationRequest {
  line_number: number;
  drinks: string[];
}

export interface TransitionInfo {
  from_drink: string;
  to_drink: string;
  cleaning_type: string;
  water_usage: number;
}

export interface OptimizationResponse {
  optimal_path: string[];
  total_water_usage: number;
  water_saved: number;
  original_water_usage: number;
  transitions: TransitionInfo[];
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
