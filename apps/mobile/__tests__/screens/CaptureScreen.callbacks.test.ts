/**
 * Tests for screens/CaptureScreen.callbacks.ts
 * TASK: MOBILE-004 — Callback logic testing
 *
 * Test coverage:
 * ✓ handleSelfieResultCallback: Selfie validation and state update
 * ✓ processSelectionCallback: Async media selection with error handling
 * ✓ onApplyColorCallback: Try-on operation with validation
 * ✓ onShareCallback: Share operation with error handling
 * ✓ generateTryOnMessage: Status message generation
 */

import {
  handleSelfieResultCallback,
  processSelectionCallback,
  onApplyColorCallback,
  onShareCallback,
  generateTryOnMessage,
} from '../../src/screens/CaptureScreen.callbacks';
import type { Selfie } from '../../src/types/selfie';
import type { ColorOption } from '../../src/utils/palette';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../../src/screens/CaptureScreen.utils', () => ({
  validateSelfieResult: jest.fn(),
  validateSelfieForApply: jest.fn(),
  buildTryOnRequest: jest.fn(),
  executeTryOn: jest.fn(),
  buildSharePayload: jest.fn(),
  executeShare: jest.fn(),
  showFileTooLargeAlert: jest.fn(),
  showInvalidSelfieAlert: jest.fn(),
  showErrorAlert: jest.fn(),
  formatBytesToMB: jest.fn(),
  formatErrorMessage: jest.fn(),
}));

import * as CaptureScreenUtils from '../../src/screens/CaptureScreen.utils';

