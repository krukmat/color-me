# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Operating Guide (ExpressJS + FastAPI + React Native Android)

Este repositorio entrega una experiencia **mobile-first** de "try-on":
- **Color de cabello** sobre selfie (segmentación + recolor).
- **Prótesis capilar (V1)** mediante catálogo de overlays (PNG con alpha) y editor en móvil.
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
  - `src/screens/` — Componentes de pantalla (CaptureScreen)
  - `src/services/` — Lógica de negocio (tryOnService, mediaService)
  - `src/components/` — Componentes reutilizables (ColorPalette, SliderControl)
  - `src/state/` — Estado Zustand (useTryOnState, useSelfieStore)
  - `src/types/` — TypeScript interfaces
  - `src/utils/` — Utilidades (palette.ts, request.ts)
  - `__tests__/` — Unit tests
- `services/bff/` — ExpressJS BFF/API Gateway (TypeScript)
  - `src/index.ts` — Express app, middleware, rutas
  - `src/routes/` — Endpoints (tryon.ts)
  - `src/types/` — Interfaces TypeScript
  - `src/middleware/` — requestId middleware
- `services/ml-api/` — FastAPI (pipeline de imagen + carga/cache de modelo)
  - `app/main.py` — FastAPI app, endpoints, error handlers
  - `app/schemas/` — Pydantic models (TryOnRequest, TryOnResponse)
  - `app/core/` — Pipeline modules
    - `pipeline.py` — Orquestación (segmentación → recolor → post-procesado)
    - `models.py` — ModelCache singleton (carga lazy, thread-safe)
    - `segmenter.py`, `recolor.py`, `postprocess.py` — Lógica de imagen
    - `media.py` — Validación de payload (tamaño, MIME, base64)
    - `output_store.py` — TTL store in-memory para imágenes procesadas
    - `palette.py` — Definiciones de paleta
    - `errors.py` — Errores custom
  - `tests/` — Test suite pytest
- `docs/` — Arquitectura, contratos, notas
  - `PAYLOAD_FORMAT.md` — Especificación request/response
  - `PALETTE_UX.md` — Paleta 10-colores y UX
  - `bff-design.md`, `ml-api-design.md`, `mobile-design.md` — Diseños por paquete
  - `REQUEST_ID_AND_OPENAPI.md` — Tracing end-to-end y contratos
  - `phase-map.md` — Estado de fases (F01–F06)
  - `CONTRIBUTING.md` — Requisitos de PR y rollback plans
  - `internal/` — Planificación privada del proyecto
- `scripts/` — Utilidades
  - `verify.sh` — Health checks (lint, test, ruff, mypy)
- `docker-compose.yml` — Orquestación multi-servicio
- `Makefile` — Targets (dev, lint, test)

Si el repo difiere, actualiza este documento en el mismo PR que introduce el cambio.

---

## 2.5) Flujo de datos end-to-end

**Mobile → BFF → ML API → Response**

1. **Mobile** genera `request_id` (UUID), captura selfie, elige color de paleta (10), ajusta intensidad (0–100, pasos de 5)
2. **BFF** valida tamaño/formato, propaga `x-request-id` header y `request_id` field a ML API
3. **ML API**
   - Re-valida payload (Pydantic + media.py): MIME, tamaño ≤ 6 MB actual bytes
   - Ejecuta pipeline: segmentación (MediaPipe) → recolor (transformación HSV) → post-procesado (feathering, anti-bleed)
   - Almacena resultado en OUTPUT_STORE (TTL-based) y retorna URL + `image_id`
4. **Response** incluye `image_url` para GET `/images/{image_id}`, `processing_ms`, `request_id` eco

**Request Tracing**: Todos los logs incluyen `[request_id]` para correlación end-to-end. No loguear base64/bytes.

**Error Envelope** (consistente):
```json
{
  "code": "ERROR_CODE",
  "message": "Mensaje en español",
  "request_id": "req-uuid-123",
  "details": { "field1": ["error message"] }
}
```

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

### Root (docker-compose orchestrated)
```bash
make dev              # docker-compose up --build (ML API:8000 + BFF:3000)
make lint             # ./scripts/verify.sh (ruff, mypy, eslint, jest en BFF/mobile)
make test             # ./scripts/verify.sh
```

### BFF (Express + TypeScript)
```bash
cd services/bff
npm run dev           # ts-node-dev --respawn src/index.ts (port 3000, hot-reload)
npm run lint          # eslint 'src/**/*.{ts,tsx}'
npm test              # jest
npm test -- --watch   # jest en modo watch

# Single test file:
npm test -- test_tryon.test.ts
```

**Debugging BFF**:
- Endpoint: `POST http://localhost:3000/api/try-on`
- Headers: `Content-Type: application/json`
- Body: `{ selfie: "data:image/...", color: "Sunlit Amber", intensity: 50, request_id: "..." }`

### ML API (FastAPI + Python)
```bash
cd services/ml-api
pip install -r requirements.txt
uvicorn app.main:app --reload                    # port 8000, hot-reload

# Linting / Type checking:
ruff check .          # Linter (incluye import sort, format)
mypy .                # Type checking (if configured)

# Testing:
pytest                # Todos los tests
pytest -v             # Verbose output
pytest tests/test_tryon_api.py           # Solo un archivo
pytest tests/test_tryon_api.py::test_post_try_on -v  # Test específico
pytest --cov=app      # Coverage report
pytest -x             # Exit on first failure
pytest tests/ -k "media" # Solo tests que matcheen "media"
```

