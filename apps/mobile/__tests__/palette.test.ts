import {
  PALETTE,
  findPaletteColor,
  MIN_INTENSITY,
  MAX_INTENSITY,
  INTENSITY_STEP,
  DEFAULT_INTENSITY,
  PaletteColor,
} from '../src/utils/palette';

/**
 * Tests for utils/palette.ts
 * TASK: MOBILE-002 — Palette Constants Testing
 *
 * Test coverage:
 * ✓ PALETTE has 10 unique colors with valid structure
 * ✓ findPaletteColor lookup (find, not-find)
 * ✓ Intensity constants (MIN, MAX, STEP, DEFAULT)
 */

describe('palette definition', () => {
  it('contains 10 unique colors', () => {
    expect(PALETTE).toHaveLength(10);
    const uniqueNames = new Set(PALETTE.map((color) => color.name));
    expect(uniqueNames.size).toBe(10);
  });

  it('each color has required properties', () => {
    PALETTE.forEach((color) => {
      expect(color).toHaveProperty('name');
      expect(color).toHaveProperty('hex');
      expect(color).toHaveProperty('description');
      expect(typeof color.name).toBe('string');
      expect(typeof color.hex).toBe('string');
      expect(typeof color.description).toBe('string');
    });
  });

  it('contains expected color names', () => {
    const expectedNames = [
      'Midnight Espresso',
      'Copper Bloom',
      'Rosewood Fade',
      'Saffron Glaze',
      'Sunlit Amber',
      'Forest Veil',
      'Lilac Mist',
      'Soft Slate',
      'Blush Garnet',
      'Champagne Frost',
    ];
    const actualNames = PALETTE.map((c) => c.name);
    expect(actualNames).toEqual(expectedNames);
  });

  it('uses valid hex codes', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    PALETTE.forEach((color) => {
      expect(hexRegex.test(color.hex)).toBe(true);
    });
  });

  it('has non-empty descriptions', () => {
    PALETTE.forEach((color) => {
      expect(color.description.length).toBeGreaterThan(0);
    });
  });
});

describe('findPaletteColor', () => {
  it('finds existing color by name', () => {
    const result = findPaletteColor('Sunlit Amber');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Sunlit Amber');
    expect(result?.hex).toBe('#F4B55E');
  });

  it('returns undefined for non-existent color', () => {
    const result = findPaletteColor('Unknown Color');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const result = findPaletteColor('');
    expect(result).toBeUndefined();
  });

  it('is case-sensitive', () => {
    const result1 = findPaletteColor('sunlit amber');
    const result2 = findPaletteColor('SUNLIT AMBER');
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
  });

  it('finds all colors in palette', () => {
    PALETTE.forEach((color) => {
      const found = findPaletteColor(color.name);
      expect(found).toEqual(color);
    });
  });

  it('returns PaletteColor type', () => {
    const result = findPaletteColor('Midnight Espresso');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('hex');
    expect(result).toHaveProperty('description');
  });
});

describe('intensity constants', () => {
  it('MIN_INTENSITY is 0', () => {
    expect(MIN_INTENSITY).toBe(0);
  });

  it('MAX_INTENSITY is 100', () => {
    expect(MAX_INTENSITY).toBe(100);
  });

  it('INTENSITY_STEP is 5', () => {
    expect(INTENSITY_STEP).toBe(5);
  });

  it('DEFAULT_INTENSITY is 50', () => {
    expect(DEFAULT_INTENSITY).toBe(50);
  });

  it('DEFAULT_INTENSITY is within bounds', () => {
    expect(DEFAULT_INTENSITY).toBeGreaterThanOrEqual(MIN_INTENSITY);
    expect(DEFAULT_INTENSITY).toBeLessThanOrEqual(MAX_INTENSITY);
  });

  it('MAX_INTENSITY is multiple of INTENSITY_STEP', () => {
    expect(MAX_INTENSITY % INTENSITY_STEP).toBe(0);
  });

  it('MIN_INTENSITY equals 0', () => {
    expect(MIN_INTENSITY).toBe(0);
  });

  it('intensity constants define valid range', () => {
    expect(MAX_INTENSITY).toBeGreaterThan(MIN_INTENSITY);
    expect(MAX_INTENSITY - MIN_INTENSITY).toBe(100);
  });
});

describe('palette type safety', () => {
  it('PALETTE is array of PaletteColor', () => {
    expect(Array.isArray(PALETTE)).toBe(true);
    PALETTE.forEach((color) => {
      expect(typeof color.name).toBe('string');
      expect(typeof color.hex).toBe('string');
      expect(typeof color.description).toBe('string');
    });
  });

  it('constants are numbers', () => {
    expect(typeof MIN_INTENSITY).toBe('number');
    expect(typeof MAX_INTENSITY).toBe('number');
    expect(typeof INTENSITY_STEP).toBe('number');
    expect(typeof DEFAULT_INTENSITY).toBe('number');
  });
});
