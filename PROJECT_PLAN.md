# Project Plan — Color Me (MVP + V1)

Este documento convierte los requerimientos funcionales y guardrails de `CLAUDE.md` / `CODEX.md` en un plan ejecutable end-to-end.

## Objetivo
- **MVP**: “Hair color try-on” mobile-first: paleta (10) + intensidad + antes/después + share + CTA reserva (WhatsApp/URL).
- **V1**: “Prótesis capilar” con catálogo de overlays PNG (alpha) + editor (move/scale/rotate) + export/share.
- **Fuera de alcance (V2)**: generación realista de cortes sin aprobación explícita.

## Arquitectura (SoC)
- `apps/mobile/` (React Native Android): UI + captura + share + cliente API.
- `services/bff/` (Express TS): validación, rate-limit, orquestación y mapping de errores.
- `services/ml-api/` (FastAPI): pipeline de imagen (segmentación + recolor), carga/cache de modelo y OpenAPI.

## Contratos y cross-cutting (bloqueantes)
- `request_id` obligatorio; BFF propaga `x-request-id` hacia ML API.
- Error envelope estándar: `code`, `message`, `request_id`, `details?` (safe).
- Resiliencia: timeouts BFF→ML, retries 0–1, límites de payload (tipo/tamaño).
- Privacidad: stateless por defecto; prohibido loguear base64/bytes.

## Roadmap por fases (entregables)

### Fase 0 — Alineación de producto (rápida)
- Definir paleta (10) (nombre + hex/HSV) y rango del slider.
- Definir UX de comparación (toggle/slider) y copy de errores.
- Acordar formato de respuesta: imagen resultante + metadata (p.ej. `processing_ms`).

### Fase 1 — Fundaciones técnicas (repo + DX)
- Skeleton de paquetes y comandos reproducibles (`make dev/lint/test` o equivalentes).
- Contrato OpenAPI inicial en ML API y DTOs en BFF.
- Middleware de `request_id` y propagación de headers.

**DoD**: build/lint/test del paquete afectado + docs mínimas de “cómo correr”.

### Fase 2 — ML API (MVP hair color core)
- Endpoint de try-on (input: imagen + color + intensidad).
- Pipeline: parsing/validación → segmentación → recolor → post-procesado.
- Cache del modelo en proceso (no recargar por request).
- Métrica `processing_ms`.

**Tests (pytest)**:
- Unit: recolor + post-procesado máscara (fixtures reales).
- Integration: endpoint con fixture real (“happy path” + error cases).

### Fase 3 — BFF (gateway)
- Endpoint(s) BFF para mobile:
  - valida input (zod/yup), rechaza payloads grandes temprano
  - llama ML API con timeouts + `x-request-id`
  - normaliza errores al envelope estándar
- Seguridad: CORS estricto, helmet, rate limit.

**Tests**:
- Unit: validación + mapping de errores.
- Integration: Supertest (ideal: camino real contra ML en entorno local/compose).

### Fase 4 — Mobile (RN Android)
- Captura/selección de selfie + preview.
- Paleta (10) + slider intensidad.
- Antes/después (toggle/slider).
- Share (Android).
- CTA reserva (WhatsApp/URL).
- Estados UX: loading, retry, mensaje amigable siempre; evitar trabajo pesado en JS thread.

**Tests**:
- Unit: lógica pura (mapeos, helpers, reducers/state).

### Fase 5 — Hardening + Release MVP
- Ajustes de performance (compresión/redimensionado previo al upload).
- QA en dispositivo real + regresión visual.
- Checklist de privacidad/logging.

### Fase 6 — V1 Prótesis (overlay editor)
- Catálogo de overlays PNG con alpha (source definido: local o servido).
- Editor: move/scale/rotate, reset, export/share.

## Criterios de aceptación (MVP)
- El usuario puede aplicar uno de 10 colores sobre selfie y ajustar intensidad.
- Puede ver antes/después claramente y compartir el resultado.
- La app siempre muestra loading/retry y mensajes útiles en error.
- No se persisten selfies por defecto y no se loguean datos sensibles.

## Comandos (referencia)
- Root: `make dev`, `make lint`, `make test`
- BFF: `npm run dev`, `npm test`
- ML API: `uvicorn app.main:app --reload`, `pytest`
- Mobile: `npm run android`

## Riesgos y mitigaciones
- Latencia de ML: cache de modelo + límites de tamaño + timeouts.
- Payloads grandes: resize/compress en mobile + rechazo temprano en BFF.
- Privacidad: stateless + prohibición de logs con imagen/base64.

## Rollback
- Feature flags por endpoint/flow (si aplica) y reversión por PR pequeño.
- Mantener contratos compatibles (versionado si se rompe el API).
