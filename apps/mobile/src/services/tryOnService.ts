import type { TryOnPayload } from "../utils/request";

/**
 * Try-On API Response
 * Maps to ML API response structure
 *
 * TASK: MOBILE-001 — Real HTTP Client Integration
 */
export interface TryOnResponse {
  imageUrl: string;
  processingMs: number;
  requestId: string;
  color: string;
}

// Re-export real implementation from API module
export { performTryOn } from "./api/tryOnApi";
