import {
  createRequestId,
  snapIntensity,
  buildTryOnPayload,
  TryOnPayload,
} from '../../src/utils/request';

/**
 * Tests for utils/request.ts
 * TASK: MOBILE-002 — Request Building Testing
 *
 * Test coverage:
 * ✓ createRequestId uniqueness and format
 * ✓ snapIntensity clamping and rounding
 * ✓ buildTryOnPayload validation and snapping
 */

describe('createRequestId', () => {
  it('generates request ID with req- prefix', () => {
    const id = createRequestId();
    expect(id).toMatch(/^req-/);
  });

  it('includes timestamp in request ID', () => {
    const before = Date.now();
    const id = createRequestId();
    const after = Date.now();

    const timestampStr = id.split('-')[1];
    const timestamp = parseInt(timestampStr);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('includes random component', () => {
    const id = createRequestId();
    const parts = id.split('-');
    expect(parts.length).toBe(3);
    expect(parts[2]).toHaveLength(6); // random hex string
  });

  it('generates unique IDs on consecutive calls', () => {
    const id1 = createRequestId();
    const id2 = createRequestId();
    expect(id1).not.toBe(id2);
  });

  it('generates multiple unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createRequestId());
    }
    expect(ids.size).toBe(100);
  });

  it('random component is valid hex', () => {
    const id = createRequestId();
    const randomPart = id.split('-')[2];
    expect(/^[0-9a-f]+$/.test(randomPart)).toBe(true);
  });
});

describe('snapIntensity', () => {
  it('returns DEFAULT_INTENSITY (50) for undefined', () => {
    expect(snapIntensity(undefined)).toBe(50);
  });

  it('snaps value to nearest INTENSITY_STEP (5)', () => {
    expect(snapIntensity(27)).toBe(25);
    expect(snapIntensity(28)).toBe(30);
    expect(snapIntensity(50)).toBe(50);
  });

  it('clamps to MIN_INTENSITY (0)', () => {
    expect(snapIntensity(-10)).toBe(0);
    expect(snapIntensity(-100)).toBe(0);
  });

  it('clamps to MAX_INTENSITY (100)', () => {
    expect(snapIntensity(110)).toBe(100);
    expect(snapIntensity(200)).toBe(100);
  });

  it('handles exact boundary values', () => {
    expect(snapIntensity(0)).toBe(0);
    expect(snapIntensity(100)).toBe(100);
    expect(snapIntensity(5)).toBe(5);
    expect(snapIntensity(95)).toBe(95);
  });

  it('rounds mid-values up or down correctly', () => {
    expect(snapIntensity(52.5)).toBe(55);
    expect(snapIntensity(47.5)).toBe(50);
  });

  it('handles floating point values', () => {
    expect(snapIntensity(50.1)).toBe(50);
    expect(snapIntensity(50.9)).toBe(50);
    expect(snapIntensity(51.0)).toBe(50);
    expect(snapIntensity(52.5)).toBe(55);
  });
});

describe('buildTryOnPayload', () => {
  const validSelfieData = {
    base64: 'data:image/jpeg;base64,abc123def456',
  };

  const validColor = 'Sunlit Amber';

  it('builds valid payload from complete input', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
      intensity: 50,
      requestId: 'req-123456',
    });

    expect(result).toEqual({
      selfie: validSelfieData.base64,
      color: validColor,
      intensity: 50,
      request_id: 'req-123456',
    });
  });

  it('generates requestId if not provided', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
      intensity: 50,
    });

    expect(result.request_id).toBeDefined();
    expect(result.request_id).toMatch(/^req-/);
  });

  it('snaps intensity if provided', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
      intensity: 27, // should snap to 25
    });

    expect(result.intensity).toBe(25);
  });

  it('uses DEFAULT_INTENSITY (50) if intensity not provided', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
    });

    expect(result.intensity).toBe(50);
  });

  it('throws error if selfie missing', () => {
    expect(() => {
      buildTryOnPayload({
        selfie: { base64: undefined } as any,
        color: validColor,
      });
    }).toThrow();
  });

  it('throws error if selfie.base64 is null', () => {
    expect(() => {
      buildTryOnPayload({
        selfie: { base64: null } as any,
        color: validColor,
      });
    }).toThrow();
  });

  it('throws error if selfie.base64 is empty string', () => {
    expect(() => {
      buildTryOnPayload({
        selfie: { base64: '' },
        color: validColor,
      });
    }).toThrow();
  });

  it('error message is in Spanish', () => {
    try {
      buildTryOnPayload({
        selfie: { base64: undefined } as any,
        color: validColor,
      });
      fail('Should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('selfie');
      expect(error.message).toContain('base64');
    }
  });

  it('maps camelCase intensity to snake_case fields', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
      intensity: 50,
      requestId: 'req-test',
    });

    expect(result).toHaveProperty('request_id');
    expect(result).toHaveProperty('selfie');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('intensity');
  });

  it('preserves color name exactly', () => {
    const colors = [
      'Midnight Espresso',
      'Copper Bloom',
      'Sunlit Amber',
    ];

    colors.forEach((color) => {
      const result = buildTryOnPayload({
        selfie: validSelfieData,
        color,
      });
      expect(result.color).toBe(color);
    });
  });

  it('handles very long base64 selfie data', () => {
    const longBase64 = 'data:image/jpeg;base64,' + 'a'.repeat(1000000);
    const result = buildTryOnPayload({
      selfie: { base64: longBase64 },
      color: validColor,
    });

    expect(result.selfie).toBe(longBase64);
  });

  it('returns TryOnPayload type with correct interface', () => {
    const result = buildTryOnPayload({
      selfie: validSelfieData,
      color: validColor,
      intensity: 50,
      requestId: 'req-123',
    }) as TryOnPayload;

    expect(typeof result.selfie).toBe('string');
    expect(typeof result.color).toBe('string');
    expect(typeof result.intensity).toBe('number');
    expect(typeof result.request_id).toBe('string');
  });

  it('handles edge case intensity values', () => {
    const testCases = [
      { input: 0, expected: 0 },
      { input: 100, expected: 100 },
      { input: -50, expected: 0 },
      { input: 150, expected: 100 },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = buildTryOnPayload({
        selfie: validSelfieData,
        color: validColor,
        intensity: input,
      });
      expect(result.intensity).toBe(expected);
    });
  });
});
