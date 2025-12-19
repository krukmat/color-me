# Known Issues — Color Me

Este documento rastrea issues conocidos, deuda técnica y limitaciones del proyecto.

**Última actualización**: 2025-12-19

---

## MOBILE APP (apps/mobile) — F02 GAPS

**Auditoría realizada**: 2025-12-19
**Documento**: `docs/internal/MOBILE_AUDIT_2025-12-19.md`
**Plan de implementación**: `docs/internal/MOBILE_IMPLEMENTATION_PLAN.md`
**Tickets**: `docs/internal/MOBILE_SPRINT1_TICKETS.md`

### Gaps Críticos (Blockers para MVP)

#### 🔴 GAP-C1: Sin Conectividad Real a APIs

**ID**: MOBILE-001
**Estado**: Pendiente
**Prioridad**: CRÍTICA
**Esfuerzo**: 2-3 horas

**Descripción**:
`services/tryOnService.ts` solo contiene `mockTryOnRequest`. No hay cliente HTTP real para conectar con BFF.

**Impacto**:
- Usuario ve imagen original sin procesamiento real
- No se conecta al BFF (Express en puerto 3000)
- No se envía payload al ML API
- Viola regla de `CLAUDE.md`: "try to not mock"

**Archivos afectados**:
- `services/tryOnService.ts:18-33` (solo mock)
- `services/api/client.ts` (NO EXISTE)
- `services/api/tryOnApi.ts` (NO EXISTE)
- `screens/CaptureScreen.tsx:116` (usa mock)

**Solución**:
Crear `services/api/client.ts` con fetch+timeout. Ver `docs/internal/MOBILE_AUDIT_2025-12-19.md#anexo-a` para código completo.

---

#### 🔴 GAP-C2: Componente de Visualización No Usa Resultado Procesado

**ID**: MOBILE-002
**Estado**: Pendiente
**Prioridad**: CRÍTICA
**Esfuerzo**: 2-3 horas

**Descripción**:
`SelfiePreview` ignora `result.imageUrl` y siempre muestra imagen original. Solo aplica overlay CSS, no muestra resultado REAL del ML API.

**Impacto**:
- Usuario NUNCA ve resultado real del try-on
- Slider "Antes/Después" es simulación, no comparación real
- Aunque la API funcione correctamente, UI no refleja el resultado

**Archivos afectados**:
- `components/SelfiePreview.tsx:42-54` (renderiza solo selfie.uri)
- `screens/CaptureScreen.tsx:159-165` (no pasa result.imageUrl)

**Solución**:
Modificar `SelfiePreview` para recibir `processedUri` y hacer toggle real entre imágenes. Ver `docs/internal/MOBILE_AUDIT_2025-12-19.md#anexo-b` para código completo.

---

#### 🔴 GAP-C3: Sin Funcionalidad Share

**ID**: MOBILE-003
**Estado**: Pendiente
**Prioridad**: CRÍTICA (MVP requirement)
**Esfuerzo**: 1-2 horas

**Descripción**:
No hay botón ni lógica para compartir resultado procesado.

**Impacto**:
- Usuario no puede compartir resultados
- Bloqueante para MVP (requerimiento explícito en CLAUDE.md sec. 7)
- Sin viralidad/distribución del producto

**Solución**:
Implementar botón Share con `react-native-share`. Ver `docs/internal/MOBILE_AUDIT_2025-12-19.md#anexo-c` para código completo.

---

#### 🔴 GAP-C4: Sin CTA Reserva

**ID**: MOBILE-004
**Estado**: Pendiente
**Prioridad**: CRÍTICA (MVP requirement)
**Esfuerzo**: 1 hora

**Descripción**:
No hay botón para conversión a reservas (WhatsApp/URL).

**Impacto**:
- Sin conversión a objetivo de negocio
- Bloqueante para MVP (requerimiento explícito)

**Solución**:
Implementar botón CTA con deeplink a WhatsApp. Ver `docs/internal/MOBILE_AUDIT_2025-12-19.md#anexo-d` para código completo.

---

### Gaps Importantes (Deuda Técnica)

#### 🟡 GAP-I1: Sin Configuración de Entorno

**ID**: MOBILE-005
**Estado**: Pendiente
**Prioridad**: IMPORTANTE
**Esfuerzo**: 1 hora

**Descripción**:
URLs y configs hardcodeadas, sin `.env` ni config runtime.

**Impacto**:
- Imposible cambiar endpoint sin rebuild
- Complicado testing con diferentes ambientes
- No hay diferenciación dev/prod

**Solución**:
Crear `.env.example` e instalar `react-native-config`. Ver `docs/internal/MOBILE_AUDIT_2025-12-19.md#anexo-e` para código completo.

---

#### 🟡 GAP-I2: Duplicación de Stores

