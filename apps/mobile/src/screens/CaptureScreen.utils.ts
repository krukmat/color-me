/**
 * CaptureScreen utility functions
 * TASK: MOBILE-003 — Extracted callbacks for better testability
 *
 * Pure functions extracted from CaptureScreen for unit testing
 */

import { Alert } from 'react-native';
import type { Selfie } from '../types/selfie';
import { buildTryOnPayload } from '../utils/request';
import { performTryOn } from '../services/tryOnService';
import { shareResult } from '../utils/share';
import type { TryOnState } from '../state/useTryOnState';
import type { ColorOption } from '../utils/palette';

const MAX_FILE_MB = 5;

/**
 * Format bytes to MB
 */
export const formatBytesToMB = (bytes?: number): number => {
  if (!bytes) return 0;
  return bytes / (1024 * 1024);
};

/**
 * Validate and handle selfie selection result
 * Returns { valid: boolean, error?: string }
 */
export const validateSelfieResult = (
  result: Selfie | undefined
): { valid: boolean; error?: string } => {
  if (!result) {
    return { valid: false };
  }

  const sizeMB = formatBytesToMB(result.fileSize);
  if (sizeMB > MAX_FILE_MB) {
    return {
      valid: false,
      error: `Tu selfie excede el tamaño permitido. (${sizeMB.toFixed(1)}MB > ${MAX_FILE_MB}MB)`,
    };
  }

  return { valid: true };
};

/**
 * Validate selfie has required fields before applying color
 * Returns { valid: boolean, error?: string }
 */
export const validateSelfieForApply = (
  selfie: Selfie | undefined
): { valid: boolean; error?: string } => {
  if (!selfie) {
    return {
      valid: false,
      error: 'Necesitamos una selfie para aplicar el color.',
    };
  }

  if (!selfie.base64) {
    return {
      valid: false,
      error: 'Necesitamos acceso al base64 para enviar la selfie.',
    };
  }

  return { valid: true };
};

/**
 * Build try-on request payload
 */
export const buildTryOnRequest = (
  selfie: Selfie,
  selectedColor: ColorOption,
  intensity: number,
  requestId: string
) => {
  return buildTryOnPayload({
    selfie,
    color: selectedColor.name,
    intensity,
    requestId,
  });
};

/**
 * Execute try-on operation
 * Handles success/error and returns response or throws
 */
export const executeTryOn = async (
  payload: ReturnType<typeof buildTryOnRequest>
) => {
  return performTryOn(payload);
};

/**
 * Format error message for user display
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No pudimos procesar tu color. Reintenta.';
};

/**
 * Build share payload from try-on result
 */
export const buildSharePayload = (
  result: {
    imageUrl?: string;
    processingMs?: number;
    requestId: string;
  },
  selectedColor: ColorOption,
  intensity: number
) => {
  return {
    imageUrl: result.imageUrl,
    colorName: selectedColor.name,
    intensity,
    requestId: result.requestId,
  };
};

/**
 * Execute share operation
 */
export const executeShare = async (payload: ReturnType<typeof buildSharePayload>) => {
  return shareResult(payload);
};

/**
 * Show alert for missing selfie
 */
export const showMissingSelfieAlert = () => {
  Alert.alert(
    'Selecciona una selfie',
    'Necesitamos una selfie para aplicar el color.'
  );
};

/**
 * Show alert for invalid selfie
 */
export const showInvalidSelfieAlert = (error: string) => {
  Alert.alert('Selfie inválida', error);
};

/**
 * Show alert for file too large
 */
export const showFileTooLargeAlert = (sizeMB: number) => {
  Alert.alert(
    'Archivo demasiado grande',
    `Por favor selecciona una selfie más liviana (<${MAX_FILE_MB}MB). Tu archivo es ${sizeMB.toFixed(1)}MB.`
  );
};

/**
 * Show error alert
 */
export const showErrorAlert = (title: string, message: string) => {
  Alert.alert(title, message);
};

/**
 * Calculate before/after percentage for display
 */
export const calculateBeforeAfterPercentage = (position: number): string => {
  const afterPercent = Math.round(position * 100);
  const beforePercent = 100 - afterPercent;
  return `${afterPercent}% aplicado`;
};

/**
 * Check if apply button should be disabled
 */
export const isApplyButtonDisabled = (
  selfie: Selfie | undefined,
  status: TryOnState['status']
): boolean => {
  return !selfie || status === 'loading';
};

/**
 * Check if share button should be disabled
 */
export const isShareButtonDisabled = (
  result: TryOnState['result']
): boolean => {
  return !result;
};
