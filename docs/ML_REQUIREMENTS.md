# ML Requirements — Open-Source Evaluation Checklist

Strict ML-only requirements for evaluating open-source candidates. This document describes what we need from the ML subsystem only (no project description).

## 1) Objective
Apply hair color changes on a selfie using a fixed 10-color palette and an intensity control (0–100), returning a processed image and timing metadata.

## 2) Input Contract
Required JSON fields:
- `selfie` (string, required)
  - Base64 input accepted as:
    - Data URL: `data:image/png;base64,AAAA...`
    - Raw base64 without prefix
  - Max decoded size: **6 MB**
  - Allowed MIME types: **image/png**, **image/jpeg**
- `color` (string, required)
  - Must be one of the canonical names:
    1. Midnight Espresso
    2. Copper Bloom
    3. Rosewood Fade
    4. Saffron Glaze
    5. Sunlit Amber
    6. Forest Veil
    7. Lilac Mist
    8. Soft Slate
    9. Blush Garnet
    10. Champagne Frost
- `intensity` (integer, required)
  - Range 0–100
  - Default suggested: 50
  - Clients send steps of 5 (server validates range)
- `request_id` (string, required)
  - 5–64 characters, propagated end-to-end

## 3) Output Contract
Required fields:
- `image_url` (string)
- `processing_ms` (integer, >= 1)
- `request_id` (string, echoed)
- `color` (string, canonical name)
- `details` (object, optional)
  - Safe metadata only (no base64/bytes)
  - Example: `{ "model_version": "v0.1.0", "mask_id": "abc123" }`

## 4) Error Envelope
All errors must use:
```json
{
  "code": "ERROR_CODE",
  "message": "User-facing message",
  "request_id": "req-123",
  "details": { "field": ["error"] }
}
```

Minimum error codes:
- `INVALID_PAYLOAD` (400)
- `INVALID_SELFIE` (400)
- `UNSUPPORTED_MEDIA_TYPE` (415)
- `PAYLOAD_TOO_LARGE` (413)
- `INTERNAL_ERROR` (500)

## 5) ML Pipeline Requirements
1. **Validation** (fail fast):
   - Validate MIME, decoded size, and base64 integrity
2. **Segmentation**:
   - Generate hair mask (model must support caching in-process)
3. **Recolor**:
   - Deterministic color blend over mask using `intensity` (LUT/HSV/LAB blending)
4. **Post-process**:
   - Edge smoothing / feathering
   - Avoid bleeding into skin/eyes
5. **Output**:
   - Emit `image_url` and `processing_ms`

## 6) Performance & Resilience
- Target response time: < 2–3s for typical selfies
- Reject oversized payloads before running the pipeline
- Retries: max 1 at BFF level, none inside ML API

## 7) Privacy
- No persistent storage of selfies
- No logging of base64 or raw bytes
- Logs only with `request_id`, timestamps, and safe metrics

## 8) Model Cache
- Load segmentation model once per process
- Reuse cached instance for all requests

## 9) Testing Requirements
Unit tests:
- Payload validation and limits
- Recolor and post-processing functions

Integration tests:
- `/try-on` happy path
- Error cases: payload too large, invalid MIME, invalid base64

## 10) Acceptance Checklist
- Any of the 10 colors can be applied to a selfie
- Intensity changes are reflected in output
- `processing_ms`, `request_id`, and `color` always present
- Errors always return the standard envelope
- No sensitive data in logs or responses