**ID**: MOBILE-TBD
**Estado**: Pendiente (Sprint 2)
**Prioridad**: IMPORTANTE
**Esfuerzo**: 3-4 horas

**Descripción**:
`store/selfieStore.ts` (Zustand) y `state/useTryOnState.ts` (useState) duplican responsabilidades.

**Impacto**:
- Confusión de responsabilidades
- Duplicación de campo `error`
- Posible state desincronizado

**Archivos afectados**:
- `store/selfieStore.ts:1-23`
- `state/useTryOnState.ts:1-160`

**Solución**:
Consolidar en un solo Zustand store `useAppStore`.

---

#### 🟡 GAP-I3: Test Config Issue (react-native-image-picker)

**ID**: MOBILE-TBD
**Estado**: Pendiente (Sprint 2)
**Prioridad**: IMPORTANTE
**Esfuerzo**: 15 min

**Descripción**:
`App.test.tsx` falla por Jest no transformar módulos ES6 de `react-native-image-picker`.

**Impacto**:
- 1/5 test suites failing
- No bloquea funcionalidad, pero reduce cobertura

**Archivos afectados**:
- `__tests__/App.test.tsx`
- `jest.config.js`

**Solución**:
```javascript
// jest.config.js
transformIgnorePatterns: [
  'node_modules/(?!(react-native|react-native-image-picker|@react-native)/)',
]
```

---

#### 🟡 GAP-I4: Sin Compresión/Resize de Imagen Pre-Upload

**ID**: MOBILE-TBD
**Estado**: Pendiente (Sprint 2)
**Prioridad**: IMPORTANTE
**Esfuerzo**: 2 horas

**Descripción**:
Image picker usa quality 0.8, pero no hay resize. Fotos high-res pueden exceder 6MB.

**Impacto**:
- Payloads grandes → latencia alta
- Posible rechazo de ML API por tamaño >6MB
- Validación de 5MB client-side puede no ser suficiente

**Archivos afectados**:
- `services/media.ts:17-22`

**Solución**:
Implementar resize a max 1920x1080 antes de capturar base64 usando `react-native-image-resizer`.

---

## BFF (services/bff) — F03

**Estado**: Solo diseño documentado en `docs/bff-design.md`

### Pendientes

- [ ] Implementación de endpoints Express
- [ ] Validaciones con zod
- [ ] Rate limiting
- [ ] Propagación de `x-request-id`
- [ ] Tests con Supertest

---

## ML API (services/ml-api) — F04

**Estado**: Pipeline básico implementado con stubs

### Limitaciones Conocidas

#### MediaPipe Segmenter
- Actualmente usa fallback safe
- Falta integrar modelo MediaPipe real
- Máscara es placeholder (no real)

#### Recolor
- Implementación básica
- Falta recolor determinista HSV/LAB real
- Anti-bleed en progreso

#### Output Store
- In-memory TTL-based (OK para MVP)
- Deuda: migrar a S3/Redis en V1

---

## INFRA (docker-compose, Makefile)

**Estado**: Parcialmente implementado

### Pendientes

- [ ] `make dev` para stack completo
- [ ] `make lint` orchestrado (npm + pytest + ruff)
- [ ] `make test` orchestrado
- [ ] `scripts/verify.sh` completo

---

## Deuda Técnica Global

### Documentación
- [ ] Ejemplos de uso en README
- [ ] Guías de troubleshooting
- [ ] Screenshots actualizados

### Testing
- [ ] Integration tests E2E (mobile → BFF → ML API)
- [ ] Performance testing
- [ ] Load testing

### Security
- [ ] Security audit de dependencias
- [ ] Validación de inputs más exhaustiva
- [ ] Rate limiting en BFF

---

## Changelog de Issues

### 2025-12-19
- **[CREADO]** Documento inicial con gaps de auditoría mobile
- **[AGREGADO]** 4 gaps críticos (GAP-C1 a GAP-C4)
- **[AGREGADO]** 4 gaps importantes (GAP-I1 a GAP-I4)

---

## Cómo Reportar un Nuevo Issue

1. Crear issue en GitHub con template:
   ```markdown
   ## Descripción
   [Descripción clara del problema]

   ## Impacto
   [Cómo afecta al producto/usuarios]

   ## Steps to Reproduce
   1. ...
   2. ...

   ## Expected Behavior
   [Qué debería pasar]

   ## Actual Behavior
   [Qué pasa actualmente]

   ## Screenshots
   [Si aplica]

   ## Propuesta de Solución
   [Si tienes una idea]
   ```

2. Agregar a este documento bajo la sección apropiada
3. Asignar ID, prioridad y esfuerzo
4. Referenciar en `docs/phase-map.md` si es blocker

---

**Mantenido por**: Equipo de desarrollo
**Revisión**: Cada sprint / cuando se descubre nuevo issue
