# CODEX.md — Execution Protocol (ExpressJS + FastAPI + React Native Android)

Este documento instruye a Codex (CLI/agent) para trabajar de forma segura y consistente.
Enfoque: **cambios grounded**, **PRs pequeños**, **tests-first**, **sin alucinaciones**, y trazabilidad.

---

## 1) Modo operativo

Eres un agente de ingeniería trabajando en un codebase real.
Objetivo: implementar features con confiabilidad, evitando regresiones y manteniendo auditabilidad.

### Siempre primero
1) Leer `README.md`, `CLAUDE.md` y este archivo.
2) Confirmar estructura:
   - `apps/mobile`
   - `services/bff`
   - `services/ml-api`
3) Buscar endpoints/utilidades existentes antes de crear nuevas.

### Disciplina de output
- No afirmar comandos ejecutados sin evidencia.
- No inventar archivos/APIs.
- Preferir diffs pequeños y revisables.

---

## 2) Unidad de trabajo = 1 PR

Cada PR debe ser:
- de propósito único
- con tests
- con docs cuando aplica
- con rollback claro

Evitar PRs “gigantes”.

---

## 3) Workflow obligatorio (no saltar pasos)

### 3.1 Pre-flight (antes de escribir código)
Entregar:
- Goal
- Approach
- Files a tocar
- Edge cases
- Test plan (unit + integration)
- Riesgos
- Rollback plan

Si hay ambigüedad: buscar en repo; si persiste, proponer opciones y elegir la más segura.

### 3.2 Implementar con guardrails
Separación estricta:
- RN: UI/captura/share/API client
- BFF: validación/rate limit/orquestación/error mapping
- ML API: pipeline imagen/cache modelo/OpenAPI

### 3.3 Verificar
Correr:
- lint
- unit tests
- integration tests (si cambian endpoints)

Si no puedes correr, listar comandos exactos y checklist verificable.

### 3.4 Reporte estándar de entrega
1) Summary
2) Decisiones
3) Files changed
4) Comandos corridos (con output) o comandos a correr
5) Evidencia de tests
6) Follow-ups

---

## 4) Reglas anti-alucinación (estrictas)

- Nunca decir “tests pasan” sin haberlos corrido.
- Nunca decir “endpoint existe” sin encontrarlo en el repo.
- Nunca referenciar “config prod” si no está en repo.
- Si creaste algo nuevo, listarlo explícitamente.

---

## 5) Estándares de ingeniería

### 5.1 Calidad
- DRY / SoC / KISS
- Funciones puras para transforms de imagen cuando sea posible.
- No duplicar validaciones request.

### 5.2 Testing
- FastAPI:
  - unit tests para recolor + post-procesado máscara
  - integration test con fixture real
- Express:
  - Supertest
- RN:
  - unit tests para lógica pura no-trivial

### 5.3 Manejo de errores
Error envelope consistente:
- `code`
- `message`
- `request_id`
- `details` opcional safe

Propagar `x-request-id` desde BFF a ML API.

### 5.4 Performance y resiliencia
- Cachear modelo en proceso.
- Timeouts BFF → ML.
- Rechazar payloads grandes temprano.

### 5.5 Privacidad
- No persistir selfies por defecto.
- No loguear imágenes/base64.

---

## 6) Límites de scope (control)

### MVP
- Color try-on: paleta + intensidad + antes/después + share + CTA reserva.

### V1
- Prótesis overlay: catálogo + editor + export/share.

### V2 (fuera de alcance sin aprobación explícita)
- Cortes generativos realistas.

---

## 7) Templates

### 7.1 PR description
**What**
- …

**Why**
- …

**How**
- …

**Testing**
- Commands:
  - …
- Evidence:
  - …

**Risk / Mitigation**
- …

**Rollback**
- …

### 7.2 Plan template
- Goal:
- Constraints:
- Approach:
- Files:
- Edge cases:
- Test plan:
- Rollback:

---

## 8) Comandos sugeridos (actualizar si difiere)

Root:
- `make dev`
- `make lint`
- `make test`

BFF:
- `npm run dev`
- `npm test`

ML API:
- `uvicorn app.main:app --reload`
- `pytest`

Mobile:
- `npm run android`
