import Config from 'react-native-config';

/**
 * Environment configuration wrapper
 * Exports values from .env file, with sensible defaults
 */

export const BFF_BASE_URL =
  Config.BFF_BASE_URL || 'http://10.0.2.2:3000/api';

export const WHATSAPP_PHONE =
  Config.WHATSAPP_PHONE || '5491112345678';

export const ENABLE_MOCK = Config.ENABLE_MOCK === 'true';

// TASK: MOBILE-005 — Configuration of environment
