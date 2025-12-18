# Color Me — Repository Overview

## Overview
Este repo (Express BFF, FastAPI ML API y React Native Android) habilita la experiencia mobile-first de **hair color try-on** y más adelante la prótesis capilar. La guía `CLAUDE.md` define los requerimientos (paleta de 10 tonos, slider de intensidad, before/after, share, CTA) y las reglas operativas; sigue el `PROJECT_PLAN.md` / `TICKETS.md` para el roadmap MVP/V1.

## Structure
- `apps/mobile/`: React Native Android (pantallas, servicios, utilerías).
- `services/bff/`: Express TypeScript Gateway (validación, rate-limit, mapping).
- `services/ml-api/`: FastAPI pipeline (segmentación, recolor, modelo cacheado).
- `docs/`: especificaciones (paleta, payloads, UX messages, plan/tickets).
- `scripts/verify.sh`: script central de verificación (ruff/mypy/pytest para ML, npm lint/tests para BFF/mobile cuando existan).

Actualmente las carpetas `apps/` y `services/` se definirán conforme se avance con la arquitectura. Usa este repositorio para versionar todo el trabajo y documentar cada adición en `docs/`.

## Commands
- `make dev`: levanta el stack de desarrollo (una vez que existan `Makefile`s).
- `make lint`: corre linters en todo el repo.
- `make test`: ejecuta las suites de prueba disponibles.
- `npm run dev`, `npm test`: para `services/bff`.
- `uvicorn app.main:app --reload`, `pytest`: para `services/ml-api`.
- `npm run android`: para `apps/mobile`.
- `scripts/verify.sh`: verifica el estado actual del stack. Úsalo después de agregar paquetes o dependencias.

Si alguna carpeta/log/comando no existe aún, documenta la razón en `docs/` y actualiza `AGENTS.md`/`PROJECT_PLAN.md` antes de romper el flujo.

## Next Steps
1. Completar la Fase 0 (paleta, payload, mensajes) — ya registradas en `docs/`.
2. Implementar los servicios básicos con `request_id`, contrato OpenAPI y pruebas mínimas (ver `PROJECT_PLAN.md`).
3. Mantener actualizados los tickets de `TICKETS.md` y el checklist de CodeX/Claude en cada PR. 

Usa esta guía como entrada rápida para nuevos contribuyentes y para mantener coherencia hasta que se completen los paquetes principales.
