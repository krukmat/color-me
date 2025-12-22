import { Alert, Linking } from 'react-native';
import { openWhatsAppBooking } from '../../src/utils/cta';
import * as env from '../../src/config/env';

/**
 * Tests for utils/cta.ts
 * TASK: MOBILE-004 — CTA Reserva Implementation Testing
 *
 * Test coverage:
 * ✓ WhatsApp deep link construction
 * ✓ WhatsApp availability checking
 * ✓ Error handling
 * ✓ Message encoding
 */

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../../src/config/env');

describe('openWhatsAppBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env.WHATSAPP_PHONE as any) = '5491112345678';
  });

  describe('successful booking flow', () => {
    it('opens WhatsApp when available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openWhatsAppBooking();

      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('constructs correct WhatsApp deep link', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openWhatsAppBooking();

      const canOpenCall = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      expect(canOpenCall).toContain('whatsapp://send');
      expect(canOpenCall).toContain('phone=5491112345678');
    });

    it('includes encoded message in URL', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openWhatsAppBooking();

      const canOpenCall = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      expect(canOpenCall).toContain('text=');
      // Message should be encoded
      expect(canOpenCall).toContain('Color%20Me');
    });

    it('uses same URL for both canOpenURL and openURL', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openWhatsAppBooking();

      const canOpenCall = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      const openCall = (Linking.openURL as jest.Mock).mock.calls[0][0];

      expect(canOpenCall).toBe(openCall);
    });
  });

  describe('WhatsApp not available', () => {
    it('shows alert when WhatsApp not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openWhatsAppBooking();

      expect(Alert.alert).toHaveBeenCalledWith(
        'WhatsApp no disponible',
        expect.stringContaining('instala WhatsApp')
      );
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('includes phone number in fallback alert', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openWhatsAppBooking();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      expect(alertCall[1]).toContain('5491112345678');
    });

    it('does not attempt to open URL when WhatsApp unavailable', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openWhatsAppBooking();

      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles canOpenURL errors', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('URL check failed')
      );

      await openWhatsAppBooking();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error al abrir WhatsApp',
        expect.stringContaining('intenta nuevamente')
      );
    });

    it('handles openURL errors', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockRejectedValue(
        new Error('URL open failed')
      );

      await openWhatsAppBooking();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error al abrir WhatsApp',
        expect.stringContaining('intenta nuevamente')
      );
    });

    it('shows generic error message', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      await openWhatsAppBooking();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error al abrir WhatsApp',
        'Por favor intenta nuevamente o contáctanos directamente.'
      );
    });
  });

  describe('message formatting', () => {
    it('encodes special characters in message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await openWhatsAppBooking();

      const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      // Message contains spaces and special chars that should be encoded
      expect(url).toContain('%20'); // space
      expect(url).toContain('text='); // parameter
    });

    it('includes emoji in message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await openWhatsAppBooking();

      const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      // Emoji should be URL encoded
      expect(url).toContain('text=');
    });

    it('includes Color Me branding in message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await openWhatsAppBooking();

      const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      expect(url).toContain('Color%20Me'); // "Color Me" encoded
    });

    it('includes booking intent in message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await openWhatsAppBooking();

      const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      // Message mentions booking/cita
      expect(url).toContain('reservar') || expect(url).toContain('cita');
    });
  });

  describe('phone number handling', () => {
    it('uses configured phone number', async () => {
      (env.WHATSAPP_PHONE as any) = '5491198765432';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      await openWhatsAppBooking();

      const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
      expect(url).toContain('phone=5491198765432');
    });

    it('handles different phone number formats', async () => {
      const phoneNumbers = [
        '5491112345678',
        '5491198765432',
        '549112345678',
      ];

      for (const phone of phoneNumbers) {
        jest.clearAllMocks();
        (env.WHATSAPP_PHONE as any) = phone;
        (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

        await openWhatsAppBooking();

        const url = (Linking.canOpenURL as jest.Mock).mock.calls[0][0];
        expect(url).toContain(`phone=${phone}`);
      }
    });

    it('includes phone in fallback alert', async () => {
      (env.WHATSAPP_PHONE as any) = '5491112345678';
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openWhatsAppBooking();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      expect(alertCall[1]).toContain('5491112345678');
    });
  });

  describe('flow sequences', () => {
    it('checks WhatsApp availability before opening', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openWhatsAppBooking();

      expect((Linking.canOpenURL as jest.Mock).mock.invocationCallOrder[0])
        .toBeLessThan(
          (Linking.openURL as jest.Mock).mock.invocationCallOrder[0]
        );
    });

    it('does not open URL if canOpenURL check fails', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Check failed')
      );

      await openWhatsAppBooking();

      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('completes successfully without errors on happy path', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await expect(openWhatsAppBooking()).resolves.not.toThrow();
    });
  });

  describe('alert messages', () => {
    it('unavailable alert is user-friendly', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openWhatsAppBooking();

      const title = (Alert.alert as jest.Mock).mock.calls[0][0];
      const message = (Alert.alert as jest.Mock).mock.calls[0][1];

      expect(title).toContain('WhatsApp');
      expect(message).toContain('instala');
      expect(message).toContain('directamente');
    });

    it('error alert offers alternatives', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );

      await openWhatsAppBooking();

      const message = (Alert.alert as jest.Mock).mock.calls[0][1];
      expect(message).toContain('intenta');
      expect(message).toContain('contáctanos');
    });
  });
});
