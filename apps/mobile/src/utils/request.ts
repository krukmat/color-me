import type { SelfieData } from "../types/selfie";
import { clamp, roundToStep } from "./number";
import {
  DEFAULT_INTENSITY,
  INTENSITY_STEP,
  MAX_INTENSITY,
  MIN_INTENSITY,
} from "./palette";

export interface TryOnPayload {
  selfie: string;
  color: string;
  intensity: number;
  request_id: string;
}

export interface BuildTryOnPayloadArgs {
  selfie: SelfieData;
  color: string;
  intensity?: number;
  requestId?: string;
}

export const createRequestId = (): string =>
  `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const snapIntensity = (value: number | undefined): number => {
  if (typeof value !== "number") return DEFAULT_INTENSITY;
  const snapped = roundToStep(value, INTENSITY_STEP);
  return clamp(snapped, MIN_INTENSITY, MAX_INTENSITY);
};

export const buildTryOnPayload = ({
  selfie,
  color,
  intensity,
  requestId,
}: BuildTryOnPayloadArgs): TryOnPayload => {
  if (!selfie?.base64) {
    throw new Error("La selfie debe incluir datos base64 para enviarse al BFF.");
  }

  const finalRequestId = requestId ?? createRequestId();

  return {
    selfie: selfie.base64,
    color,
    intensity: snapIntensity(intensity),
    request_id: finalRequestId,
  };
};
