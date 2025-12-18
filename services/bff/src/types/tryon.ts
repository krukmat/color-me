export interface TryOnRequest {
  selfie: string;
  color: string;
  intensity: number;
  request_id: string;
}

export interface TryOnResponse {
  image_url: string;
  processing_ms: number;
  request_id: string;
  color: string;
  details?: Record<string, unknown>;
}
