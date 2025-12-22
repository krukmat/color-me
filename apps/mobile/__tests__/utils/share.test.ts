import { Share, Alert } from 'react-native';
import { shareResult, SharePayload } from '../../src/utils/share';

/**
 * Tests for utils/share.ts
 * TASK: MOBILE-003 — Share Functionality Testing
 *
 * Test coverage:
 * ✓ Share with valid payload
 * ✓ Missing imageUrl validation
 * ✓ Error handling
 * ✓ User cancellation handling
 * ✓ Message formatting
 */

jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

describe('shareResult', () => {
  const mockPayload: SharePayload = {
    imageUrl: 'https://example.com/image.jpg',
    colorName: 'Sunlit Amber',
    intensity: 75,
    requestId: 'req-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful share', () => {
    it('shares with valid payload', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      expect(Share.share).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('includes correct share message structure', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toContain('¿Te gusta este color?');
      expect(callArgs.message).toContain('Sunlit Amber');
      expect(callArgs.message).toContain('75%');
      expect(callArgs.message).toContain('#ColorMeApp');
    });

    it('passes imageUrl for iOS sharing', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.url).toBe('https://example.com/image.jpg');
    });

    it('includes share title', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.title).toBe('Compartir resultado Color Me');
    });

    it('handles different color names in message', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const colors = ['Midnight Espresso', 'Copper Bloom', 'Forest Veil'];

      for (const color of colors) {
        jest.clearAllMocks();

        await shareResult({
          ...mockPayload,
          colorName: color,
        });

        const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
        expect(callArgs.message).toContain(color);
      }
    });

    it('handles different intensity values in message', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const intensities = [0, 50, 100];

      for (const intensity of intensities) {
        jest.clearAllMocks();

        await shareResult({
          ...mockPayload,
          intensity,
        });

        const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
        expect(callArgs.message).toContain(`${intensity}%`);
      }
    });
  });

  describe('missing image URL', () => {
    it('shows alert when imageUrl is undefined', async () => {
      await shareResult({
        ...mockPayload,
        imageUrl: undefined,
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Imagen no disponible',
        expect.stringContaining('procese la imagen')
      );
      expect(Share.share).not.toHaveBeenCalled();
    });

    it('shows alert when imageUrl is empty string', async () => {
      await shareResult({
        ...mockPayload,
        imageUrl: '',
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Imagen no disponible',
        expect.stringContaining('procese la imagen')
      );
      expect(Share.share).not.toHaveBeenCalled();
    });

    it('does not attempt share when imageUrl missing', async () => {
      await shareResult({
        ...mockPayload,
        imageUrl: undefined,
      });

      expect(Share.share).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles share errors gracefully', async () => {
      const error = new Error('Share failed');
      (Share.share as jest.Mock).mockRejectedValue(error);

      await shareResult(mockPayload);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error al compartir',
        expect.stringContaining('No pudimos compartir')
      );
    });

    it('ignores user cancellation error', async () => {
      (Share.share as jest.Mock).mockRejectedValue(
        new Error('User did not share')
      );

      await shareResult(mockPayload);

      // Should not show error alert for user cancellation
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('shows alert for non-cancellation errors only', async () => {
      const errors = [
        new Error('Network error'),
        new Error('Permission denied'),
        new Error('Invalid image URL'),
      ];

      for (const error of errors) {
        jest.clearAllMocks();
        (Share.share as jest.Mock).mockRejectedValue(error);

        await shareResult(mockPayload);

        expect(Alert.alert).toHaveBeenCalledWith(
          'Error al compartir',
          expect.any(String)
        );
      }
    });

    it('handles Error vs string error messages', async () => {
      (Share.share as jest.Mock).mockRejectedValue(
        new Error('Share API error')
      );

      await shareResult(mockPayload);

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('includes emoji in greeting', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toContain('💇‍♀️');
    });

    it('formats intensity with percentage symbol', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toContain('Intensidad 75%');
    });

    it('includes hashtag', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toContain('#ColorMeApp');
    });

    it('uses proper message structure with newlines', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      await shareResult(mockPayload);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      const lines = callArgs.message.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('edge cases', () => {
    it('handles special characters in color name', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const specialNames = [
        "Café Oscuro",
        "Oro Rosa & Plateado",
        "Color's Perfecto"
      ];

      for (const name of specialNames) {
        jest.clearAllMocks();

        await shareResult({
          ...mockPayload,
          colorName: name,
        });

        const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
        expect(callArgs.message).toContain(name);
      }
    });

    it('handles very long image URLs', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const longUrl =
        'https://example.com/' + 'a'.repeat(500) + '.jpg';

      await shareResult({
        ...mockPayload,
        imageUrl: longUrl,
      });

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      expect(callArgs.url).toBe(longUrl);
    });

    it('handles intensity at boundaries', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const boundaries = [0, 1, 50, 99, 100];

      for (const intensity of boundaries) {
        jest.clearAllMocks();

        await shareResult({
          ...mockPayload,
          intensity,
        });

        const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
        expect(callArgs.message).toContain(`${intensity}%`);
      }
    });
  });

  describe('payload validation', () => {
    it('requires imageUrl to share', async () => {
      const payload: SharePayload = {
        imageUrl: undefined,
        colorName: 'Test',
        intensity: 50,
        requestId: 'req-123',
      };

      await shareResult(payload);

      expect(Share.share).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('accepts all payload fields', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const fullPayload: SharePayload = {
        imageUrl: 'https://example.com/image.jpg',
        colorName: 'Full Test Color',
        intensity: 85,
        requestId: 'req-full-123',
      };

      await shareResult(fullPayload);

      expect(Share.share).toHaveBeenCalled();
    });

    it('uses requestId from payload (for future tracking)', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: 'sharedAction',
      });

      const customPayload: SharePayload = {
        ...mockPayload,
        requestId: 'req-custom-456',
      };

      await shareResult(customPayload);

      // requestId is in payload but not explicitly used in message
      // This validates it's accepted in the interface
      expect(Share.share).toHaveBeenCalled();
    });
  });
});
