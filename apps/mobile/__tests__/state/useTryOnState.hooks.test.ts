import { renderHook, act } from '@testing-library/react-native';
import { useTryOnState } from '../../src/state/useTryOnState';
import { PALETTE } from '../../src/utils/palette';

/**
 * Tests for state/useTryOnState.ts :: Hook Implementation
 * TASK: MOBILE-002 — Try-On State Hook Callback Execution
 *
 * Test coverage:
 * ✓ selectColor callback executes and updates state
 * ✓ setIntensity callback executes, snaps value, and updates state
 * ✓ setBeforeAfterPosition callback executes, clamps value, and updates state
 * ✓ markLoading callback updates status
 * ✓ markSuccess callback updates result and resets beforeAfterPosition
 * ✓ markError callback updates error
 * ✓ resetFlow callback resets to initial state
 * ✓ regenerateRequestId callback generates new ID
 */

describe('useTryOnState hook - Callback Execution', () => {
  // ============================================================================
  // selectColor callback
  // ============================================================================

  describe('selectColor callback', () => {
    it('should update selectedColor when called', () => {
      const { result } = renderHook(() => useTryOnState());

      expect(result.current.selectedColor).toBe(PALETTE[0]);

      act(() => {
        result.current.selectColor(PALETTE[3]);
      });

      expect(result.current.selectedColor).toBe(PALETTE[3]);
    });

    it('should work with all palette colors', () => {
      const { result } = renderHook(() => useTryOnState());

      PALETTE.forEach((color) => {
        act(() => {
          result.current.selectColor(color);
        });

        expect(result.current.selectedColor).toBe(color);
      });
    });

    it('should update color without affecting intensity', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(75);
      });

      const originalIntensity = result.current.intensity;

      act(() => {
        result.current.selectColor(PALETTE[5]);
      });

      expect(result.current.intensity).toBe(originalIntensity);
      expect(result.current.selectedColor).toBe(PALETTE[5]);
    });
  });

  // ============================================================================
  // setIntensity callback (with snapping)
  // ============================================================================

  describe('setIntensity callback', () => {
    it('should update intensity when called with valid value', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(75);
      });

      expect(result.current.intensity).toBe(75);
    });

    it('should snap intensity to nearest step (5)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(63); // Should snap to 65
      });

      expect(result.current.intensity).toBe(65);
    });

    it('should clamp intensity to min (0)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(-10);
      });

      expect(result.current.intensity).toBe(0);
    });

    it('should clamp intensity to max (100)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(120);
      });

      expect(result.current.intensity).toBe(100);
    });

    it('should snap and clamp together', () => {
      const { result } = renderHook(() => useTryOnState());

      // Input 127 → snap to 125 → clamp to 100
      act(() => {
        result.current.setIntensity(127);
      });

      expect(result.current.intensity).toBe(100);
    });

    it('should allow valid step values', () => {
      const { result } = renderHook(() => useTryOnState());

      const validValues = [0, 5, 10, 25, 50, 75, 100];

      validValues.forEach((value) => {
        act(() => {
          result.current.setIntensity(value);
        });

        expect(result.current.intensity).toBe(value);
      });
    });
  });

  // ============================================================================
  // setBeforeAfterPosition callback (with clamping)
  // ============================================================================

  describe('setBeforeAfterPosition callback', () => {
    it('should update beforeAfterPosition when called', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setBeforeAfterPosition(0.5);
      });

      expect(result.current.beforeAfterPosition).toBeCloseTo(0.5);
    });

    it('should clamp position to 0', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setBeforeAfterPosition(-0.5);
      });

      expect(result.current.beforeAfterPosition).toBe(0);
    });

    it('should clamp position to 1', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setBeforeAfterPosition(1.5);
      });

      expect(result.current.beforeAfterPosition).toBe(1);
    });

    it('should allow values between 0 and 1', () => {
      const { result } = renderHook(() => useTryOnState());

      const values = [0, 0.25, 0.5, 0.75, 1];

      values.forEach((value) => {
        act(() => {
          result.current.setBeforeAfterPosition(value);
        });

        expect(result.current.beforeAfterPosition).toBeCloseTo(value, 5);
      });
    });
  });

  // ============================================================================
  // markLoading callback
  // ============================================================================

  describe('markLoading callback', () => {
    it('should set status to loading', () => {
      const { result } = renderHook(() => useTryOnState());

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.markLoading();
      });

      expect(result.current.status).toBe('loading');
    });

    it('should clear error when marking loading', () => {
      const { result } = renderHook(() => useTryOnState());

      // First set an error
      act(() => {
        result.current.markError({
          code: 'TEST_ERROR',
          message: 'Test error',
        });
      });

      expect(result.current.error).toBeDefined();

      // Then mark loading
      act(() => {
        result.current.markLoading();
      });

      expect(result.current.status).toBe('loading');
      expect(result.current.error).toBeUndefined();
    });

    it('should not clear result when marking loading', () => {
      const { result } = renderHook(() => useTryOnState());

      const mockResult = {
        imageUrl: 'http://example.com/result.jpg',
        processingMs: 250,
        color: 'Sunlit Amber',
        requestId: 'req-123',
      };

      // Set result first
      act(() => {
        result.current.markSuccess(mockResult);
      });

      // Then mark loading again
      act(() => {
        result.current.markLoading();
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.status).toBe('loading');
    });
  });

  // ============================================================================
  // markSuccess callback
  // ============================================================================

  describe('markSuccess callback', () => {
    it('should set status to success and store result', () => {
      const { result } = renderHook(() => useTryOnState());

      const mockResult = {
        imageUrl: 'http://example.com/result.jpg',
        processingMs: 250,
        color: 'Sunlit Amber',
        requestId: 'req-123',
      };

      act(() => {
        result.current.markSuccess(mockResult);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.result).toEqual(mockResult);
    });

    it('should clear error when marking success', () => {
      const { result } = renderHook(() => useTryOnState());

      // First set an error
      act(() => {
        result.current.markError({
          code: 'TEST_ERROR',
          message: 'Test error',
        });
      });

      // Then mark success
      const mockResult = {
        imageUrl: 'url',
        processingMs: 100,
        color: 'red',
        requestId: 'req',
      };

      act(() => {
        result.current.markSuccess(mockResult);
      });

      expect(result.current.error).toBeUndefined();
      expect(result.current.status).toBe('success');
    });

    it('should reset beforeAfterPosition to 1 on success', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setBeforeAfterPosition(0.3);
      });

      expect(result.current.beforeAfterPosition).toBe(0.3);

      act(() => {
        result.current.markSuccess({
          imageUrl: 'url',
          processingMs: 100,
          color: 'red',
          requestId: 'req',
        });
      });

      expect(result.current.beforeAfterPosition).toBe(1);
    });

    it('should work with different result payloads', () => {
      const { result } = renderHook(() => useTryOnState());

      const results = [
        {
          imageUrl: 'http://api.example.com/result1.jpg',
          processingMs: 150,
          color: 'Copper Bloom',
          requestId: 'req-1',
        },
        {
          imageUrl: 'http://api.example.com/result2.jpg',
          processingMs: 300,
          color: 'Forest Veil',
          requestId: 'req-2',
        },
      ];

      results.forEach((mockResult) => {
        act(() => {
          result.current.markSuccess(mockResult);
        });

        expect(result.current.result).toEqual(mockResult);
      });
    });
  });

  // ============================================================================
  // markError callback
  // ============================================================================

  describe('markError callback', () => {
    it('should set status to error and store error', () => {
      const { result } = renderHook(() => useTryOnState());

      const error = {
        code: 'API_ERROR',
        message: 'Connection failed',
      };

      act(() => {
        result.current.markError(error);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toEqual(error);
    });

    it('should store error with requestId', () => {
      const { result } = renderHook(() => useTryOnState());

      const error = {
        code: 'API_ERROR',
        message: 'Connection failed',
        requestId: 'req-trace-123',
      };

      act(() => {
        result.current.markError(error);
      });

      expect(result.current.error?.requestId).toBe('req-trace-123');
    });

    it('should not clear result when marking error', () => {
      const { result } = renderHook(() => useTryOnState());

      const mockResult = {
        imageUrl: 'url',
        processingMs: 100,
        color: 'red',
        requestId: 'req',
      };

      // Set result first
      act(() => {
        result.current.markSuccess(mockResult);
      });

      // Then mark error
      act(() => {
        result.current.markError({
          code: 'ERROR',
          message: 'Error after success',
        });
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.status).toBe('error');
    });
  });

  // ============================================================================
  // resetFlow callback
  // ============================================================================

  describe('resetFlow callback', () => {
    it('should reset state to initial state', () => {
      const { result } = renderHook(() => useTryOnState());

      // Change state
      act(() => {
        result.current.selectColor(PALETTE[5]);
        result.current.setIntensity(75);
        result.current.setBeforeAfterPosition(0.3);
      });

      // Reset
      act(() => {
        result.current.resetFlow();
      });

      expect(result.current.selectedColor).toBe(PALETTE[0]);
      expect(result.current.intensity).toBe(50);
      expect(result.current.beforeAfterPosition).toBe(1);
      expect(result.current.status).toBe('idle');
    });

    it('should clear result and error on reset', () => {
      const { result } = renderHook(() => useTryOnState());

      // Set result and error
      act(() => {
        result.current.markSuccess({
          imageUrl: 'url',
          processingMs: 100,
          color: 'red',
          requestId: 'req',
        });
      });

      act(() => {
        result.current.markError({
          code: 'ERROR',
          message: 'Error',
        });
      });

      // Reset
      act(() => {
        result.current.resetFlow();
      });

      expect(result.current.result).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('should generate new requestId on reset', () => {
      const { result } = renderHook(() => useTryOnState());

      const originalRequestId = result.current.requestId;

      act(() => {
        result.current.resetFlow();
      });

      expect(result.current.requestId).not.toBe(originalRequestId);
      expect(result.current.requestId).toMatch(/^req-/);
    });
  });

  // ============================================================================
  // regenerateRequestId callback
  // ============================================================================

  describe('regenerateRequestId callback', () => {
    it('should generate new requestId', () => {
      const { result } = renderHook(() => useTryOnState());

      const originalRequestId = result.current.requestId;

      act(() => {
        result.current.regenerateRequestId();
      });

      expect(result.current.requestId).not.toBe(originalRequestId);
    });

    it('should keep other state unchanged when regenerating ID', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.selectColor(PALETTE[3]);
        result.current.setIntensity(75);
      });

      const color = result.current.selectedColor;
      const intensity = result.current.intensity;

      act(() => {
        result.current.regenerateRequestId();
      });

      expect(result.current.selectedColor).toBe(color);
      expect(result.current.intensity).toBe(intensity);
      expect(result.current.requestId).toMatch(/^req-/);
    });

    it('should generate unique IDs for consecutive calls', () => {
      const { result } = renderHook(() => useTryOnState());

      const ids = new Set<string>();

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.regenerateRequestId();
        });

        ids.add(result.current.requestId);
      }

      expect(ids.size).toBe(5);
    });
  });

  // ============================================================================
  // State Machine Transitions
  // ============================================================================

  describe('State machine transitions', () => {
    it('should transition: idle → loading → success', () => {
      const { result } = renderHook(() => useTryOnState());

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.markLoading();
      });
      expect(result.current.status).toBe('loading');

      act(() => {
        result.current.markSuccess({
          imageUrl: 'url',
          processingMs: 100,
          color: 'red',
          requestId: 'req',
        });
      });
      expect(result.current.status).toBe('success');
    });

    it('should transition: idle → loading → error', () => {
      const { result } = renderHook(() => useTryOnState());

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.markLoading();
      });
      expect(result.current.status).toBe('loading');

      act(() => {
        result.current.markError({
          code: 'ERROR',
          message: 'Error message',
        });
      });
      expect(result.current.status).toBe('error');
    });

    it('should allow retry: error → loading → success', () => {
      const { result } = renderHook(() => useTryOnState());

      // First attempt fails
      act(() => {
        result.current.markLoading();
        result.current.markError({
          code: 'ERROR',
          message: 'First attempt failed',
        });
      });

      expect(result.current.status).toBe('error');

      // Retry
      act(() => {
        result.current.markLoading();
      });
      expect(result.current.status).toBe('loading');

      act(() => {
        result.current.markSuccess({
          imageUrl: 'url',
          processingMs: 100,
          color: 'red',
          requestId: 'req',
        });
      });
      expect(result.current.status).toBe('success');
    });
  });

  // ============================================================================
  // Coverage: Lines executed by callbacks
  // ============================================================================

  describe('Code coverage', () => {
    it('executes selectColor callback (lines 77-82)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.selectColor(PALETTE[2]);
      });

      expect(result.current.selectedColor).toBe(PALETTE[2]);
    });

    it('executes setIntensity callback with snapping (lines 84-89)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setIntensity(63);
      });

      expect(result.current.intensity).toBe(65);
    });

    it('executes setBeforeAfterPosition callback with clamping (lines 91-96)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.setBeforeAfterPosition(1.5);
      });

      expect(result.current.beforeAfterPosition).toBe(1);
    });

    it('executes markLoading callback (lines 98-104)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.markLoading();
      });

      expect(result.current.status).toBe('loading');
    });

    it('executes markSuccess callback (lines 106-114)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.markSuccess({
          imageUrl: 'url',
          processingMs: 100,
          color: 'red',
          requestId: 'req',
        });
      });

      expect(result.current.status).toBe('success');
    });

    it('executes markError callback (lines 116-122)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.markError({
          code: 'ERROR',
          message: 'Error',
        });
      });

      expect(result.current.status).toBe('error');
    });

    it('executes resetFlow callback (lines 124-126)', () => {
      const { result } = renderHook(() => useTryOnState());

      act(() => {
        result.current.selectColor(PALETTE[3]);
        result.current.resetFlow();
      });

      expect(result.current.selectedColor).toBe(PALETTE[0]);
    });

    it('executes regenerateRequestId callback (lines 128-133)', () => {
      const { result } = renderHook(() => useTryOnState());

      const original = result.current.requestId;

      act(() => {
        result.current.regenerateRequestId();
      });

      expect(result.current.requestId).not.toBe(original);
    });
  });
});
