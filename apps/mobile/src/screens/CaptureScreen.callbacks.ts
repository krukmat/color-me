/**
 * CaptureScreen callback functions
 * TASK: MOBILE-004 — Extract callback logic for pure function testing
 *
 * All callbacks accept dependencies as parameters (dependency injection)
 * enabling unit testing without React hooks or component context.
 */

import { Alert } from 'react-native';
import type { Selfie } from '../types/selfie';
import type { ColorOption } from '../utils/palette';
import type { TryOnState } from '../state/useTryOnState';
import {
  validateSelfieResult,
  validateSelfieForApply,
  buildTryOnRequest,
  executeTryOn,
  buildSharePayload,
  executeShare,
  showFileTooLargeAlert,
  showInvalidSelfieAlert,
  showErrorAlert,
  formatBytesToMB,
  formatErrorMessage,
} from './CaptureScreen.utils';

/**
 * Handle selfie selection result
 * Validates result and updates state
 *
 * Returns: true if selfie was accepted, false if rejected
 */
export const handleSelfieResultCallback = (
  result: Selfie | undefined,
  onSetSelfie: (selfie: Selfie) => void,
  onSetError: (error: string) => void,
  onResetFlow: () => void,
  onSetStatus: (status: undefined) => void
): boolean => {
  if (!result) {
    return false;
  }

  const validation = validateSelfieResult(result);
  if (!validation.valid) {
    const sizeMB = formatBytesToMB(result.fileSize);
    onSetError(validation.error || 'Tu selfie excede el tamaño permitido.');
    showFileTooLargeAlert(sizeMB);
    return false;
  }

  onSetSelfie(result);
  onResetFlow();
  onSetStatus(undefined);
  return true;
};

/**
 * Process media selection (pick or capture)
 * Handles async operation with error handling and state management
 *
 * Throws: Error on failure or user cancellation
 */
export const processSelectionCallback = async (
  action: () => Promise<Selfie | undefined>,
  onHandleSelfieResult: (result: Selfie | undefined) => boolean,
  onSetProcessing: (processing: boolean) => void,
  onSetStatus: (status: string | undefined) => void,
  onSetError: (error: string) => void
): Promise<void> => {
  try {
    onSetProcessing(true);
    onSetStatus('Preparando selfie');
    const result = await action();
    onHandleSelfieResult(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No pudimos procesar tu selfie.';
    onSetError(message);
    Alert.alert('Error', message);
  } finally {
    onSetProcessing(false);
    onSetStatus(undefined);
  }
};

/**
 * Apply color to selfie
 * Main try-on operation: validates, builds request, executes, handles response
 *
 * Throws: Error on validation or API failure
 */
export const onApplyColorCallback = async (
  selfie: Selfie | undefined,
  selectedColor: ColorOption,
  intensity: number,
  requestId: string,
  onValidateSelfie: (s: Selfie | undefined) => { valid: boolean; error?: string },
  onBuildRequest: (s: Selfie, c: ColorOption, i: number, r: string) => any,
  onExecuteTryOn: (payload: any) => Promise<any>,
  onMarkLoading: () => void,
  onMarkSuccess: (response: any) => void,
  onMarkError: (error: { code: string; message: string; requestId: string }) => void,
  onRegenerateRequestId: () => void
): Promise<void> => {
  const validation = onValidateSelfie(selfie);
  if (!validation.valid) {
    showInvalidSelfieAlert(validation.error || 'Necesitamos una selfie para aplicar el color.');
    return;
  }

  try {
    onMarkLoading();
    const payload = onBuildRequest(selfie, selectedColor, intensity, requestId);
    const response = await onExecuteTryOn(payload);
    onMarkSuccess(response);
  } catch (error) {
    const message = formatErrorMessage(error);
    onMarkError({ code: 'TRY_ON_ERROR', message, requestId });
    showErrorAlert('No pudimos procesar tu color', message);
  } finally {
    onRegenerateRequestId();
  }
};

/**
 * Share try-on result
 * Builds share payload and executes share operation
 *
 * Throws: Error on share failure
 */
export const onShareCallback = async (
  result: TryOnState['result'] | undefined,
  selectedColor: ColorOption,
  intensity: number,
  onBuildSharePayload: (
    r: TryOnState['result'],
    c: ColorOption,
    i: number
  ) => any,
  onExecuteShare: (payload: any) => Promise<void>
): Promise<void> => {
  if (!result) {
    return;
  }

  try {
    const sharePayload = onBuildSharePayload(result, selectedColor, intensity);
    await onExecuteShare(sharePayload);
  } catch (error) {
    const message = formatErrorMessage(error);
    showErrorAlert('No pudimos compartir', message);
  }
};

/**
 * Generate try-on message based on status
 * Returns appropriate message or undefined
 */
export const generateTryOnMessage = (
  status: TryOnState['status'],
  result: TryOnState['result'] | undefined,
  selectedColor: ColorOption,
  error: TryOnState['error'] | undefined
): string | undefined => {
  if (status === 'loading') {
    return `Procesando tono ${selectedColor.name}...`;
  }
  if (status === 'error') {
    return error?.message || 'No pudimos procesar tu color.';
  }
  if (status === 'success' && result?.processingMs) {
    return `Listo en ${result.processingMs} ms · ID ${result.requestId}`;
  }
  return undefined;
};
