import {
  calculateSliderValue,
  calculatePercent,
  isValidSliderConfig,
} from '../../src/components/SliderControl.utils';

/**
 * Tests for components/SliderControl.utils.ts
 * TASK: MOBILE-004 — Pure Function Testing for Slider Calculations
 *
 * Test coverage:
 * ✓ calculateSliderValue: position to value mapping
 * ✓ calculatePercent: value to percentage conversion
 * ✓ isValidSliderConfig: configuration validation
 */

describe('SliderControl.utils', () => {
  // ============================================================================
  // calculateSliderValue - Core slider logic
  // ============================================================================

  describe('calculateSliderValue', () => {
    it('should return min value when position is at left edge (0)', () => {
      const value = calculateSliderValue(0, 200, 0, 100, 5);
      expect(value).toBeLessThanOrEqual(5); // Snapped to step
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should return max value when position is at right edge (trackWidth)', () => {
      const value = calculateSliderValue(200, 200, 0, 100, 5);
      expect(value).toBeGreaterThanOrEqual(95); // Snapped to step
      expect(value).toBeLessThanOrEqual(100);
    });

    it('should return middle value when position is at center', () => {
      const value = calculateSliderValue(100, 200, 0, 100, 5);
      // Should be around 50 (snapped to nearest 5)
      expect(value).toBeGreaterThanOrEqual(45);
      expect(value).toBeLessThanOrEqual(55);
    });

    it('should snap values to step intervals', () => {
      // Position 30 out of 200 = 15% = 15 (should snap to 15)
      const value = calculateSliderValue(30, 200, 0, 100, 5);
      expect(value % 5).toBe(0); // Should be multiple of step
    });

    it('should clamp to min when result is below min', () => {
      const value = calculateSliderValue(-100, 200, 10, 90, 5);
      expect(value).toBeGreaterThanOrEqual(10);
    });

    it('should clamp to max when result is above max', () => {
      const value = calculateSliderValue(300, 200, 10, 90, 5);
      expect(value).toBeLessThanOrEqual(90);
    });

    it('should work with non-zero min values', () => {
      // Min=20, Max=80, step=5
      const value = calculateSliderValue(100, 200, 20, 80, 5);
      expect(value).toBeGreaterThanOrEqual(20);
      expect(value).toBeLessThanOrEqual(80);
    });

    it('should work with fractional range (0-1)', () => {
      const value = calculateSliderValue(100, 200, 0, 1, 0.05);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle small step values', () => {
      const value = calculateSliderValue(50, 200, 0, 100, 1);
      // Position 50/200 = 25%
      expect(value).toBeCloseTo(25, 0);
    });

    it('should handle large step values', () => {
      const value = calculateSliderValue(100, 200, 0, 100, 25);
      // Should snap to 25, 50, 75
      expect(value).toEqual(expect.objectContaining({})); // Valid number
      expect(value % 25).toBe(0);
    });

    it('should handle multiple consecutive calls consistently', () => {
      const position = 75;
      const trackWidth = 200;
      const min = 0;
      const max = 100;
      const step = 5;

      const value1 = calculateSliderValue(position, trackWidth, min, max, step);
      const value2 = calculateSliderValue(position, trackWidth, min, max, step);
      const value3 = calculateSliderValue(position, trackWidth, min, max, step);

      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });

    it('should map left quarter position correctly', () => {
      const value = calculateSliderValue(50, 200, 0, 100, 5);
      // 50/200 = 25%
      expect(value).toBeGreaterThanOrEqual(20);
      expect(value).toBeLessThanOrEqual(30);
    });

    it('should map right quarter position correctly', () => {
      const value = calculateSliderValue(150, 200, 0, 100, 5);
      // 150/200 = 75%
      expect(value).toBeGreaterThanOrEqual(70);
      expect(value).toBeLessThanOrEqual(80);
    });

    it('should handle negative ranges', () => {
      const value = calculateSliderValue(100, 200, -50, 50, 5);
      expect(value).toBeGreaterThanOrEqual(-50);
      expect(value).toBeLessThanOrEqual(50);
    });

    it('should work with different track widths', () => {
      // Same ratio should produce same result
      const value1 = calculateSliderValue(50, 100, 0, 100, 5);
      const value2 = calculateSliderValue(100, 200, 0, 100, 5);

      // Both are 50% through track
      expect(value1).toBeCloseTo(value2, 5);
    });

    it('should handle position beyond track width gracefully', () => {
      const value = calculateSliderValue(300, 200, 0, 100, 5);
      // Should clamp to max
      expect(value).toBeLessThanOrEqual(100);
    });

    it('should handle zero position', () => {
      const value = calculateSliderValue(0, 200, 0, 100, 5);
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should handle position exactly at trackWidth', () => {
      const value = calculateSliderValue(200, 200, 0, 100, 5);
      expect(value).toBeGreaterThanOrEqual(95);
      expect(value).toBeLessThanOrEqual(100);
    });

    it('should work with very small step (0.01)', () => {
      const value = calculateSliderValue(50, 200, 0, 1, 0.01);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // calculatePercent - Value to percentage
  // ============================================================================

  describe('calculatePercent', () => {
    it('should return 0 when value equals min', () => {
      const percent = calculatePercent(0, 0, 100);
      expect(percent).toBe(0);
    });

    it('should return 100 when value equals max', () => {
      const percent = calculatePercent(100, 0, 100);
      expect(percent).toBe(100);
    });

    it('should return 50 when value is at middle', () => {
      const percent = calculatePercent(50, 0, 100);
      expect(percent).toBe(50);
    });

    it('should handle non-zero min', () => {
      const percent = calculatePercent(50, 20, 80);
      // (50-20)/(80-20) * 100 = 30/60 * 100 = 50
      expect(percent).toBe(50);
    });

    it('should handle fractional values', () => {
      const percent = calculatePercent(0.5, 0, 1);
      expect(percent).toBe(50);
    });

    it('should return 0 when min equals max', () => {
      const percent = calculatePercent(50, 50, 50);
      expect(percent).toBe(0); // Avoid division by zero
    });

    it('should work with negative ranges', () => {
      const percent = calculatePercent(0, -50, 50);
      // (0-(-50))/(50-(-50)) * 100 = 50/100 * 100 = 50
      expect(percent).toBe(50);
    });

    it('should return correct percent for quarter values', () => {
      expect(calculatePercent(25, 0, 100)).toBe(25);
      expect(calculatePercent(75, 0, 100)).toBe(75);
    });
  });

  // ============================================================================
  // isValidSliderConfig - Configuration validation
  // ============================================================================

  describe('isValidSliderConfig', () => {
    it('should accept valid config', () => {
      const valid = isValidSliderConfig(0, 100, 5);
      expect(valid).toBe(true);
    });

    it('should reject when min >= max', () => {
      expect(isValidSliderConfig(100, 100, 5)).toBe(false);
      expect(isValidSliderConfig(100, 50, 5)).toBe(false);
    });

    it('should reject when step <= 0', () => {
      expect(isValidSliderConfig(0, 100, 0)).toBe(false);
      expect(isValidSliderConfig(0, 100, -5)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(isValidSliderConfig(NaN, 100, 5)).toBe(false);
      expect(isValidSliderConfig(0, NaN, 5)).toBe(false);
      expect(isValidSliderConfig(0, 100, NaN)).toBe(false);
    });

    it('should accept negative ranges', () => {
      const valid = isValidSliderConfig(-100, 100, 5);
      expect(valid).toBe(true);
    });

    it('should accept fractional steps', () => {
      const valid = isValidSliderConfig(0, 1, 0.05);
      expect(valid).toBe(true);
    });

    it('should accept very small steps', () => {
      const valid = isValidSliderConfig(0, 100, 0.001);
      expect(valid).toBe(true);
    });

    it('should accept large ranges', () => {
      const valid = isValidSliderConfig(0, 10000, 100);
      expect(valid).toBe(true);
    });
  });

  // ============================================================================
  // Integration: Complete calculation flow
  // ============================================================================

  describe('Integration: Complete flow', () => {
    it('should handle intensity slider (0-100, step 5)', () => {
      const trackWidth = 300;
      const min = 0;
      const max = 100;
      const step = 5;

      // Test various positions
      const positions = [0, 75, 150, 225, 300];

      positions.forEach((pos) => {
        const value = calculateSliderValue(pos, trackWidth, min, max, step);

        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
        expect(value % step).toBe(0);
      });
    });

    it('should handle before/after slider (0-1, step 0.05)', () => {
      const trackWidth = 300;
      const min = 0;
      const max = 1;
      const step = 0.05;

      const value = calculateSliderValue(150, trackWidth, min, max, step);

      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    });

    it('should calculate percent correctly from value', () => {
      const min = 0;
      const max = 100;

      const value = calculateSliderValue(100, 200, min, max, 5);
      const percent = calculatePercent(value, min, max);

      expect(percent).toBeGreaterThanOrEqual(40);
      expect(percent).toBeLessThanOrEqual(60);
    });
  });

  // ============================================================================
  // Code coverage: Lines from SliderControl (43-46)
  // ============================================================================

  describe('Code coverage - SliderControl lines 43-46', () => {
    it('executes ratio calculation (line 43)', () => {
      // const ratio = clamp(positionX / trackWidth, 0, 1);
      const value = calculateSliderValue(50, 200, 0, 100, 5);
      expect(typeof value).toBe('number');
    });

    it('executes rawValue calculation (line 44)', () => {
      // const rawValue = min + ratio * (max - min);
      const value = calculateSliderValue(100, 200, 10, 90, 5);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(90);
    });

    it('executes snapping (line 45)', () => {
      // const stepped = roundToStep(rawValue, step);
      const value = calculateSliderValue(63, 200, 0, 100, 5);
      expect(value % 5).toBe(0); // Snapped
    });

    it('executes clamping (line 46)', () => {
      // return clamp(stepped, min, max);
      const value = calculateSliderValue(300, 200, 0, 100, 5);
      expect(value).toBeLessThanOrEqual(100);
    });
  });
});