describe('CaptureScreen.callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // handleSelfieResultCallback
  // ============================================================================

  describe('handleSelfieResultCallback', () => {
    it('should return false when result is undefined', () => {
      const result = handleSelfieResultCallback(
        undefined,
        jest.fn(),
        jest.fn(),
        jest.fn(),
        jest.fn()
      );
      expect(result).toBe(false);
    });

    it('should accept valid selfie and call setSelfie', () => {
      const mockSelfie: Selfie = {
        uri: 'file://selfie.jpg',
        base64: 'base64data',
        fileSize: 1024 * 1024,
      };
      const onSetSelfie = jest.fn();
      const onSetError = jest.fn();
      const onResetFlow = jest.fn();
      const onSetStatus = jest.fn();

      (CaptureScreenUtils.validateSelfieResult as jest.Mock).mockReturnValue({
        valid: true,
      });

      const result = handleSelfieResultCallback(
        mockSelfie,
        onSetSelfie,
        onSetError,
        onResetFlow,
        onSetStatus
      );

      expect(result).toBe(true);
      expect(onSetSelfie).toHaveBeenCalledWith(mockSelfie);
      expect(onResetFlow).toHaveBeenCalled();
      expect(onSetStatus).toHaveBeenCalledWith(undefined);
    });

    it('should reject selfie that exceeds size limit', () => {
      const mockSelfie: Selfie = {
        uri: 'file://large.jpg',
        base64: 'base64data',
        fileSize: 10 * 1024 * 1024, // 10 MB
      };
      const onSetSelfie = jest.fn();
      const onSetError = jest.fn();
      const onResetFlow = jest.fn();
      const onSetStatus = jest.fn();

      (CaptureScreenUtils.validateSelfieResult as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Excede tamaño máximo',
      });
      (CaptureScreenUtils.formatBytesToMB as jest.Mock).mockReturnValue(10);

      const result = handleSelfieResultCallback(
        mockSelfie,
        onSetSelfie,
        onSetError,
        onResetFlow,
        onSetStatus
      );

      expect(result).toBe(false);
      expect(onSetError).toHaveBeenCalledWith('Excede tamaño máximo');
      expect(CaptureScreenUtils.showFileTooLargeAlert).toHaveBeenCalledWith(10);
      expect(onSetSelfie).not.toHaveBeenCalled();
    });

    it('should use default error message when validation error is empty', () => {
      const mockSelfie: Selfie = {
        uri: 'file://invalid.jpg',
        base64: 'base64data',
        fileSize: 6 * 1024 * 1024,
      };
      const onSetSelfie = jest.fn();
      const onSetError = jest.fn();

      (CaptureScreenUtils.validateSelfieResult as jest.Mock).mockReturnValue({
        valid: false,
        error: undefined,
      });
      (CaptureScreenUtils.formatBytesToMB as jest.Mock).mockReturnValue(6);

      handleSelfieResultCallback(
        mockSelfie,
        onSetSelfie,
        onSetError,
        jest.fn(),
        jest.fn()
      );

      expect(onSetError).toHaveBeenCalledWith(
        'Tu selfie excede el tamaño permitido.'
      );
    });

    it('should handle multiple selfies in sequence', () => {
      const mockSelfie1: Selfie = {
        uri: 'file://selfie1.jpg',
        base64: 'base64data1',
        fileSize: 1024 * 1024,
      };
      const mockSelfie2: Selfie = {
        uri: 'file://selfie2.jpg',
        base64: 'base64data2',
        fileSize: 2 * 1024 * 1024,
      };

      (CaptureScreenUtils.validateSelfieResult as jest.Mock).mockReturnValue({
        valid: true,
      });

      const onSetSelfie = jest.fn();
      const onSetError = jest.fn();
      const onResetFlow = jest.fn();
      const onSetStatus = jest.fn();

      const result1 = handleSelfieResultCallback(
        mockSelfie1,
        onSetSelfie,
        onSetError,
        onResetFlow,
        onSetStatus
      );

      const result2 = handleSelfieResultCallback(
        mockSelfie2,
        onSetSelfie,
        onSetError,
        onResetFlow,
        onSetStatus
      );

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(onSetSelfie).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // processSelectionCallback
  // ============================================================================

  describe('processSelectionCallback', () => {
    it('should process valid media selection', async () => {
      const mockSelfie: Selfie = {
        uri: 'file://selfie.jpg',
        base64: 'base64data',
        fileSize: 1024 * 1024,
      };

      const mockAction = jest.fn().mockResolvedValue(mockSelfie);
      const onHandleSelfieResult = jest.fn().mockReturnValue(true);
      const onSetProcessing = jest.fn();
      const onSetStatus = jest.fn();
      const onSetError = jest.fn();

      await processSelectionCallback(
        mockAction,
        onHandleSelfieResult,
        onSetProcessing,
        onSetStatus,
        onSetError
      );

      expect(onSetProcessing).toHaveBeenCalledWith(true);
      expect(onSetStatus).toHaveBeenCalledWith('Preparando selfie');
      expect(mockAction).toHaveBeenCalled();
      expect(onHandleSelfieResult).toHaveBeenCalledWith(mockSelfie);
      expect(onSetProcessing).toHaveBeenLastCalledWith(false);
      expect(onSetStatus).toHaveBeenLastCalledWith(undefined);
    });

    it('should handle action returning undefined', async () => {
      const mockAction = jest.fn().mockResolvedValue(undefined);
      const onHandleSelfieResult = jest.fn().mockReturnValue(false);
      const onSetProcessing = jest.fn();
      const onSetStatus = jest.fn();
      const onSetError = jest.fn();

      await processSelectionCallback(
        mockAction,
        onHandleSelfieResult,
        onSetProcessing,
        onSetStatus,
        onSetError
      );

      expect(onHandleSelfieResult).toHaveBeenCalledWith(undefined);
      expect(onSetProcessing).toHaveBeenLastCalledWith(false);
    });

    it('should handle action throwing Error', async () => {
      const mockError = new Error('Camera not available');
      const mockAction = jest.fn().mockRejectedValue(mockError);
      const onHandleSelfieResult = jest.fn();
      const onSetProcessing = jest.fn();
      const onSetStatus = jest.fn();
      const onSetError = jest.fn();

      await processSelectionCallback(
        mockAction,
        onHandleSelfieResult,
        onSetProcessing,
        onSetStatus,
        onSetError
      );

      expect(onSetError).toHaveBeenCalledWith('Camera not available');
      expect(onSetProcessing).toHaveBeenLastCalledWith(false);
    });

    it('should handle action throwing non-Error value', async () => {
      const mockAction = jest.fn().mockRejectedValue('Unknown error');
      const onHandleSelfieResult = jest.fn();
      const onSetProcessing = jest.fn();
      const onSetStatus = jest.fn();
      const onSetError = jest.fn();

      await processSelectionCallback(
        mockAction,
        onHandleSelfieResult,
        onSetProcessing,
        onSetStatus,
        onSetError
      );

      expect(onSetError).toHaveBeenCalledWith('No pudimos procesar tu selfie.');
      expect(onSetProcessing).toHaveBeenLastCalledWith(false);
    });

    it('should cleanup processing state even on error', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Test error'));
      const onHandleSelfieResult = jest.fn();
      const onSetProcessing = jest.fn();
      const onSetStatus = jest.fn();
      const onSetError = jest.fn();

      await processSelectionCallback(
        mockAction,
        onHandleSelfieResult,
        onSetProcessing,
        onSetStatus,
        onSetError
      );

      // Verify cleanup happened
      const callsToProcessing = onSetProcessing.mock.calls;
      expect(callsToProcessing[callsToProcessing.length - 1][0]).toBe(false);
    });
  });

  // ============================================================================
  // onApplyColorCallback
  // ============================================================================

  describe('onApplyColorCallback', () => {
    const mockColor: ColorOption = {
      name: 'Sunlit Amber',
      rgb: [255, 200, 100],
    };

    it('should execute try-on with valid selfie', async () => {
      const mockSelfie: Selfie = {
        uri: 'file://selfie.jpg',
        base64: 'base64data',
        fileSize: 1024 * 1024,
      };
      const mockResponse = {
        imageUrl: 'http://api/result.jpg',
        processingMs: 500,
        requestId: 'req-123',
      };

      (CaptureScreenUtils.validateSelfieForApply as jest.Mock).mockReturnValue({
        valid: true,
      });

      const onBuildRequest = jest.fn().mockReturnValue({ payload: 'data' });
      const onExecuteTryOn = jest.fn().mockResolvedValue(mockResponse);
      const onMarkLoading = jest.fn();
      const onMarkSuccess = jest.fn();
      const onMarkError = jest.fn();
      const onRegenerateRequestId = jest.fn();

      await onApplyColorCallback(
        mockSelfie,
        mockColor,
        50,
        'req-123',
        CaptureScreenUtils.validateSelfieForApply,
        onBuildRequest,
        onExecuteTryOn,
        onMarkLoading,
        onMarkSuccess,
        onMarkError,
        onRegenerateRequestId
      );

      expect(onMarkLoading).toHaveBeenCalled();
      expect(onBuildRequest).toHaveBeenCalledWith(mockSelfie, mockColor, 50, 'req-123');
      expect(onExecuteTryOn).toHaveBeenCalled();
      expect(onMarkSuccess).toHaveBeenCalledWith(mockResponse);
      expect(onRegenerateRequestId).toHaveBeenCalled();
    });

    it('should reject when selfie is missing', async () => {
      (CaptureScreenUtils.validateSelfieForApply as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Necesitamos una selfie',
      });

      const onBuildRequest = jest.fn();
      const onExecuteTryOn = jest.fn();
      const onMarkLoading = jest.fn();
      const onMarkSuccess = jest.fn();
      const onMarkError = jest.fn();
      const onRegenerateRequestId = jest.fn();

      await onApplyColorCallback(
        undefined,
        mockColor,
        50,
        'req-123',
        CaptureScreenUtils.validateSelfieForApply,
        onBuildRequest,
        onExecuteTryOn,
        onMarkLoading,
        onMarkSuccess,
        onMarkError,
        onRegenerateRequestId
      );

      expect(onMarkLoading).not.toHaveBeenCalled();
      expect(CaptureScreenUtils.showInvalidSelfieAlert).toHaveBeenCalledWith(
        'Necesitamos una selfie'
      );
    });

    it('should handle try-on API error', async () => {
      const mockSelfie: Selfie = {
        uri: 'file://selfie.jpg',
        base64: 'base64data',
        fileSize: 1024 * 1024,
      };
      const mockError = new Error('API timeout');

      (CaptureScreenUtils.validateSelfieForApply as jest.Mock).mockReturnValue({
        valid: true,
      });
      (CaptureScreenUtils.formatErrorMessage as jest.Mock).mockReturnValue(
        'API timeout'
      );

      const onBuildRequest = jest.fn().mockReturnValue({ payload: 'data' });
      const onExecuteTryOn = jest.fn().mockRejectedValue(mockError);
      const onMarkLoading = jest.fn();
      const onMarkSuccess = jest.fn();
      const onMarkError = jest.fn();
      const onRegenerateRequestId = jest.fn();

      await onApplyColorCallback(
        mockSelfie,
        mockColor,
        50,
        'req-123',
        CaptureScreenUtils.validateSelfieForApply,
        onBuildRequest,
        onExecuteTryOn,
        onMarkLoading,
        onMarkSuccess,
        onMarkError,
        onRegenerateRequestId
      );

      expect(onMarkLoading).toHaveBeenCalled();
      expect(onMarkSuccess).not.toHaveBeenCalled();
      expect(onMarkError).toHaveBeenCalledWith({
        code: 'TRY_ON_ERROR',
        message: 'API timeout',
        requestId: 'req-123',
      });
      expect(onRegenerateRequestId).toHaveBeenCalled();
    });

    it('should regenerate requestId even on success', async () => {
      const mockSelfie: Selfie = {
        uri: 'file://selfie.jpg',
        base64: 'base64data',
        fileSize: 1024 * 1024,
      };

      (CaptureScreenUtils.validateSelfieForApply as jest.Mock).mockReturnValue({
        valid: true,
      });

      const onBuildRequest = jest.fn().mockReturnValue({ payload: 'data' });
      const onExecuteTryOn = jest
        .fn()
        .mockResolvedValue({ imageUrl: 'url', processingMs: 100, requestId: 'req-123' });
      const onMarkLoading = jest.fn();
      const onMarkSuccess = jest.fn();
      const onMarkError = jest.fn();
      const onRegenerateRequestId = jest.fn();

      await onApplyColorCallback(
        mockSelfie,
        mockColor,
        50,
        'req-123',
        CaptureScreenUtils.validateSelfieForApply,
        onBuildRequest,
        onExecuteTryOn,
        onMarkLoading,
        onMarkSuccess,
        onMarkError,
        onRegenerateRequestId
      );

      expect(onRegenerateRequestId).toHaveBeenCalled();
    });

    it('should use default validation error message', async () => {
      (CaptureScreenUtils.validateSelfieForApply as jest.Mock).mockReturnValue({
        valid: false,
        error: undefined,
      });

      const onBuildRequest = jest.fn();
      const onExecuteTryOn = jest.fn();
      const onMarkLoading = jest.fn();
      const onMarkSuccess = jest.fn();
      const onMarkError = jest.fn();
      const onRegenerateRequestId = jest.fn();

      await onApplyColorCallback(
        undefined,
        mockColor,
        50,
        'req-123',
        CaptureScreenUtils.validateSelfieForApply,
        onBuildRequest,
        onExecuteTryOn,
        onMarkLoading,
        onMarkSuccess,
        onMarkError,
        onRegenerateRequestId
      );

      expect(CaptureScreenUtils.showInvalidSelfieAlert).toHaveBeenCalledWith(
        'Necesitamos una selfie para aplicar el color.'
      );
    });
  });

  // ============================================================================
  // onShareCallback
  // ============================================================================

  describe('onShareCallback', () => {
    const mockColor: ColorOption = {
      name: 'Sunlit Amber',
      rgb: [255, 200, 100],
    };

    it('should share result when available', async () => {
      const mockResult = {
        imageUrl: 'http://api/result.jpg',
        processingMs: 500,
        requestId: 'req-123',
      };

      const onBuildSharePayload = jest.fn().mockReturnValue({
        imageUrl: 'url',
        colorName: 'Sunlit Amber',
        intensity: 50,
        requestId: 'req-123',
      });
      const onExecuteShare = jest.fn().mockResolvedValue(undefined);

      await onShareCallback(
        mockResult,
        mockColor,
        50,
        onBuildSharePayload,
        onExecuteShare
      );

      expect(onBuildSharePayload).toHaveBeenCalledWith(
        mockResult,
        mockColor,
        50
      );
      expect(onExecuteShare).toHaveBeenCalled();
    });

    it('should return early when result is undefined', async () => {
      const onBuildSharePayload = jest.fn();
      const onExecuteShare = jest.fn();

      await onShareCallback(undefined, mockColor, 50, onBuildSharePayload, onExecuteShare);

      expect(onBuildSharePayload).not.toHaveBeenCalled();
      expect(onExecuteShare).not.toHaveBeenCalled();
    });

    it('should handle share error gracefully', async () => {
      const mockResult = {
        imageUrl: 'http://api/result.jpg',
        processingMs: 500,
        requestId: 'req-123',
      };
      const mockError = new Error('Share failed');

      (CaptureScreenUtils.formatErrorMessage as jest.Mock).mockReturnValue(
        'Share failed'
      );

      const onBuildSharePayload = jest.fn().mockReturnValue({ payload: 'data' });
      const onExecuteShare = jest.fn().mockRejectedValue(mockError);

      await onShareCallback(
        mockResult,
        mockColor,
        50,
        onBuildSharePayload,
        onExecuteShare
      );

      expect(CaptureScreenUtils.showErrorAlert).toHaveBeenCalledWith(
        'No pudimos compartir',
        'Share failed'
      );
    });
  });

  // ============================================================================
  // generateTryOnMessage
  // ============================================================================

  describe('generateTryOnMessage', () => {
    const mockColor: ColorOption = {
      name: 'Sunlit Amber',
      rgb: [255, 200, 100],
    };

    it('should return loading message when status is loading', () => {
      const message = generateTryOnMessage(
        'loading',
        undefined,
        mockColor,
        undefined
      );

      expect(message).toBe('Procesando tono Sunlit Amber...');
    });

    it('should return error message when status is error', () => {
      const mockError = { code: 'ERROR', message: 'API failed', requestId: 'req-123' };

      const message = generateTryOnMessage(
        'error',
        undefined,
        mockColor,
        mockError
      );

      expect(message).toBe('API failed');
    });

    it('should return default error message when error has no message', () => {
      const mockError = { code: 'ERROR', message: '', requestId: 'req-123' };

      const message = generateTryOnMessage(
        'error',
        undefined,
        mockColor,
        mockError
      );

      expect(message).toBe('No pudimos procesar tu color.');
    });

    it('should return success message with processing time', () => {
      const mockResult = {
        imageUrl: 'url',
        processingMs: 750,
        requestId: 'req-123',
      };

      const message = generateTryOnMessage('success', mockResult, mockColor, undefined);

      expect(message).toContain('750 ms');
      expect(message).toContain('req-123');
    });

    it('should return undefined when status is idle', () => {
      const message = generateTryOnMessage('idle', undefined, mockColor, undefined);

      expect(message).toBeUndefined();
    });

    it('should return undefined when success but no processingMs', () => {
      const mockResult = {
        imageUrl: 'url',
        requestId: 'req-123',
      };

      const message = generateTryOnMessage('success', mockResult, mockColor, undefined);

      expect(message).toBeUndefined();
    });

    it('should handle different color names in loading message', () => {
      const colors: ColorOption[] = [
        { name: 'Midnight Espresso', rgb: [0, 0, 0] },
        { name: 'Blush Garnet', rgb: [200, 100, 150] },
        { name: 'Champagne Frost', rgb: [255, 255, 200] },
      ];

      colors.forEach((color) => {
        const message = generateTryOnMessage('loading', undefined, color, undefined);
        expect(message).toContain(`Procesando tono ${color.name}...`);
      });
    });
  });
});
