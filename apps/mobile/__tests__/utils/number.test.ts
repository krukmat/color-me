import { clamp, roundToStep } from '../../src/utils/number';

/**
 * Tests for utils/number.ts
 * TASK: MOBILE-002 — Math Utilities Testing
 *
 * Test coverage:
 * ✓ clamp: boundary conditions, NaN handling
 * ✓ roundToStep: rounding, precision, edge cases
 */

describe('clamp', () => {
  describe('normal cases', () => {
    it('should return value when within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, -50, 50)).toBe(-50);
    });

    it('should clamp above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(200, -50, 50)).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle NaN as min value', () => {
      expect(clamp(5, NaN, 10)).toBe(NaN);
    });

    it('should handle NaN input and return min', () => {
      expect(clamp(NaN, 0, 10)).toBe(0);
    });

    it('should handle negative bounds', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(5, -10, -1)).toBe(-1);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
    });

    it('should handle zero values', () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(5, 0, 0)).toBe(0);
    });

    it('should handle floating point values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it('should handle very large numbers', () => {
      expect(clamp(1e10, 0, 1e9)).toBe(1e9);
      expect(clamp(-1e10, -1e9, 1e9)).toBe(-1e9);
    });

    it('should handle very small numbers', () => {
      expect(clamp(1e-10, 0, 1)).toBe(1e-10);
      expect(clamp(-1e-10, 0, 1)).toBe(0);
    });
  });

  describe('intensity use case (0-100)', () => {
    it('should clamp intensity values correctly', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(110, 0, 100)).toBe(100);
    });

    it('should handle intensity edge values', () => {
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
      expect(clamp(0.5, 0, 100)).toBe(0.5);
      expect(clamp(99.9, 0, 100)).toBe(99.9);
    });
  });
});

describe('roundToStep', () => {
  describe('basic rounding', () => {
    it('should round to nearest step', () => {
      expect(roundToStep(52, 5)).toBe(50);
      expect(roundToStep(53, 5)).toBe(55);
      expect(roundToStep(57, 5)).toBe(55);
      expect(roundToStep(58, 5)).toBe(60);
    });

    it('should handle exact multiples', () => {
      expect(roundToStep(50, 5)).toBe(50);
      expect(roundToStep(55, 5)).toBe(55);
      expect(roundToStep(100, 5)).toBe(100);
    });

    it('should handle midpoint rounding (round half away)', () => {
      expect(roundToStep(52.5, 5)).toBe(55);
      expect(roundToStep(57.5, 5)).toBe(60);
    });
  });

  describe('step = 1 (default integer rounding)', () => {
    it('should round to nearest integer', () => {
      expect(roundToStep(5.3, 1)).toBe(5);
      expect(roundToStep(5.5, 1)).toBe(6);
      expect(roundToStep(5.7, 1)).toBe(6);
    });
  });

  describe('decimal steps (fractional)', () => {
    it('should handle step = 0.5', () => {
      expect(roundToStep(1.2, 0.5)).toBe(1);
      expect(roundToStep(1.3, 0.5)).toBe(1.5);
      expect(roundToStep(1.7, 0.5)).toBe(1.5);
    });

    it('should handle step = 0.25', () => {
      expect(roundToStep(1.1, 0.25)).toBe(1);
      expect(roundToStep(1.13, 0.25)).toBe(1.25);
      expect(roundToStep(1.38, 0.25)).toBe(1.5);
    });

    it('should handle step = 0.05 (intensity precision)', () => {
      expect(roundToStep(1.23, 0.05)).toBe(1.25);
      expect(roundToStep(1.21, 0.05)).toBe(1.2);
      expect(roundToStep(1.027, 0.05)).toBe(1.05);
    });

    it('should handle step = 0.1', () => {
      expect(roundToStep(1.25, 0.1)).toBe(1.3);
      expect(roundToStep(1.26, 0.1)).toBe(1.3);
    });
  });

  describe('precision handling', () => {
    it('should fix floating point precision errors', () => {
      // This tests the toFixed precision logic
      const result = roundToStep(1.23, 0.05);
      expect(result).toBe(1.25);
      expect(typeof result).toBe('number');
    });

    it('should return number type, not string', () => {
      const result = roundToStep(52, 5);
      expect(typeof result).toBe('number');
      expect(result).toBe(50);
    });

    it('should maintain precision through chaining', () => {
      const first = roundToStep(52.3, 5);
      const second = roundToStep(first, 5);
      expect(second).toBe(first);
    });
  });

  describe('edge cases', () => {
    it('should handle step = 0 (return original value)', () => {
      expect(roundToStep(52.5, 0)).toBe(52.5);
      expect(roundToStep(100, 0)).toBe(100);
    });

    it('should handle negative values', () => {
      expect(roundToStep(-52, 5)).toBe(-50);
      expect(roundToStep(-53, 5)).toBe(-55);
    });

    it('should handle zero input', () => {
      expect(roundToStep(0, 5)).toBe(0);
      expect(roundToStep(0, 0.1)).toBe(0);
    });

    it('should handle very large values', () => {
      expect(roundToStep(1e10, 5)).toBe(1e10);
      expect(roundToStep(1e10 + 2, 5)).toBe(1e10);
    });

    it('should handle very small step', () => {
      expect(roundToStep(1.23456, 0.01)).toBe(1.23);
      expect(roundToStep(1.23567, 0.01)).toBe(1.24);
    });

    it('should handle NaN', () => {
      expect(roundToStep(NaN, 5)).toBe(NaN);
    });
  });

  describe('intensity slider use case', () => {
    it('should snap intensity to 5-step increments', () => {
      // User drags slider to 27 → should snap to 25
      expect(roundToStep(27, 5)).toBe(25);
      // User drags slider to 28 → should snap to 30
      expect(roundToStep(28, 5)).toBe(30);
      // User drags slider to 50 (exact) → stays 50
      expect(roundToStep(50, 5)).toBe(50);
    });

    it('should handle full intensity range (0-100)', () => {
      expect(roundToStep(0, 5)).toBe(0);
      expect(roundToStep(5, 5)).toBe(5);
      expect(roundToStep(50, 5)).toBe(50);
      expect(roundToStep(95, 5)).toBe(95);
      expect(roundToStep(100, 5)).toBe(100);
    });
  });

  describe('combined with clamp (snapIntensity pattern)', () => {
    const snapIntensity = (value: number, step: number, min: number, max: number) => {
      const snapped = roundToStep(value, step);
      return clamp(snapped, min, max);
    };

    it('should snap and clamp together', () => {
      expect(snapIntensity(27, 5, 0, 100)).toBe(25);
      expect(snapIntensity(50, 5, 0, 100)).toBe(50);
      expect(snapIntensity(110, 5, 0, 100)).toBe(100);
      expect(snapIntensity(-10, 5, 0, 100)).toBe(0);
    });

    it('should handle out-of-range after rounding', () => {
      expect(snapIntensity(103, 5, 0, 100)).toBe(100);
      expect(snapIntensity(-3, 5, 0, 100)).toBe(0);
    });
  });
});
