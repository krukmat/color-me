import { useCallback, useMemo, useState } from "react";
import { clamp, roundToStep } from "../utils/number";
import {
  DEFAULT_INTENSITY,
  INTENSITY_STEP,
  MAX_INTENSITY,
  MIN_INTENSITY,
  PALETTE,
  type PaletteColor,
} from "../utils/palette";
import { createRequestId } from "../utils/request";

export type TryOnStatus = "idle" | "loading" | "success" | "error";

export interface TryOnResult {
  imageUrl: string;
  processingMs: number;
  color: string;
  requestId: string;
}

export interface TryOnError {
  code: string;
  message: string;
  requestId?: string;
}

export interface UseTryOnState {
  selectedColor: PaletteColor;
  intensity: number;
  beforeAfterPosition: number;
  status: TryOnStatus;
  requestId: string;
  result?: TryOnResult;
  error?: TryOnError;
  selectColor: (color: PaletteColor) => void;
  setIntensity: (value: number) => void;
  setBeforeAfterPosition: (value: number) => void;
  markLoading: () => void;
  markSuccess: (result: TryOnResult) => void;
  markError: (error: TryOnError) => void;
  resetFlow: () => void;
  regenerateRequestId: () => void;
}

export interface TryOnStateShape {
  selectedColor: PaletteColor;
  intensity: number;
  beforeAfterPosition: number;
  status: TryOnStatus;
  requestId: string;
  result?: TryOnResult;
  error?: TryOnError;
}

export const snapIntensityValue = (value: number): number => {
  const snapped = roundToStep(value, INTENSITY_STEP);
  return clamp(snapped, MIN_INTENSITY, MAX_INTENSITY);
};

export const clampBeforeAfterPosition = (value: number): number =>
  clamp(value, 0, 1);

export const createInitialTryOnState = (): TryOnStateShape => ({
  selectedColor: PALETTE[0],
  intensity: DEFAULT_INTENSITY,
  beforeAfterPosition: 1,
  status: "idle",
  requestId: createRequestId(),
  result: undefined,
  error: undefined,
});

export const useTryOnState = (): UseTryOnState => {
  const [state, setState] = useState<TryOnStateShape>(createInitialTryOnState);

  const selectColor = useCallback((color: PaletteColor) => {
    setState((prev) => ({
      ...prev,
      selectedColor: color,
    }));
  }, []);

  const setIntensityValue = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      intensity: snapIntensityValue(value),
    }));
  }, []);

  const setBeforeAfterPositionValue = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      beforeAfterPosition: clampBeforeAfterPosition(value),
    }));
  }, []);

  const markLoading = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "loading",
      error: undefined,
    }));
  }, []);

  const markSuccess = useCallback((result: TryOnResult) => {
    setState((prev) => ({
      ...prev,
      status: "success",
      result,
      error: undefined,
      beforeAfterPosition: 1,
    }));
  }, []);

  const markError = useCallback((error: TryOnError) => {
    setState((prev) => ({
      ...prev,
      status: "error",
      error,
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setState(createInitialTryOnState());
  }, []);

  const regenerateRequestId = useCallback(() => {
    setState((prev) => ({
      ...prev,
      requestId: createRequestId(),
    }));
  }, []);

  return useMemo(
    () => ({
      ...state,
      selectColor,
      setIntensity: setIntensityValue,
      setBeforeAfterPosition: setBeforeAfterPositionValue,
      markLoading,
      markSuccess,
      markError,
      resetFlow,
      regenerateRequestId,
    }),
    [
      state,
      selectColor,
      setIntensityValue,
      setBeforeAfterPositionValue,
      markLoading,
      markSuccess,
      markError,
      resetFlow,
      regenerateRequestId,
    ]
  );
};
