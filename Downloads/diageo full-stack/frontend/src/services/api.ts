import axios from "axios";
import type {
  OptimizationRequest,
  OptimizationResponse,
  ProductionLinesResponse,
  DrinksResponse,
  UploadResponse,
} from "../types/api";

const API_BASE_URL = "http://127.0.0.1:8001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  // Health check
  health: () => apiClient.get("/"),

  // Get production lines
  getProductionLines: (): Promise<ProductionLinesResponse> =>
    apiClient.get("/production-lines").then((response) => response.data),

  // Get drinks for a production line
  getDrinks: (lineNumber: number): Promise<DrinksResponse> =>
    apiClient.get(`/drinks/${lineNumber}`).then((response) => response.data),

  // Optimize schedule
  optimizeSchedule: (
    request: OptimizationRequest
  ): Promise<OptimizationResponse> =>
    apiClient
      .post("/optimize-schedule", request)
      .then((response) => response.data),

  // Upload drinks file
  uploadDrinks: (file: File, lineNumber: number): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("line_number", lineNumber.toString());

    return apiClient
      .post("/upload-drinks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data);
  },
};
