import { clamp, roundToStep } from '../utils/number';

/**
 * SliderControl utility functions
 * TASK: MOBILE-004 — Extract slider calculation logic for testability
 *
 * Pure functions extracted from SliderControl component to enable
 * thorough testing of positioning/value calculation logic
 */

/**
 * Calculate slider value from touch position
 *
 * @param positionX - X coordinate of touch in pixels
 * @param trackWidth - Width of slider track in pixels
 * @param min - Minimum value of slider range
 * @param max - Maximum value of slider range
 * @param step - Step value for snapping (e.g., 5 for 0,5,10,15...)
 * @returns Calculated value clamped to min/max and snapped to step
 *
 * Logic:
 * 1. Calculate ratio of position relative to track width (0 to 1)
 * 2. Map ratio to value range (min to max)
 * 3. Snap to step intervals
 * 4. Clamp to min/max bounds
 */
export const calculateSliderValue = (
  positionX: number,
  trackWidth: number,
  min: number,
  max: number,
  step: number
): number => {
  // Line 43: Calculate ratio as percentage of track
  const ratio = clamp(positionX / trackWidth, 0, 1);

  // Line 44: Map ratio to value range
  const rawValue = min + ratio * (max - min);

  // Line 45: Snap to step intervals
  const stepped = roundToStep(rawValue, step);

  // Line 46: Clamp to min/max
  return clamp(stepped, min, max);
};

/**
 * Calculate percentage for visual display
 *
 * @param value - Current slider value
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Percentage (0-100) of value within range
 */
export const calculatePercent = (
  value: number,
  min: number,
  max: number
): number => {
  if (max === min) return 0; // Avoid division by zero
  return ((value - min) / (max - min)) * 100;
};

/**
 * Validate slider configuration
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param step - Step value
 * @returns true if configuration is valid, false otherwise
 */
export const isValidSliderConfig = (
  min: number,
  max: number,
  step: number
): boolean => {
  return (
    typeof min === 'number' &&
    typeof max === 'number' &&
    typeof step === 'number' &&
    min < max &&
    step > 0
  );
};
