import { Alert, Linking } from 'react-native';
import { WHATSAPP_PHONE } from '../config/env';

/**
 * Call-To-Action utilities for booking conversions
 * Opens WhatsApp with pre-filled message
 *
 * TASK: MOBILE-004 — CTA Reserva Implementation
 */

const BOOKING_MESSAGE =
  'Hola! Vi la app Color Me y quiero reservar una cita para cambio de color 💇‍♀️';

export async function openWhatsAppBooking(): Promise<void> {
  const message = encodeURIComponent(BOOKING_MESSAGE);
  const url = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${message}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        'WhatsApp no disponible',
        `Por favor instala WhatsApp o contáctanos directamente al ${WHATSAPP_PHONE}`
      );
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    Alert.alert(
      'Error al abrir WhatsApp',
      'Por favor intenta nuevamente o contáctanos directamente.'
    );
  }
}
