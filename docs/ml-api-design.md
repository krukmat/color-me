# ML API Design — F04

Centralized reference for `services/ml-api` covering validation (F04.1), payload limits (F04.2), and testing (F04.3). This iteration focuses on **F04.1.1**: defining Pydantic schemas for request/response per `docs/PAYLOAD_FORMAT.md` and `PROJECT_PLAN.md`.

## F04.1.1 — Pydantic Schemas

### Request Model (`TryOnRequest`)
Location: `services/ml-api/app/schemas/tryon.py`

```py
class TryOnRequest(BaseModel):
    selfie: str = Field(
        ...,
        min_length=1,
        description="Selfie payload (base64 string). Reject empty uploads.",
        examples=["data:image/png;base64,iVBORw0..."],
    )
    color: str = Field(
        ...,
        min_length=1,
        description="Palette name (see docs/PALETTE_UX.md). Case-sensitive.",
        pattern="^(Midnight Espresso|Copper Bloom|Rosewood Fade|Saffron Glaze|Sunlit Amber|Forest Veil|Lilac Mist|Soft Slate|Blush Garnet|Champagne Frost)$",
    )
    intensity: int = Field(
        DEFAULT_INTENSITY,
        ge=0,
        le=100,
        description="Slider 0–100, snapped in steps of 5 by BFF/mobile.",
    )
    request_id: str = Field(
        ...,
        min_length=5,
        max_length=64,
        description="Trace ID propagated from BFF (x-request-id).",
    )
```

**Notes**
- `color` uses a regex whitelist derived from `docs/PALETTE_UX.md`.
- `intensity` defaults to 50 if not provided; FastAPI raises `422` when out of range.
- `selfie` currently accepts base64; future iteration can extend to multipart via `UploadFile`.
- Combine schema validation with request body size limits (`settings.MAX_SELFIE_BYTES`) to fail fast.

### Response Model (`TryOnResponse`)

```py
class TryOnResponse(BaseModel):
    image_url: HttpUrl
    processing_ms: PositiveInt = Field(description="Latency measured in ms.")
    request_id: str = Field(..., description="Trace ID echo.")
    color: str = Field(..., description="Canonical palette name.")
    details: dict[str, str] | None = Field(
        default=None,
        description="Optional safe metadata (e.g., {\"trimmed\": \"true\"}).",
    )
```

**Notes**
- Use `HttpUrl` to ensure `image_url` correctness (https/CDN). For `file://` mocks, fallback to `AnyUrl`.
- `processing_ms` uses `PositiveInt`; truncated to integers in pipeline.
- `details` remains optional but must exclude any raw image data per privacy guardrails.

### Error Envelope
Even though FastAPI/validation errors return `422` by default, wrap them with middleware to match the repository-standard envelope:

```json
{
  "code": "INVALID_PAYLOAD",
  "message": "Color no soportado.",
  "request_id": "req-123",
  "details": { "color": ["Debe ser uno de ..."] }
}
```

Implement via `@app.exception_handler(RequestValidationError)` in `app/main.py` referencing the same `request_id` middleware.

## F04.1.2 — Pipeline Modules & Cache
- `app/core/models.py`: `ModelCache.segmenter()` lazily loads a singleton `SegmenterModel` (thread-safe). Use `.clear()` in tests when necessary.
- `app/core/segmenter.py`: pure function `segment_selfie(selfie)` returns a deterministic `SegmentResult` (mask id derived from a SHA1 digest + cached model version).
- `app/core/recolor.py`: `apply_recolor(segment, color, intensity)` produces a deterministic CDN-like URL and metadata linking the output to the mask/model.
- `app/core/postprocess.py`: `build_response_metadata` sanitizes metadata (mask id, model version, intensity, processing time) before surfacing it in the response.
- `app/core/pipeline.py`: orchestrates segmentation → recolor → postprocess, measuring `processing_ms` and returning `TryOnResponse`. All steps are pure/predictable for testing.
- Tests: `tests/test_pipeline_modules.py` covers cache singleton behavior and metadata propagation; `tests/test_tryon.py` asserts the overall pipeline still works.

## Traceability
- Schemas aligned with `docs/PAYLOAD_FORMAT.md` and `docs/PALETTE_UX.md`.
- Validations ensure SoC: BFF/mobile perform basic checks, ML API re-validates for defense in depth.
- Pipeline modules/caching implemented per `PROJECT_PLAN.md` Fase 2 requirements.
- Future tasks (F04.1.3–F04.1.5) will enforce payload-size limits and extend pytest coverage with real fixtures/endpoints.

## F04.2 — Payload Limits & MIME Validation
- **Limits**: `app/core/media.py` enforces 6 MB max via real byte count (`MAX_SELFIE_BYTES`) before pipeline execution. Violations raise `PayloadTooLargeError` → `413` with `{ code: "PAYLOAD_TOO_LARGE", details: { max_bytes } }`.
- **MIME**: Only `image/png` and `image/jpeg` are accepted; other MIME types trigger `UnsupportedMediaTypeError` → `415` with `code "UNSUPPORTED_MEDIA_TYPE"`.
- **Corruption**: Invalid/incorrectly padded base64 throws `InvalidSelfieDataError` → `400` + `code "INVALID_SELFIE"` to signal bad uploads even if JSON structure is valid.
- **Error handling**: `app/main.py` registers an `ApiError` handler ensuring all above map to the standard envelope, sharing `request_id`.
- **Testing**: 
  - `tests/test_media_limits.py` covers the validation helper edge cases (size, MIME, corruption).
  - `tests/test_tryon_api.py` uses `TestClient` (skipped when FastAPI isn’t installed) to assert HTTP status codes/envelopes for 413/415 responses.
  - Existing pipeline tests confirm metadata includes the MIME type for traceability.
- **Docs**: `docs/PAYLOAD_FORMAT.md` now states the 6 MB ceiling, supported MIME types, and error codes mobile/BFF should handle.

## F04.3 — Testing & Dev Workflow
- **Unit tests** (`pytest`):
  - `tests/test_pipeline_modules.py`: pure functions (segmenter/recolor/cache).
  - `tests/test_media_limits.py`: payload size/MIME guards.
  - `tests/test_tryon.py`: schema defaults + pipeline happy path.
- **Integration tests**:
  - `tests/test_tryon_api.py` exercises `/try-on` via `fastapi.testclient.TestClient`; skipped if FastAPI extra deps aren’t available (install with `pip install fastapi[all]` to run).
  - Future addition: fixture-based tests with sample base64 payloads to validate processing metadata.
- **Commands**:
  - `cd services/ml-api && uvicorn app.main:app --reload` – local dev server (respects `PORT=8000` by default). Use alongside BFF or mock clients.
  - `cd services/ml-api && pytest` – mandatory before PRs; integrates with `scripts/verify.sh`.
- **Fixtures/todo**:
  - Add realistic base64 fixtures under `tests/fixtures/` for regression.
  - Introduce integration tests hitting the live FastAPI app when ML pipeline real implementation lands (compose service).
