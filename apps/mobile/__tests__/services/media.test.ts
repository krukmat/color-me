import { pickFromLibrary, captureFromCamera } from '../../src/services/media';
import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';

/**
 * Tests for services/media.ts
 * TASK: MOBILE-003 — Media Service Testing
 *
 * Test coverage:
 * ✓ pickFromLibrary: success, cancel, error
 * ✓ captureFromCamera: success, cancel, error
 * ✓ normalizeAsset: asset transformation, missing fields
 */

jest.mock('react-native-image-picker');

describe('media service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickFromLibrary', () => {
    it('returns SelfieData on successful pick', async () => {
      const mockAsset: Asset = {
        uri: 'file:///path/to/image.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAA==',
        fileSize: 12345,
        width: 800,
        height: 600,
        type: 'image/jpeg',
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeDefined();
      expect(result?.uri).toBe('file:///path/to/image.jpg');
      expect(result?.base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAA==');
      expect(result?.fileSize).toBe(12345);
      expect(result?.width).toBe(800);
      expect(result?.height).toBe(600);
      expect(result?.mimeType).toBe('image/jpeg');
    });

    it('returns undefined when user cancels', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      const result = await pickFromLibrary();

      expect(result).toBeUndefined();
    });

    it('throws error when launchImageLibrary returns error', async () => {
      const errorMessage = 'Permission denied to access photos';

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: false,
        errorMessage,
      });

      await expect(pickFromLibrary()).rejects.toThrow(errorMessage);
    });

    it('handles asset with missing optional fields', async () => {
      const mockAsset: Asset = {
        uri: 'file:///path/to/image.jpg',
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeDefined();
      expect(result?.uri).toBe('file:///path/to/image.jpg');
      expect(result?.base64).toBeUndefined();
      expect(result?.fileSize).toBeUndefined();
      expect(result?.width).toBeUndefined();
      expect(result?.height).toBeUndefined();
      expect(result?.mimeType).toBeUndefined();
    });

    it('returns undefined when no assets in result', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: undefined,
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeUndefined();
    });

    it('returns undefined when assets array is empty', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeUndefined();
    });

    it('passes correct options to launchImageLibrary', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await pickFromLibrary();

      expect(launchImageLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'photo',
          includeBase64: true,
          quality: 0.8,
          selectionLimit: 1,
        })
      );
    });
  });

  describe('captureFromCamera', () => {
    it('returns SelfieData on successful capture', async () => {
      const mockAsset: Asset = {
        uri: 'file:///path/to/camera.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAA==',
        fileSize: 54321,
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
      };

      (launchCamera as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await captureFromCamera();

      expect(result).toBeDefined();
      expect(result?.uri).toBe('file:///path/to/camera.jpg');
      expect(result?.base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAA==');
      expect(result?.fileSize).toBe(54321);
      expect(result?.width).toBe(1920);
      expect(result?.height).toBe(1080);
      expect(result?.mimeType).toBe('image/jpeg');
    });

    it('returns undefined when user cancels camera', async () => {
      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      const result = await captureFromCamera();

      expect(result).toBeUndefined();
    });

    it('throws error when launchCamera returns error', async () => {
      const errorMessage = 'Camera permission denied';

      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: false,
        errorMessage,
      });

      await expect(captureFromCamera()).rejects.toThrow(errorMessage);
    });

    it('handles camera asset with minimal fields', async () => {
      const mockAsset: Asset = {
        uri: 'file:///path/to/camera.jpg',
      };

      (launchCamera as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await captureFromCamera();

      expect(result).toBeDefined();
      expect(result?.uri).toBe('file:///path/to/camera.jpg');
    });

    it('passes correct options to launchCamera', async () => {
      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await captureFromCamera();

      expect(launchCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'photo',
          includeBase64: true,
          saveToPhotos: false,
          quality: 0.8,
        })
      );
    });
  });

  describe('normalizeAsset helper', () => {
    it('normalizes asset with all fields', async () => {
      const mockAsset: Asset = {
        uri: 'file:///path/image.jpg',
        base64: 'base64data',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toEqual({
        uri: 'file:///path/image.jpg',
        base64: 'base64data',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        mimeType: 'image/jpeg',
      });
    });

    it('converts type field to mimeType', async () => {
      const mockAsset: Asset = {
        uri: 'file:///image.png',
        type: 'image/png',
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.mimeType).toBe('image/png');
    });

    it('handles asset without uri (returns undefined)', async () => {
      const mockAsset: any = {
        base64: 'data',
        // no uri
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeUndefined();
    });

    it('handles undefined asset (returns undefined)', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [undefined],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result).toBeUndefined();
    });

    it('preserves asset file size as number', async () => {
      const mockAsset: Asset = {
        uri: 'file:///image.jpg',
        fileSize: 1024,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.fileSize).toBe(1024);
      expect(typeof result?.fileSize).toBe('number');
    });

    it('preserves asset dimensions', async () => {
      const mockAsset: Asset = {
        uri: 'file:///image.jpg',
        width: 3840,
        height: 2160,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.width).toBe(3840);
      expect(result?.height).toBe(2160);
    });
  });

  describe('error handling', () => {
    it('distinguishes between cancel and error', async () => {
      const errorMessage = 'Camera is not available';

      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: false,
        errorMessage,
      });

      const promise = captureFromCamera();

      // Should throw, not return undefined
      await expect(promise).rejects.toThrow(errorMessage);
    });

    it('preserves error message text', async () => {
      const errorMessage = 'Permission required: Camera access denied';

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: false,
        errorMessage,
      });

      await expect(pickFromLibrary()).rejects.toThrow(errorMessage);
    });

    it('treats empty error message as no error', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: false,
        errorMessage: '',
      });

      // Empty error message is falsy, so should not throw
      const result = await pickFromLibrary();
      // Result depends on whether empty assets are provided
      expect(result).toBeUndefined();
    });

    it('handles network error during pick', async () => {
      (launchImageLibrary as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(pickFromLibrary()).rejects.toThrow('Network error');
    });

    it('handles network error during capture', async () => {
      (launchCamera as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(captureFromCamera()).rejects.toThrow('Network error');
    });
  });

  describe('picker options validation', () => {
    it('library picker includes correct media type', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await pickFromLibrary();

      const callArgs = (launchImageLibrary as jest.Mock).mock.calls[0][0];
      expect(callArgs.mediaType).toBe('photo');
    });

    it('camera picker includes correct media type', async () => {
      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await captureFromCamera();

      const callArgs = (launchCamera as jest.Mock).mock.calls[0][0];
      expect(callArgs.mediaType).toBe('photo');
    });

    it('both pickers request base64 encoding', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await pickFromLibrary();

      let callArgs = (launchImageLibrary as jest.Mock).mock.calls[0][0];
      expect(callArgs.includeBase64).toBe(true);

      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await captureFromCamera();

      callArgs = (launchCamera as jest.Mock).mock.calls[0][0];
      expect(callArgs.includeBase64).toBe(true);
    });

    it('library picker limits to single selection', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await pickFromLibrary();

      const callArgs = (launchImageLibrary as jest.Mock).mock.calls[0][0];
      expect(callArgs.selectionLimit).toBe(1);
    });

    it('quality set to 0.8 for compression', async () => {
      (launchImageLibrary as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await pickFromLibrary();

      let callArgs = (launchImageLibrary as jest.Mock).mock.calls[0][0];
      expect(callArgs.quality).toBe(0.8);

      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await captureFromCamera();

      callArgs = (launchCamera as jest.Mock).mock.calls[0][0];
      expect(callArgs.quality).toBe(0.8);
    });

    it('camera does not save to photos', async () => {
      (launchCamera as jest.Mock).mockResolvedValue({
        didCancel: true,
      });

      await captureFromCamera();

      const callArgs = (launchCamera as jest.Mock).mock.calls[0][0];
      expect(callArgs.saveToPhotos).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles multiple assets but returns first', async () => {
      const mockAssets: Asset[] = [
        { uri: 'file:///first.jpg', type: 'image/jpeg' },
        { uri: 'file:///second.jpg', type: 'image/jpeg' },
      ];

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: mockAssets,
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.uri).toBe('file:///first.jpg');
    });

    it('handles base64 with long string', async () => {
      const longBase64 = 'a'.repeat(1000000);
      const mockAsset: Asset = {
        uri: 'file:///image.jpg',
        base64: longBase64,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.base64).toHaveLength(1000000);
    });

    it('handles zero file size', async () => {
      const mockAsset: Asset = {
        uri: 'file:///image.jpg',
        fileSize: 0,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue({
        assets: [mockAsset],
        didCancel: false,
      });

      const result = await pickFromLibrary();

      expect(result?.fileSize).toBe(0);
    });
  });
});
