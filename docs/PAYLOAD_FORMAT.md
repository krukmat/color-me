# Payload Format — ML API ↔ Mobile

## Request (mobile → ML API via BFF)
- `selfie`: base64 or multipart image (<= 5 MB). Mobile should compress/resize before upload; reject > maximum early in BFF.
- `color`: one of the 10 palette names, case-sensitive (e.g., `Rosewood Fade`).
- `intensity`: integer 0–100; slider emits steps of 5. If outside range, validation returns `400` with `{ code: "INVALID_INTENSITY" }`.
- `request_id`: propagated from mobile/BFF. Required for tracing; logged but never carries image base64 outside secure storage.
- Optional: `model_version` (string) to pin experiments; default is `latest`.

Example request body (JSON):
```json
{
  "selfie": "<multipart/png>",
  "color": "Sunlit Amber",
  "intensity": 65,
  "request_id": "req-123"
}
```

## Response (ML API → BFF → Mobile)
- `image_url`: presigned or CDN URL pointing to the processed image. Mobile caches the original locally and swaps it atomically once `image_url` is ready.
- `processing_ms`: integer timing metric recorded server-side after recolor/post-process; mobile displays a “Procesado en {n} ms” label for feedback.
- `request_id`: echoed from the request to maintain traceability end-to-end.
- `color`: canonical color name returned for confirmation in UI.
- `details`: optional object for soft warnings (e.g., `{"trimmed": true}`). Include only safe metadata.

Example response:
```json
{
  "image_url": "https://cdn.example.com/s3-bucket/processed/abc123.png",
  "processing_ms": 850,
  "request_id": "req-123",
  "color": "Sunlit Amber"
}
```

### Notes for Mobile
- Keep the original selfie cached until the new `image_url` is fully loaded; show a loading indicator using `processing_ms` (e.g., `Procesando – {processing_ms} ms estimados`).
- Before/after slider toggles should use the cached original for “before” and the newly fetched `image_url` for “after”.
- If a warning arrives in `details`, display a discrete badge (e.g., `Retocado automáticamente`) but do not surface raw metadata or base64 strings.
