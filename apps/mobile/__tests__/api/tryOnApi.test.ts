import { performTryOn } from '../../src/services/api/tryOnApi';
import * as client from '../../src/services/api/client';

/**
 * Tests for api/tryOnApi.ts :: performTryOn
 * TASK: MOBILE-001 — Try-On API Testing
 *
 * Test coverage:
 * ✓ Success case (response.ok=true, valid JSON mapping)
 * ✓ Error with JSON body (response.ok=false, error.message extracted)
 * ✓ Error without JSON body (fallback to statusText)
 */

describe('performTryOn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('should map response snake_case to camelCase', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          image_url: 'http://api.example.com/image/abc123.png',
          processing_ms: 1234,
          request_id: 'req-123456',
          color: 'Sunlit Amber',
        }),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data:image/jpeg;base64,abc123',
        color: 'Sunlit Amber',
        intensity: 50,
        request_id: 'req-123456',
      };

      const result = await performTryOn(payload);

      expect(result).toEqual({
        imageUrl: 'http://api.example.com/image/abc123.png',
        processingMs: 1234,
        requestId: 'req-123456',
        color: 'Sunlit Amber',
      });
    });

    it('should send correct headers including x-request-id', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          image_url: 'http://example.com/img.png',
          processing_ms: 100,
          request_id: 'req-xyz',
          color: 'red',
        }),
      } as unknown as Response;

      const fetchSpy = jest
        .spyOn(client, 'fetchWithTimeout')
        .mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data:image/jpeg;base64,abc',
        color: 'red',
        intensity: 50,
        request_id: 'req-xyz',
      };

      await performTryOn(payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/try-on'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-request-id': 'req-xyz',
          }),
          body: JSON.stringify(payload),
        }),
        expect.any(Number)
      );
    });

    it('should POST to correct endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          image_url: 'url',
          processing_ms: 0,
          request_id: 'req',
          color: 'red',
        }),
      } as unknown as Response;

      const fetchSpy = jest
        .spyOn(client, 'fetchWithTimeout')
        .mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'base64',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      await performTryOn(payload);

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[0]).toContain('/try-on');
    });
  });

  describe('error case - with JSON body', () => {
    it('should extract error.message from JSON response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          code: 'INVALID_COLOR',
          message: 'Color not found in palette',
        }),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'InvalidColor',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toBe('Color not found in palette');
      }
    });

    it('should use default message if error.message is missing', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          code: 'INTERNAL_ERROR',
        }),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Error 500');
      }
    });

    it('should handle empty JSON response', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Error 503');
      }
    });
  });

  describe('error case - without JSON body (fallback)', () => {
    it('should fallback to statusText when JSON parsing fails', async () => {
      const mockResponse = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toBe('Bad Gateway');
      }
    });

    it('should use "Error {status}" if statusText is empty', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: '',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Error 500');
      }
    });

    it('should fallback to default message if all else fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: '',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toMatch(
          /Error 500|No pudimos procesar tu color/
        );
      }
    });
  });

  describe('integration with fetchWithTimeout', () => {
    it('should call fetchWithTimeout with 12 second timeout', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ image_url: 'url', processing_ms: 0, request_id: 'req', color: 'red' }),
      } as unknown as Response;

      const fetchSpy = jest
        .spyOn(client, 'fetchWithTimeout')
        .mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      await performTryOn(payload);

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[2]).toBe(12000);
    });

    it('should propagate fetchWithTimeout errors', async () => {
      const timeoutError = new Error('Request timeout. Por favor intenta nuevamente.');
      jest.spyOn(client, 'fetchWithTimeout').mockRejectedValueOnce(timeoutError);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      try {
        await performTryOn(payload);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Request timeout');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null image_url in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          image_url: null,
          processing_ms: 100,
          request_id: 'req',
          color: 'red',
        }),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      const result = await performTryOn(payload);
      expect(result.imageUrl).toBeNull();
    });

    it('should handle missing fields in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          image_url: 'http://example.com/img.png',
        }),
      } as unknown as Response;

      jest.spyOn(client, 'fetchWithTimeout').mockResolvedValueOnce(mockResponse);

      const payload = {
        selfie: 'data',
        color: 'red',
        intensity: 50,
        request_id: 'req',
      };

      const result = await performTryOn(payload);
      expect(result.imageUrl).toBe('http://example.com/img.png');
      expect(result.processingMs).toBeUndefined();
      expect(result.requestId).toBeUndefined();
      expect(result.color).toBeUndefined();
    });
  });
});
