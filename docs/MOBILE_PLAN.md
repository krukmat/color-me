# Mobile App Plan — Color Me (MVP)

## Goal
Construir `apps/mobile` (React Native Android, TypeScript) que ejecute el flujo completo de hair color try-on: captura/picker de selfie, selección de color (paleta 10 tonos), slider de intensidad (0–100), comparación antes/después, share y CTA de reserva; la app debe consumir el BFF `/api/try-on` actual y mostrar estados de loading/retry/errores definidos en `docs/UX_MESSAGES.md`. El pipeline ML puede seguir usando mocks; la app debe ser capaz de apuntar al endpoint real desde `services/bff`.

## Architecture & Modules
- `apps/mobile/src/screens/`: `CaptureScreen`, `PaletteScreen`, `CompareScreen`, `ShareScreen`.
- `apps/mobile/src/services/api.ts`: cliente HTTP con `fetch`/`axios` que envía `selfie`, `color`, `intensity` al BFF y recibe `image_url`, `processing_ms`, `request_id`.
- `apps/mobile/src/components/`: `ColorPalette`, `IntensitySlider`, `BeforeAfterSlider`, `RetryBanner`.
- `apps/mobile/src/store/`: simple state (context/zustand) para selfie original, resultado `image_url`, color/intensidad y `request_id`.
- `apps/mobile/__tests__/`: unit tests para helpers/lógica (paleta, state reducers).

## Flow
1. **Capture/Pick**: use `react-native-image-picker` (o expo-image-picker) para capturar o seleccionar selfie, comprimirla (< 5 MB) y guardarla en state.
2. **Palette + Slider**: mostrar los 10 colores (usar `docs/PALETTE_UX.md`) y slider 0–100 con pasos de 5 (default 50). Seleccionar color/intensidad lanza request.
3. **Loading**: estados `Procesando...` / `Procesando – {processing_ms}`; deshabilitar UI mientras `selfie` se sube.
4. **Before/After**: slider horizontal que mezcla original vs `image_url` devuelto. Además, un toggle “Antes/Después”.
5. **Share + CTA**: botón share (usar `Share` API de RN) y CTA que abre WhatsApp o URL (configurable via env).
6. **Retry/Error**: mostrar banner con mensaje amigable (ver `docs/UX_MESSAGES.md`) y permitir reintentar con el mismo payload.

## API Integration
- Configurar `BFF_URL` via `.env`/`app.json`. `api.ts` debe adjuntar `request_id` (generado en el cliente o dejándolo al BFF).
- Payload: `{ selfie: base64, color: string, intensity: number }`.
- Manejar envelope: `response.image_url`, `processing_ms`, `request_id`; loggear `request_id` para debug.
- Para desarrollar sin ML real, permitir un fallback `MOCK_MODE=true` que simule responses usando `processing_ms` random y assets locales.

## Tasks (match TICKETS.md Fase 4)
1. Setup RN project (`npx react-native init`, TypeScript, ESLint, Jest config).
2. Implement capture/picker + preview (ticket 13). Guardar selfie original en estado y mostrar `Preparando selfie`.
3. Color palette + slider + before/after UI (ticket 14). Reutilizar `ColorPalette`, `IntensitySlider`, `BeforeAfterSlider`.
4. Share + CTA (ticket 15). Parametrizar CTA `WHATSAPP_URL` / `BOOKING_URL`.
5. Loading/retry/error handling (ticket 16). Microcopy según `docs/UX_MESSAGES.md`.
6. Unit tests para lógica pura (ticket 17). `__tests__/palette.test.ts`, `__tests__/state.test.ts`.

## Commands
- `cd apps/mobile && npm install`
- `npm run android` – build + deploy a emulador/dispositivo.
- `npm run lint` – ESLint/TS rules.
- `npm test` – Jest (unit tests).

## Risks & Mitigations
- Límite de tamaño de selfie: comprimir/redimensionar en cliente antes de subir.
- Performance: ejecutar trabajo pesado fuera del JS thread (usar `react-native-reanimated` o `GLView` si se hace blending local, pero en MVP se basa en backend).
- Offline/retry: mantener payload y request_id para reintentos idempotentes.

## Rollback
- Feature flags para endpoints (p.ej., `USE_BFF` vs `MOCK_MODE`).
- Revertir commits por pantalla/tarea si alguna feature no está lista.