**Debugging ML API**:
- Endpoint: `POST http://localhost:8000/try-on`
- OpenAPI: `http://localhost:8000/docs` (Swagger UI)
- Headers: `x-request-id: <uuid>`
- Body: `{ selfie: "data:image/...", color: "Sunlit Amber", intensity: 50, request_id: "..." }`

**Imagen test** (base64 mínima):
- Usar fixtures en `tests/conftest.py` (miniature PNG válida)
- O generar en-memory: `PIL.Image.new("RGB", (10, 10)).tobytes()`

### Mobile (React Native Android)
```bash
cd apps/mobile
npm install
npm run android       # Lanza app en emulator/device
npm run ios           # iOS (si hay soporte)
npm run start         # Metro bundler standalone
npm run lint          # eslint .
npm test              # jest
npm test -- --watch   # jest modo watch
```

**Debugging Mobile**:
- Logs: `adb logcat | grep "color-me"` o `react-native log-android`
- DevTools: React Native Debugger (https://github.com/jhen0409/react-native-debugger)

### Verificación rápida (todos los paquetes)
```bash
./scripts/verify.sh   # Ejecuta lint + test en BFF, ML API, mobile

# Opcional: agregar --verbose para más detalle
```

---

## 11) Paleta de colores (constante en ambos lados)

**10 colores** (definidos en `apps/mobile/src/utils/palette.ts` y `services/ml-api/app/core/palette.py`):
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

**Rango de intensidad**: 0–100 (pasos de 5 en móvil, validado en BFF y ML API).

---

## 12) Variables de entorno

### .env (root o docker-compose)
```bash
PORT=3000
ML_API_URL=http://ml-api:8000/try-on    # BFF → ML API endpoint
ALLOWED_ORIGIN=*                         # CORS origin (production: restringir)
```

### Local dev (servicios independientes)
```bash
# En services/bff:
ML_API_URL=http://localhost:8000/try-on

# En services/ml-api:
# (ninguna env var requerida; uvicorn usa --host y --port)
```

---

## 13) Model caching (ML API)

**MediaPipe Segmenter**:
- Cargado una sola vez en `app/core/models.py` → `ModelCache.segmenter()` (singleton thread-safe)
- Inicialización lazy en primer request
- **NO** recargar por request
- Mecánica de reset para testing: `ModelCache.clear()`
- Path actual: stub seguro con fallback (MediaPipe-backed cuando sea ready)

**Implicación**: Primera request puede tardar ~1–2s (carga de modelo); posteriores <1s.

---

## 14) Output storage (ML API)

**TTL In-Memory Store**:
- Almacena imágenes procesadas (PNG/JPEG) temporalmente
- Auto-expiration basado en TTL
- Endpoint: `GET /images/{image_id}` retorna bytes + Content-Type correcto
- Error: `404 IMAGE_NOT_FOUND` si expirada/missing
- Thread-safe para requests concurrentes

**Uso**: Móvil recibe `image_url` en response y la consume en `<Image source={{ uri: image_url }}/>`

---

## 15) Testing strategy (TDD emphasis)

### ML API (pytest)
- **unit tests**: segmentación, recolor, paleta, validación media
- **integration tests**: endpoint full request/response con Pydantic validation
- Fixtures en `conftest.py`: PNG mínimo válido, payloads de test
- Máscara: usar images simplificadas (10x10px) para rapidez

### BFF (jest + supertest)
- **unit tests**: esquemas Zod/type guards, error mapping
- **integration tests**: mocking ML API via supertest y http mocks
- Casos: valid request, timeout, invalid color, payload too large, etc.

### Mobile (jest)
- **unit tests**: utilidades (palette sort, request serialization)
- **state**: tests de Zustand stores
- **snaps**: snapshots de componentes si es necesario

### Pre-commit checklist
Antes de push:
```bash
./scripts/verify.sh   # Asegura lint + test OK en todos los paquetes
git status            # Verifica que no haya archivos uncommitted
```

**Golden rule**: No hacer commit si hay tests rotos. Documentar deuda temporal en `docs/KNOWN_ISSUES.md` si es necesario.

---

## 16) Decisiones de arquitectura (por qué así)

- **Zustand** (mobile state): Ligero, sin boilerplate, compatible con RN
- **Express + Helmet + CORS**: Standard, seguro, performance
- **FastAPI + Pydantic**: Async-ready, type-safe, OpenAPI auto
- **MediaPipe (planned)**: Industry standard para segmentación de pelo
- **In-memory TTL store**: Simple, sin depender de S3/redis, OK para MVP
- **request_id propagation**: Essential para debugging end-to-end en prod
- **TDD on image transforms**: Crítico: bugs en imagen son costosos; tests evitan regresiones

---

## 17) Conocidos issues / deuda técnica

Ver `docs/KNOWN_ISSUES.md` (si existe) o registrar en issues de GitHub con label `tech-debt`.

Ejemplos:
- MediaPipe-backed segmenter aún no integrado (stub safe en prod)
- Output store TTL-based: migrará a Redis en V1 si crecen requests
- Mobile: drag-to-share no implementado en MVP (feature V1)
