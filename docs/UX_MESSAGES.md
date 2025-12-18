# UX Messages — Loading, Retry & Errors

## Loading States
- `Procesando...` – show while ML API request is in flight. Include a spinner and optionally `Procesando – {processing_ms} ms estimados` once available.
- `Preparando selfie` – when the app is resizing/compressing the selfie before upload.
- Loading bars and sliders should disable controls until the request completes to prevent duplicate submissions.

## Retry Guidance
- `¿Algo salió mal? Toca para reintentar.` – global banner if the ML API call fails due to network. Include a retry button and preserve selected color/intensity.
- `Reconectando...` – transient status when the request automatically retries (max 1 retry after timeout). Display only while reattempting.
- Keep retry actions idempotent: resend the same payload so intensity/color remain consistent.

## Error Messages
- `No pudimos procesar tu color. Intenta con otro tono o reintenta.` – general failure from ML API (recolor error or timeout). Suggest switching color or retrying.
- `Tu selfie excede el tamaño permitido.` – sent when BFF rejects payload for being too large. Prompt user to re-upload with a smaller file.
- `Intensidad inválida. Usa el slider entre 0 y 100.` – client-side validation before reaching the server.
- Error envelope must include `code`, `message`, `request_id`, optionally `details`. Mobile should show `message` but log `code`+`request_id` for diagnostics.

## UX Practices
- Always show a friendly message with action (retry, switch color) when a request fails.
- Avoid exposing technical jargon; rely on the standardized `message` field from the backend.
- Use the before/after slider tip (e.g., “Mantén para comparar”) to remind users how to check the effect while recovering from an error.
