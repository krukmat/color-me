import { Share, Alert } from 'react-native';

/**
 * Share utilities for processed try-on images
 *
 * MOBILE-003: Share/Export Implementation
 */

export interface SharePayload {
  imageUrl?: string;
  colorName: string;
  intensity: number;
  requestId: string;
}

export async function shareResult(payload: SharePayload): Promise<void> {
  if (!payload.imageUrl) {
    Alert.alert(
      'Imagen no disponible',
      'Por favor espera a que se procese la imagen antes de compartir.'
    );
    return;
  }

  const message =
    `¿Te gusta este color? Mirá mi resultado con Color Me 💇‍♀️` +
    `\n${payload.colorName} · Intensidad ${payload.intensity}%` +
    `\n#ColorMeApp`;

  try {
    await Share.share({
      message,
      url: payload.imageUrl, // iOS: image URL
      title: 'Compartir resultado Color Me',
    });
  } catch (error) {
    if (error instanceof Error && error.message !== 'User did not share') {
      Alert.alert(
        'Error al compartir',
        'No pudimos compartir tu resultado. Intenta nuevamente.'
      );
    }
  }
}
