import {
  formatBytesToMB,
  validateSelfieResult,
  validateSelfieForApply,
  buildTryOnRequest,
  formatErrorMessage,
  buildSharePayload,
  calculateBeforeAfterPercentage,
  isApplyButtonDisabled,
  isShareButtonDisabled,
} from '../../src/screens/CaptureScreen.utils';
import { PALETTE } from '../../src/utils/palette';
import type { Selfie } from '../../src/types/selfie';

/**
 * Tests for CaptureScreen.utils.ts
 * TASK: MOBILE-003 — Pure function testing for CaptureScreen logic
 *
 * Test coverage:
 * ✓ File size validation (bytes → MB)
 * ✓ Selfie validation for selection
 * ✓ Selfie validation for apply
 * ✓ Payload building
 * ✓ Error formatting
 * ✓ Share payload building
 * ✓ UI state calculations
 */

describe('CaptureScreen.utils', () => {
  const validSelfie: Selfie = {
    uri: 'file:///selfie.jpg',
    fileSize: 2 * 1024 * 1024, // 2MB
    base64: 'test-base64-data',
  };

  const largeSelfie: Selfie = {
    uri: 'file:///large.jpg',
    fileSize: 6 * 1024 * 1024, // 6MB
    base64: 'test-base64-data',
  };

  const selfieNoBase64: Selfie = {
    uri: 'file:///no-base64.jpg',
    fileSize: 2 * 1024 * 1024,
    // no base64
  };

  // ============================================================================
  // formatBytesToMB
  // ============================================================================

  describe('formatBytesToMB', () => {
    it('converts bytes to megabytes correctly', () => {
      expect(formatBytesToMB(1024 * 1024)).toBe(1); // 1MB
      expect(formatBytesToMB(2 * 1024 * 1024)).toBe(2); // 2MB
      expect(formatBytesToMB(5 * 1024 * 1024)).toBe(5); // 5MB
    });

    it('handles zero bytes', () => {
      expect(formatBytesToMB(0)).toBe(0);
    });

    it('handles undefined', () => {
      expect(formatBytesToMB(undefined)).toBe(0);
    });

    it('handles fractional megabytes', () => {
      expect(formatBytesToMB(512 * 1024)).toBe(0.5); // 0.5MB
      expect(formatBytesToMB(1.5 * 1024 * 1024)).toBe(1.5); // 1.5MB
    });

    it('handles large files', () => {
      expect(formatBytesToMB(100 * 1024 * 1024)).toBe(100); // 100MB
    });
  });

  // ============================================================================
  // validateSelfieResult
  // ============================================================================

  describe('validateSelfieResult', () => {
    it('accepts valid selfie under 5MB', () => {
      const result = validateSelfieResult(validSelfie);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects selfie larger than 5MB', () => {
      const result = validateSelfieResult(largeSelfie);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('excede el tamaño');
      expect(result.error).toContain('5');
    });

    it('rejects undefined selfie (user cancelled)', () => {
      const result = validateSelfieResult(undefined);

      expect(result.valid).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('accepts selfie exactly at 5MB limit', () => {
      const selfieAt5MB: Selfie = {
        uri: 'file:///at-limit.jpg',
        fileSize: 5 * 1024 * 1024,
        base64: 'data',
      };

      const result = validateSelfieResult(selfieAt5MB);

      expect(result.valid).toBe(true);
    });

    it('rejects selfie at 5.1MB', () => {
      const selfieOver5MB: Selfie = {
        uri: 'file:///over-limit.jpg',
        fileSize: 5.1 * 1024 * 1024,
        base64: 'data',
      };

      const result = validateSelfieResult(selfieOver5MB);

      expect(result.valid).toBe(false);
    });

    it('handles selfie without fileSize', () => {
      const selfieNoSize: Selfie = {
        uri: 'file:///no-size.jpg',
        base64: 'data',
        // no fileSize
      };

      const result = validateSelfieResult(selfieNoSize);

      expect(result.valid).toBe(true); // formatBytesToMB(undefined) returns 0
    });
  });

  // ============================================================================
  // validateSelfieForApply
  // ============================================================================

  describe('validateSelfieForApply', () => {
    it('accepts valid selfie with base64', () => {
      const result = validateSelfieForApply(validSelfie);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects undefined selfie', () => {
      const result = validateSelfieForApply(undefined);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Necesitamos una selfie');
    });

    it('rejects selfie without base64', () => {
      const result = validateSelfieForApply(selfieNoBase64);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('base64');
    });

    it('accepts selfie with all required fields', () => {
      const completeSelfie: Selfie = {
        uri: 'file:///complete.jpg',
        fileSize: 3 * 1024 * 1024,
        base64: 'complete-base64-data',
      };

      const result = validateSelfieForApply(completeSelfie);

      expect(result.valid).toBe(true);
    });
  });

  // ============================================================================
  // buildTryOnRequest
  // ============================================================================

  describe('buildTryOnRequest', () => {
    it('builds request with correct structure', () => {
      const color = PALETTE[0];
      const intensity = 50;
      const requestId = 'req-test-123';

      const payload = buildTryOnRequest(validSelfie, color, intensity, requestId);

      expect(payload).toHaveProperty('selfie');
      expect(payload).toHaveProperty('color');
      expect(payload).toHaveProperty('intensity');
      expect(payload).toHaveProperty('request_id');
    });

    it('includes color name from palette', () => {
      const color = PALETTE[3]; // Some color
      const payload = buildTryOnRequest(validSelfie, color, 50, 'req-123');

      expect(payload.color).toBe(color.name);
    });

    it('includes intensity value', () => {
      const payload = buildTryOnRequest(validSelfie, PALETTE[0], 75, 'req-123');

      expect(payload.intensity).toBe(75);
    });

    it('includes requestId for tracing', () => {
      const traceId = 'req-trace-abc123';
      const payload = buildTryOnRequest(validSelfie, PALETTE[0], 50, traceId);

      expect(payload.request_id).toBe(traceId);
    });

    it('works with different colors', () => {
      PALETTE.forEach((color) => {
        const payload = buildTryOnRequest(validSelfie, color, 50, 'req-123');
        expect(payload.color).toBe(color.name);
      });
    });

    it('works with different intensity values', () => {
      const intensities = [0, 25, 50, 75, 100];

      intensities.forEach((intensity) => {
        const payload = buildTryOnRequest(validSelfie, PALETTE[0], intensity, 'req-123');
        expect(payload.intensity).toBe(intensity);
      });
    });
  });

  // ============================================================================
  // formatErrorMessage
  // ============================================================================

  describe('formatErrorMessage', () => {
    it('formats Error object', () => {
      const error = new Error('Network timeout');
      const message = formatErrorMessage(error);

      expect(message).toBe('Network timeout');
    });

    it('handles string errors with fallback', () => {
      // String errors return default message
      const message = formatErrorMessage('Some string');

      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('handles null/undefined with fallback', () => {
      const message = formatErrorMessage(null);

      expect(message).toBe('No pudimos procesar tu color. Reintenta.');
    });

    it('preserves original error message', () => {
      const errors = [
        'API Error: Invalid request',
        'Connection failed',
        'Timeout after 30s',
      ];

      errors.forEach((errorMsg) => {
        const error = new Error(errorMsg);
        expect(formatErrorMessage(error)).toBe(errorMsg);
      });
    });
  });

  // ============================================================================
  // buildSharePayload
  // ============================================================================

  describe('buildSharePayload', () => {
    it('builds share payload with all required fields', () => {
      const result = {
        imageUrl: 'https://example.com/result.jpg',
        processingMs: 250,
        requestId: 'req-123',
      };
      const color = PALETTE[0];

      const payload = buildSharePayload(result, color, 75);

      expect(payload).toHaveProperty('imageUrl');
      expect(payload).toHaveProperty('colorName');
      expect(payload).toHaveProperty('intensity');
      expect(payload).toHaveProperty('requestId');
    });

    it('includes correct image URL', () => {
      const url = 'https://api.example.com/images/result123.jpg';
      const result = { imageUrl: url, processingMs: 300, requestId: 'req-123' };

      const payload = buildSharePayload(result, PALETTE[0], 50);

      expect(payload.imageUrl).toBe(url);
    });

    it('includes color name from palette', () => {
      const color = PALETTE[5];
      const result = { imageUrl: 'url', processingMs: 300, requestId: 'req-123' };

      const payload = buildSharePayload(result, color, 50);

      expect(payload.colorName).toBe(color.name);
    });

    it('includes intensity percentage', () => {
      const intensities = [0, 25, 50, 75, 100];
      const result = { imageUrl: 'url', processingMs: 300, requestId: 'req-123' };

      intensities.forEach((intensity) => {
        const payload = buildSharePayload(result, PALETTE[0], intensity);
        expect(payload.intensity).toBe(intensity);
      });
    });

    it('preserves request ID for tracking', () => {
      const requestId = 'req-share-track-xyz';
      const result = { imageUrl: 'url', processingMs: 300, requestId };

      const payload = buildSharePayload(result, PALETTE[0], 50);

      expect(payload.requestId).toBe(requestId);
    });
  });

  // ============================================================================
  // calculateBeforeAfterPercentage
  // ============================================================================

  describe('calculateBeforeAfterPercentage', () => {
    it('calculates percentage at minimum (0)', () => {
      const result = calculateBeforeAfterPercentage(0);

      expect(result).toBe('0% aplicado');
    });

    it('calculates percentage at maximum (1)', () => {
      const result = calculateBeforeAfterPercentage(1);

      expect(result).toBe('100% aplicado');
    });

    it('calculates percentage at midpoint (0.5)', () => {
      const result = calculateBeforeAfterPercentage(0.5);

      expect(result).toBe('50% aplicado');
    });

    it('calculates percentage at 0.3', () => {
      const result = calculateBeforeAfterPercentage(0.3);

      expect(result).toBe('30% aplicado');
    });

    it('calculates percentage at 0.75', () => {
      const result = calculateBeforeAfterPercentage(0.75);

      expect(result).toBe('75% aplicado');
    });

    it('rounds to nearest integer', () => {
      expect(calculateBeforeAfterPercentage(0.333)).toBe('33% aplicado');
      expect(calculateBeforeAfterPercentage(0.666)).toBe('67% aplicado');
    });

    it('returns formatted string with "aplicado"', () => {
      const result = calculateBeforeAfterPercentage(0.5);

      expect(result).toContain('%');
      expect(result).toContain('aplicado');
    });
  });

  // ============================================================================
  // isApplyButtonDisabled
  // ============================================================================

  describe('isApplyButtonDisabled', () => {
    it('disables when no selfie', () => {
      expect(isApplyButtonDisabled(undefined, 'idle')).toBe(true);
    });

    it('disables when status is loading', () => {
      expect(isApplyButtonDisabled(validSelfie, 'loading')).toBe(true);
    });

    it('enables when selfie exists and not loading', () => {
      expect(isApplyButtonDisabled(validSelfie, 'idle')).toBe(false);
      expect(isApplyButtonDisabled(validSelfie, 'success')).toBe(false);
      expect(isApplyButtonDisabled(validSelfie, 'error')).toBe(false);
    });

    it('handles all status values', () => {
      const statuses: Array<'idle' | 'loading' | 'success' | 'error'> = [
        'idle',
        'loading',
        'success',
        'error',
      ];

      statuses.forEach((status) => {
        const disabled = isApplyButtonDisabled(validSelfie, status);
        const isLoading = status === 'loading';
        expect(disabled).toBe(isLoading);
      });
    });
  });

  // ============================================================================
  // isShareButtonDisabled
  // ============================================================================

  describe('isShareButtonDisabled', () => {
    it('disables when result is undefined', () => {
      expect(isShareButtonDisabled(undefined)).toBe(true);
    });

    it('enables when result exists', () => {
      const result = {
        imageUrl: 'https://example.com/result.jpg',
        processingMs: 250,
        requestId: 'req-123',
      };

      expect(isShareButtonDisabled(result)).toBe(false);
    });

    it('enables when result has all fields', () => {
      const completeResult = {
        imageUrl: 'https://api.example.com/images/result.jpg',
        processingMs: 500,
        requestId: 'req-complete-123',
      };

      expect(isShareButtonDisabled(completeResult)).toBe(false);
    });
  });

  // ============================================================================
  // Integration: Complete flow validation
  // ============================================================================

  describe('Integration: Complete flow', () => {
    it('validates selfie, builds request, formats response', () => {
      // 1. Validate
      const validation = validateSelfieForApply(validSelfie);
      expect(validation.valid).toBe(true);

      // 2. Build request
      const payload = buildTryOnRequest(validSelfie, PALETTE[2], 60, 'req-flow-123');
      expect(payload.color).toBe(PALETTE[2].name);
      expect(payload.intensity).toBe(60);

      // 3. Build share payload from hypothetical result
      const result = {
        imageUrl: 'https://example.com/flow-result.jpg',
        processingMs: 200,
        requestId: 'req-flow-123',
      };
      const sharePayload = buildSharePayload(result, PALETTE[2], 60);
      expect(sharePayload.colorName).toBe(PALETTE[2].name);
    });

    it('handles error throughout flow', () => {
      // Invalid selfie
      const validation = validateSelfieForApply(undefined);
      expect(validation.valid).toBe(false);

      // Error formatting
      const error = new Error('API failed');
      const message = formatErrorMessage(error);
      expect(message).toBe('API failed');
    });

    it('disables buttons appropriately', () => {
      // No selfie = can't apply
      expect(isApplyButtonDisabled(undefined, 'idle')).toBe(true);

      // Loading = can't apply or share
      expect(isApplyButtonDisabled(validSelfie, 'loading')).toBe(true);
      expect(isShareButtonDisabled(undefined)).toBe(true);

      // With result = can share
      const result = {
        imageUrl: 'url',
        processingMs: 250,
        requestId: 'req-123',
      };
      expect(isShareButtonDisabled(result)).toBe(false);
    });
  });
});
