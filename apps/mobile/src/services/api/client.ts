import { BFF_BASE_URL } from '../../config/env';

/**
 * HTTP Client with timeout support
 * Used for all API calls to the BFF
 *
 * TASK: MOBILE-001 — HTTP Client Implementation
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 12000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Por favor intenta nuevamente.');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export { BFF_BASE_URL };
