# Phase Map — Color Me

Traceable breakdown of phases (Fxx) with tasks, status, and next actions grounded on `README.md`, `AGENTS.md`, `PROJECT_PLAN.md`, `CODEX.md`, and `TICKETS.md`. Use this as the running tracker; update statuses when tasks advance.

## F01 — Levantamiento _(status: in progress)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Entender arquitectura y dependencias (`apps/mobile`, `services/bff`, `services/ml-api`, `infra/docs`) | ✅ completado | Confirmada estructura raíz según `README.md` y `PROJECT_PLAN.md`. Mantener SoC estricta: RN para UI/cliente, BFF para validación/orquestación, ML API para pipeline. |
| Catalogar comandos clave (`make dev/lint/test`, scripts específicos por paquete) | ✅ completado | Referencia en `README.md` y `AGENTS.md`. Ejecutar `scripts/verify.sh` después de agregar dependencias. |
| Consolidar convenciones de código (2 espacios, TS estricto, KISS/DRY/SOC, logging limpio) | ✅ completado | Documentado en `AGENTS.md` y `CODEX.md`. Añadir recordatorio en futuros PR templates. |
| Validar requisitos transversales (`x-request-id`, cache de modelos, límites de payload, error envelope) | ✅ completado | Confirmados en `PROJECT_PLAN.md` y `CODEX.md` (error envelope, propagación `request_id`, payload limits, cache modelo). Preparar middleware y validaciones en fases posteriores. |

## F02 — Diseño Mobile _(status: completed — UI skeleton implemented)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Definir separación UI/servicios/utilidades y estructura base en `apps/mobile` | ✅ completado | Layout implementado (`components/ColorPalette.tsx`, `components/SliderControl.tsx`, `services/tryOnService.ts`, `utils/palette.ts`, `utils/request.ts`, `state/useTryOnState.ts`). |
| Diseñar manejo de errores, estados UX y consumo de servicios remotos | ✅ completado | `src/screens/CaptureScreen.tsx` ahora usa `useTryOnState`, request_id y mock service con estados `idle/loading/success/error`. |
| Planear pruebas de lógica (`__tests__`) y estrategia para `npm run android` | ✅ completado | Nuevos tests (`__tests__/palette.test.ts`, `__tests__/requestSerializer.test.ts`, `__tests__/useTryOnState.test.ts`). `README` mobile mantiene guía para `npm run android`. |

## F03 — Diseño BFF _(status: in progress — design documented in `docs/bff-design.md`)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Especificar endpoints Express, validaciones (zod/yup), rate limiting y orquestación HTTP | ✅ completado | Ver `docs/bff-design.md#2-5` para `/api/try-on`, esquema zod, rate limiting y cliente ML con timeouts. |
| Propagación de `request_id` y envoltorio de error estándar | ✅ completado | `docs/bff-design.md#4-6` describe middleware, logging y mapping al envelope requerido. |
| Diseñar suites con Supertest/zod y documentar comandos (`npm run dev`, `npm test`) | ✅ completado | `docs/bff-design.md#7-8` detalla unit/integration tests y scripts (`npm run dev/test`, `scripts/verify.sh`). Implementation pending. |

## F04 — Diseño ML API _(status: in progress — MediaPipe plan documented in `docs/ml-api-design.md`; entrenamiento futuro aplazado)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Definir validaciones, transformaciones puras y cache de modelos en FastAPI | ✅ completado | Validación en `services/ml-api/app/schemas/tryon.py`, handler en `app/main.py`, pipeline modular (`core/models.py`, `segmenter.py`, `recolor.py`, `postprocess.py`, `pipeline.py`) y tests (`tests/test_pipeline_modules.py`, `tests/test_tryon.py`). |
| Establecer límites de payload y rechazo temprano | ✅ completado | `app/core/media.py` valida tamaño (≤6MB) y MIME PNG/JPEG, lanza `ApiError`s mapeadas a 413/415; documentación actualizada en `docs/ml-api-design.md#F04.2` y `docs/PAYLOAD_FORMAT.md`. Tests en `tests/test_media_limits.py` y `tests/test_tryon_api.py`. |
| Planear pruebas `pytest` (recolor/post-process + endpoint) y comando `uvicorn app.main:app --reload` | ✅ completado | `docs/ml-api-design.md#F04.3` define suites (`tests/test_pipeline_modules.py`, `test_media_limits.py`, `test_tryon.py`, `test_tryon_api.py`), ejecución `pytest` y flujo `uvicorn app.main:app --reload`, más próximos fixtures. |
| Integrar segmentación MediaPipe (modelo real) | ⚡ en progreso | `segmenter.py` incluye ruta MediaPipe con fallback, `ModelCache` preparado; falta conectar modelo real y extracción de máscara multiclass. |
| Implementar recolor determinista + post-proceso real | ⏳ pendiente | Mezcla HSV/LAB/LUT con `intensity` 0–100, feathering y supresión de bleeding usando máscara real (aplazado al retomar MediaPipe real). |
| Post-proceso anti-bleed (feathering, limpieza) | ⚡ en progreso | `app/core/postprocess.py` y pipeline generan metadata (`mask_hash`, `smoothed_mask_len`); anti-bleed real dependerá de máscara real (aplazado). |
| Output store con TTL + `GET /images/{id}` | ✅ completado | `app/core/output_store.py` + endpoint `GET /images/{id}` en `app/main.py`; tests en `tests/test_output_store.py` y `tests/test_tryon_api.py`. |
| E2E con métrica `processing_ms` y logging seguro | ⏳ pendiente | Depende de MediaPipe/recolor reales (aplazado). |

## F05 — Infra / Docs _(status: pending discovery)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Revisar `infra/` y `docs/` (scripts de despliegue, compose, notas) | ✅ completado | `docs/infra-plan.md` documenta estado y decisiones; se añadieron `docker-compose.yml`, `Makefile`, `.env.example`. Falta definir backend de `image_url` y TTL. |
| Documentar requisitos de PR/rollback y mantener plantillas actualizadas | ✅ completado | `docs/CONTRIBUTING.md` define requisitos de PR, plan de tests y rollback, alineado con `CODEX.md`. |

## F06 — Integración y QA _(status: pending)_
| Task | Status | Notes / Next Steps |
| --- | --- | --- |
| Preparar ejecución de `make dev` para stack completo y validar trazabilidad BFF→ML API | ⏳ pendiente | Config Compose/Makefile cuando existan servicios; incluir verificación de `x-request-id` en logs. |
| Planear `make lint` + `make test` y evidenciar resultados para PRs | ⏳ pendiente | Scripts deben orquestar `npm`, `pytest`, RN tests. Documentar comando `scripts/verify.sh` como paso obligatorio antes de PR. |

> Actualiza este mapa conforme avances (por ejemplo, mover tareas de “pendiente” a “en progreso/completado” e incluir decisiones tomadas).
