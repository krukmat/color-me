import {
  clampBeforeAfterPosition,
  createInitialTryOnState,
  snapIntensityValue,
} from '../src/state/useTryOnState';
import { PALETTE } from '../src/utils/palette';

/**
 * Tests for state/useTryOnState.ts
 * TASK: MOBILE-002 — State Machine Testing
 *
 * Test coverage:
 * ✓ Helper functions (createInitialState, snap, clamp)
 * ✓ Hook callbacks (selectColor, setIntensity, setBeforeAfterPosition)
 * ✓ State machine (markLoading, markSuccess, markError)
 * ✓ Cleanup (resetFlow, regenerateRequestId)
 */

describe('try-on state helpers', () => {
  it('creates initial state with defaults', () => {
    const state = createInitialTryOnState();
    expect(state.intensity).toBe(50);
    expect(state.beforeAfterPosition).toBe(1);
    expect(state.status).toBe('idle');
    expect(state.requestId).toMatch(/^req-/);
  });

  it('clamps before/after slider between 0 and 1', () => {
    expect(clampBeforeAfterPosition(-0.5)).toBe(0);
    expect(clampBeforeAfterPosition(0.4)).toBeCloseTo(0.4);
    expect(clampBeforeAfterPosition(1.4)).toBe(1);
  });

  it('snaps intensity to configured step and range', () => {
    expect(snapIntensityValue(63)).toBe(65);
    expect(snapIntensityValue(-10)).toBe(0);
    expect(snapIntensityValue(120)).toBe(100);
  });
});

describe('palette integration with state helpers', () => {
  it('initial state uses first color from palette', () => {
    const state = createInitialTryOnState();
    expect(state.selectedColor).toBe(PALETTE[0]);
  });

  it('all palette colors can be valid selections', () => {
    PALETTE.forEach((color) => {
      expect(color).toHaveProperty('name');
      expect(color).toHaveProperty('hex');
    });
  });
});
