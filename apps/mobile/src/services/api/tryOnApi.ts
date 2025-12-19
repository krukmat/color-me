import { fetchWithTimeout, BFF_BASE_URL } from './client';
import type { TryOnPayload, TryOnResponse } from '../tryOnService';

/**
 * Real API implementation for try-on requests
 * Posts to BFF which forwards to ML API
 *
 * TASK: MOBILE-001 — Try-On API Implementation
 */

export const performTryOn = async (
  payload: TryOnPayload
): Promise<TryOnResponse> => {
  const response = await fetchWithTimeout(
    `${BFF_BASE_URL}/try-on`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': payload.request_id,
      },
      body: JSON.stringify(payload),
    },
    12000 // 12s timeout
  );

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage || 'No pudimos procesar tu color');
  }

  const data = await response.json();

  // Map snake_case from API to camelCase for frontend
  return {
    imageUrl: data.image_url,
    processingMs: data.processing_ms,
    requestId: data.request_id,
    color: data.color,
  };
};
