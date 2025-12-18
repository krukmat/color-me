# CLAUDE.md — Operating Guide (ExpressJS + FastAPI + React Native Android)

Este repositorio está diseñado para entregar una experiencia **mobile-first** de “try-on”:
- **Color de cabello** sobre selfie (segmentación + recolor).
- **Prótesis capilar (MVP)** mediante catálogo de overlays (PNG con alpha) y editor en móvil.
- Instagram es el canal de adquisición; la experiencia corre en **nuestra app o web**, no como filtro AR propio en Instagram.

Este documento define **cómo Claude debe trabajar** en este codebase: quality gates, reglas anti-alucinación, workflow y formato de entrega.

---

## 1) Reglas no negociables

### 1.1 Veracidad y grounding en el repo (anti-alucinaciones)
- No afirmes que ejecutaste comandos si no los ejecutaste realmente.
- No inventes archivos, endpoints, librerías existentes, o “config de producción”.
- Antes de tocar código:
  - identifica el paquete (`apps/mobile`, `services/bff`, `services/ml-api`, `infra`)
  - lee los patrones existentes (logging, manejo de errores, naming, estructura)
  - busca el símbolo/endpoint antes de crear uno nuevo
- Si algo es ambiguo:
  - primero, busca en el repo
  - si sigue ambiguo, propone 2–3 opciones con tradeoffs y elige el default más seguro

### 1.2 Principios de ingeniería
- **KISS**: simple, legible, pocas piezas.
- **SoC**: UI RN ≠ BFF ≠ ML API.
- **DRY**: evitar duplicación, centralizar validaciones y mapping de errores.
- **TDD donde aporta**:
  - unit tests para transformaciones de imagen y validaciones
  - integration tests para endpoints (FastAPI + Supertest)
- **Minimizar mocks**:
  - mock solo lo inevitable (ej. S3).  
  - si se mockea, debe:
    - quedar detrás de una interfaz
    - existir al menos un camino de integración “real”
    - documentarse deuda temporal en `docs/KNOWN_ISSUES.md`

### 1.3 Privacidad y seguridad (selfies)
- Default: **stateless** (no persistir imágenes).
- Si se persiste:
  - opt-in explícito
  - TTL de borrado
  - prohibido loguear base64/bytes
- Límite de tamaño y tipo; sanitizar nombres.

### 1.4 Disciplina de dependencias
- No agregar dependencias sin:
  - justificación breve en PR
  - revisión de licencia
  - evidencia de mantenimiento activo
- Preferir librerías estándar o ampliamente adoptadas.

---

## 2) Layout esperado del repo
- `apps/mobile/` — React Native Android (TypeScript recomendado)
- `services/bff/` — ExpressJS BFF/API Gateway (TypeScript)
- `services/ml-api/` — FastAPI (pipeline de imagen + carga/cache de modelo)
- `infra/` — docker-compose, scripts
- `docs/` — arquitectura, contratos, notas

Si el repo difiere, actualiza este documento en el mismo PR que introduce el cambio.

---

## 3) Protocolo de trabajo (secuencia obligatoria)

### Paso A — Entender
1) Determinar alcance (paquete, feature, endpoint).
2) Leer patrones existentes del paquete.
3) Definir “source of truth”:
   - OpenAPI en FastAPI y tipos compartidos en BFF.

### Paso B — Planificar (explícito, antes de codear)
Debes entregar:
- Plan (bullets concretos)
- Archivos a tocar
- Riesgos + mitigaciones
- Plan de tests (unit + integration)
- Rollback plan

### Paso C — Implementar (PR pequeño y cohesivo)
- Cambios incrementales.
- Evitar refactors grandes sin necesidad.
- Mínimos archivos, máximo valor.

### Paso D — Verificar
- Ejecutar lints/tests del paquete afectado.
- Si no puedes ejecutar, listar comandos exactos y checklist verificable.

### Paso E — Entregar
Incluye: qué cambió, cómo correr, cómo testear, follow-ups.

---

## 4) Definition of Done (DoD)

Un cambio está “done” solo si:
- Compila/build en el paquete objetivo.
- Lint OK.
- Tests agregados/actualizados y OK.
- Docs actualizadas (README/OpenAPI/uso).
- Errores consistentes + request_id correlacionado end-to-end.
- No hay leaks de datos sensibles en logs.

---

## 5) Quality gates (enforced)

### 5.1 Contratos
- BFF valida input/output.
- ML API publica OpenAPI.
- Error envelope consistente:
  - `code` (machine)
  - `message` (humano)
  - `request_id`
  - opcional `details` (safe)

### 5.2 Logging / tracing
- Todo request tiene `request_id`.
- BFF propaga `x-request-id` a ML API.
- Logs estructurados (ideal: JSON).

### 5.3 Resiliencia
- BFF → ML API con timeouts.
- Retries limitados (0–1 por defecto).
- Errores accionables para móvil.

### 5.4 Mobile UX
- Loading, retry y mensaje amigable siempre.
- Evitar trabajo pesado en el JS thread.

---

## 6) Estándares por paquete

### 6.1 `services/bff` (Express + TS)
- TS estricto.
- Validación (zod/yup) y límites de payload.
- Seguridad: helmet, CORS estricto, rate limit.
- Cliente HTTP único hacia ML API con timeouts y headers comunes.

**Tests**
- Unit: validación y mapping de errores.
- Integration: Supertest.

### 6.2 `services/ml-api` (FastAPI)
- Separar:
  - parsing/validation
  - pipeline de imagen (funciones puras cuando se pueda)
  - carga/cache de modelos
- No recargar modelo por request.
- Medir `processing_ms`.

**Tests**
- Unit: recolor y post-procesado de máscara.
- Integration: endpoint con fixture real.

### 6.3 `apps/mobile` (RN Android)
- TypeScript.
- Separar screens / services / utils.
- Image picker + sharing compatibles Android.
- No persistir selfies innecesariamente.

**Tests**
- Unit tests para lógica pura no-trivial.

---

## 7) Roadmap guardrails (evitar scope creep)

### MVP (ship first)
- Hair color try-on:
  - paleta (10)
  - slider intensidad
  - antes/después
  - share
  - CTA reserva (WhatsApp/URL)

### V1
- Prótesis capilar:
  - catálogo PNG + editor (move/scale/rotate) + export/share

### V2 (no implementar sin aprobación explícita)
- Transformación generativa realista de cortes.

---

## 8) Formato de entrega (obligatorio)

Al entregar cambios, responde con:

1) **Summary**
2) **Plan ejecutado**
3) **Decisiones de diseño**
4) **Files changed**
5) **Cómo correr**
6) **Cómo testear**
7) **Riesgos / follow-ups**

Checklist:
- [ ] Lint
- [ ] Unit tests
- [ ] Integration tests
- [ ] Docs updated
- [ ] No sensitive logs

---

## 9) Stop conditions (detener y pedir dirección)
Detener si:
- Se requiere decisión de SaaS pago o dependencia grande.
- Se contradicen restricciones de privacidad.
- El alcance es ambiguo y puede romper arquitectura.

Si debes asumir, elige el default más seguro y documenta la suposición.

---

## 10) Comandos útiles (ajustar si difiere)

Root:
- `make dev` / `make test` / `make lint`

BFF:
- `npm run dev`
- `npm test`

ML API:
- `uvicorn app.main:app --reload`
- `pytest`

Mobile:
- `npm run android`
