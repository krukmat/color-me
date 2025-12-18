# Mobile Architecture Plan — F02 Diseño Mobile

Grounded design for the React Native Android client (`apps/mobile/`) covering structure, error handling, service consumption, and testing strategy per F02 tasks. Aligns with `PROJECT_PLAN.md`, `TICKETS.md` (fase 4), `AGENTS.md`, and `CODEX.md`.

## 1. Directory & Module Layout
```
apps/mobile/
├── app.tsx / index.tsx
└── src/
    ├── screens/
    │   └── TryOnScreen.tsx        # Container wiring UI + hooks
    ├── components/
    │   ├── Palette.tsx            # 10-color palette selector
    │   ├── IntensitySlider.tsx
    │   ├── BeforeAfterToggle.tsx
    │   ├── PreviewCanvas.tsx      # Renders before/after states
    │   └── ActionBar.tsx          # Share + CTA button
    ├── services/
    │   ├── api/
    │   │   ├── client.ts          # Fetch wrapper (timeout, baseURL)
    │   │   └── tryOnService.ts    # Functions hitting BFF endpoints
    │   └── telemetry.ts           # request_id propagation, logging (no base64)
    ├── state/
    │   ├── useTryOnState.ts       # Hook for palette/intensity/loading/error
    │   └── types.ts               # DTOs mirroring BFF contract
    ├── utils/
    │   ├── image.ts               # compression/resizing helpers
    │   ├── palette.ts             # canonical palette definition
    │   └── request.ts             # serialize payload, attach request_id
    └── __tests__/
        ├── palette.test.ts
        ├── requestSerializer.test.ts
        └── useTryOnState.test.ts
```

**Guidelines**
- UI components stay pure (props/state only) to comply with SoC.
- `services/api` is the single source of truth for HTTP calls to the BFF, ensuring `x-request-id` propagation and reusable error handling.
- `state` hooks isolate control/state transitions from UI, simplifying tests.
- `utils/palette.ts` exports the 10 colors (names + hex/HSV) defined in `docs/`.
- `__tests__` houses pure logic tests (no React Native bridge) per `AGENTS.md`.

## 2. Error Handling & UX States
- Global state shape: `{ status: 'idle' | 'loading' | 'success' | 'error', errorCode?: string }`.
- `useTryOnState` handles transitions:
  - `startRequest(color, intensity)` → `loading`.
  - `onSuccess(result, metadata)` → `success`.
  - `onError(errorEnvelope)` → `error`.
- Error messages mapped from `BFF` envelope (`code`, `message`, `request_id`, `details`):
  - `NETWORK_ERROR`, `PAYLOAD_TOO_LARGE`, `ML_FAILURE`, fallback `UNKNOWN`.
  - Display friendly copy defined in `docs/` Fase 0 (loading, retry). Provide CTA for retry.
- Request retries limited to 1 auto retry for network timeouts; manual retry via UI button.
- Ensure `request_id` surfaced for support (e.g., toast/snackbar with reference).
- Logging: use structured console logs stripping any base64/image data.

## 3. Service Consumption Flow
1. User selects color/intensity → `useTryOnState` builds payload via `utils/request.ts`.
2. `tryOnService` posts to BFF `/v1/try-on`:
   - Attach `x-request-id` (generated client-side UUID4, stored per session) so BFF can forward.
   - Set timeout (e.g., 12s) and cancel if exceeded.
3. Response:
   - Success: contains processed image URL/buffer + metadata (`processing_ms`). Pass to `PreviewCanvas`.
   - Error: standardized envelope; map to UX message.
4. Upload payload:
   - Use `image.ts` to compress/rescale prior to sending (per Fase 5 but plan early).
   - Validate payload size client-side (< limit in BFF/ML).

## 4. Testing Strategy
- **Unit Tests (`__tests__`)**
  - `palette.test.ts`: ensure exported palette matches canonical names/values.
  - `requestSerializer.test.ts`: verify payload structure, header injection, size checks.
  - `useTryOnState.test.ts`: simulate transitions & retries without UI.
- **Integration (future)**
  - Add Detox/Jest-native tests once UI stable (not required now but keep folder structure ready).
- **Commands**
  - `npm test` (once RN project scaffolded).
  - `scripts/verify.sh` should run mobile tests when available.

## 5. Run / Dev Workflow
- `npm run android` remains the main entry; document prerequisites (Android SDK, emulator).
- Provide `README` snippet describing:
  - How to configure `.env` for BFF base URL.
  - Steps to generate assets (palette icons).
  - Use of `scripts/verify.sh` before PR.

## 6. Next Actions
1. Scaffold `apps/mobile` with the directories/components above.
2. Define shared type definitions (DTOs) synced with BFF once F03 finalize contract.
3. Implement `useTryOnState` and `services/api/client.ts` with placeholder BFF endpoints for early testing.
4. Document developer setup instructions + error messaging table in `docs/`.

This plan satisfies F02 tasks by detailing structure, error/UX flow, testing approach, and development strategy. Update `docs/phase-map.md` as implementation progresses.
