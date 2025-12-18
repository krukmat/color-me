# BFF Architecture Plan — F03 Diseño BFF

Design notes for `services/bff/` covering endpoints, validation, request tracing, and testing requirements per F03 of the roadmap. This document assumes the current Express skeleton (`src/index.ts`, `routes/tryon.ts`, middleware) and extends it with the standards from `CODEX.md`, `PROJECT_PLAN.md`, and `TICKETS.md`.

## 1. Scope & Responsibilities
- Act as the single gateway for mobile clients (`/api/...`).
- Enforce validation/rate limiting before hitting the ML API.
- Propagate `x-request-id` end-to-end, returning the envelope `{code,message,request_id,details?}` for all errors.
- Shield mobile from ML API transport details: convert payloads, normalize responses, map error codes.

## 2. Endpoints
| Route | Method | Description | Notes |
| --- | --- | --- | --- |
| `/api/try-on` | `POST` | Receives `{selfie,color,intensity,request_id}` and forwards to ML API. | Accepts JSON or multipart (future). Validates palette membership (`docs/PALETTE_UX.md`) and intensity range (0–100, step 5). |

Future endpoints (e.g., `/api/share`, `/api/overlays`) must reuse shared middleware stack.

## 3. Validation Pipeline
1. **Schema layer**: Use `zod` schemas in `src/validation/tryOnSchema.ts` to ensure:
   - `selfie`: base64 string, size hint < 6 MB (match `express.json` limit + ML constraints).
   - `color`: string in the canonical list (import from shared module or env).
   - `intensity`: integer 0–100 defaulting to 50; reject outside range.
2. **Request sanitization**: Drop unexpected keys before forwarding.
3. **Rate limiting**: Apply `express-rate-limit` (e.g., 60 req/5min per IP) and `helmet` + strict CORS (already partially configured).
4. **Payload limits**: Maintain `express.json({ limit: "6mb" })` and optionally support multipart via `busboy` in future.

Invalid requests should return `400` with `{ code: "INVALID_PAYLOAD", message, request_id, details: { fieldErrors } }`.

## 4. Request ID & Logging
- `requestIdMiddleware` (already implemented) extracts/creates `requestId`, attaches to `req` and `res`.
- All downstream logs should include `[requestId]` prefix. Use a lightweight logger (e.g., `pino`) configured for JSON output but avoid base64 payloads.
- Outgoing ML API calls set both `x-request-id` header and `request_id` field in body.

## 5. ML API Client
- Use `axios` instance in `src/lib/mlApiClient.ts` with:
  - Base URL from `ML_API_URL` (default `http://localhost:8000`).
  - Timeout 25s (per `PROJECT_PLAN` resilience notes).
  - Retries disabled by default; rely on upstream retry policies.
  - Automatic response validation (zod schema) to ensure `image_url`, `processing_ms`, etc.
- Handle known ML API errors (413 payload too large, 422 validation, 500) and map them to our envelope.

## 6. Error Handling & Envelope
Central error handler should:
```ts
res.status(statusCode).json({
  code,
  message,
  request_id: req.requestId,
  details, // optional and safe
});
```

Mapping strategy:
- `axios` timeout → `GATEWAY_TIMEOUT` (504) with message “El servicio tardó demasiado.”
- Payload too large → `PAYLOAD_TOO_LARGE` (413) with guidance to compress selfie.
- Validation errors → `INVALID_PAYLOAD` (400) plus field-level info.
- ML API known errors (via `error.response.data.code`) → preserve code/message when safe.
- Unknown errors → `INTERNAL_ERROR` (500) with generic message, log stack server-side.

## 7. Testing Strategy
- **Unit tests** (`npm test` with Jest + Supertest):
  - Validation schemas (ensure color/intensity enforcement).
  - Error mapper (axios error → envelope).
  - Middleware (`requestIdMiddleware` ensures header propagation).
- **Integration tests**:
  - Supertest against Express app with ML API mocked via `nock` or local FastAPI container.
  - Happy path: 200 with normalized response and echoed `request_id`.
  - Error cases: ML timeout, invalid payload, payload too large.
- `scripts/verify.sh` should run `npm test` in `services/bff` plus linting once configured.

## 8. Configuration & Ops
- Environment variables:
  - `PORT` (default 3000)
  - `ML_API_URL`
  - `ALLOWED_ORIGIN` (comma-separated; fallback `*` only in dev)
  - `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`
  - `LOG_LEVEL`
- Add `Makefile`/`package.json` scripts for `npm run dev` (ts-node-dev) and `npm run build/start`.
- Consider `docker-compose` service tying BFF ↔ ML API for local `make dev`.

## 9. Next Steps
1. Implement validation + error mapping modules.
2. Add rate limiter + structured logging.
3. Expand tests per section 7 and integrate into CI (`make test`).
4. Document public API contract in `docs/api/bff-try-on.md` linked from README.

This plan completes F03’s design deliverables. Track implementation progress in `docs/phase-map.md`.
