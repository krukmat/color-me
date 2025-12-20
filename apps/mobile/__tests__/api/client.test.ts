import { fetchWithTimeout, BFF_BASE_URL } from '../../src/services/api/client';

/**
 * Tests for api/client.ts :: fetchWithTimeout
 * TASK: MOBILE-001 — HTTP Client Testing
 *
 * Test coverage:
 * ✓ Success case (fetch returns ok response)
 * ✓ Timeout case (AbortController triggered)
 * ✓ Network error case (fetch throws)
 * ✓ Cleanup (clearTimeout always called)
 */

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('success case', () => {
    it('should return response when fetch succeeds', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'success' }),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await fetchWithTimeout('http://api.example.com/try-on', {
        method: 'POST',
        body: JSON.stringify({ color: 'red' }),
      });

      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.example.com/try-on',
        expect.objectContaining({
          method: 'POST',
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should pass signal to fetch for timeout control', async () => {
      const mockResponse = { ok: true, status: 200 } as unknown as Response;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await fetchWithTimeout('http://api.example.com', {}, 5000);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.example.com',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('timeout case', () => {
    it('should throw "Request timeout" message on AbortError', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        Object.assign(new Error('AbortError'), { name: 'AbortError' })
      );

      try {
        await fetchWithTimeout('http://api.example.com', {}, 5000);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Request timeout');
        expect(error.message).toContain('intenta nuevamente');
      }
    });
  });

  describe('network error case', () => {
    it('should re-throw non-AbortError network errors', async () => {
      const networkError = new Error('Network unreachable');
      global.fetch = jest.fn().mockRejectedValueOnce(networkError);

      const fetchPromise = fetchWithTimeout('http://api.example.com', {}, 5000);

      try {
        await fetchPromise;
        fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBe(networkError);
        expect(error.message).toBe('Network unreachable');
      }
    });

    it('should handle fetch rejection (no signal)', async () => {
      const fetchError = new Error('Failed to fetch');
      global.fetch = jest.fn().mockRejectedValueOnce(fetchError);

      const fetchPromise = fetchWithTimeout('http://api.example.com', {}, 5000);

      try {
        await fetchPromise;
        fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBe(fetchError);
      }
    });
  });

  describe('cleanup behavior', () => {
    it('should clear timeout in finally block on success', async () => {
      const mockResponse = { ok: true, status: 200 } as unknown as Response;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await fetchWithTimeout('http://api.example.com', {}, 5000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout in finally block on error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      try {
        await fetchWithTimeout('http://api.example.com', {}, 5000);
      } catch {
        // Expected to throw
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout even on AbortError', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        Object.assign(new Error('AbortError'), { name: 'AbortError' })
      );

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      try {
        await fetchWithTimeout('http://api.example.com', {}, 5000);
      } catch {
        // Expected to throw
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('default timeout value', () => {
    it('should use 12000ms as default timeout', async () => {
      const mockResponse = { ok: true, status: 200 } as unknown as Response;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      await fetchWithTimeout('http://api.example.com', {});

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 12000);
      setTimeoutSpy.mockRestore();
    });

    it('should allow custom timeout override', async () => {
      const mockResponse = { ok: true, status: 200 } as unknown as Response;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      await fetchWithTimeout('http://api.example.com', {}, 3000);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
      setTimeoutSpy.mockRestore();
    });
  });

  describe('BFF_BASE_URL export', () => {
    it('should export BFF_BASE_URL constant', () => {
      expect(BFF_BASE_URL).toBeDefined();
      expect(typeof BFF_BASE_URL).toBe('string');
    });

    it('should export valid URL format', () => {
      expect(BFF_BASE_URL).toMatch(/^http/);
    });
  });
});
