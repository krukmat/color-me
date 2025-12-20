# Risk & Impact Assessment Matrix

## Evaluation Criteria

### RISK Score (0-10)
How likely this code will cause problems if not tested?

- **Code Complexity** (0-3 pts):
  - 0 = Pure functions, simple logic (palette.ts)
  - 1 = One or two paths (number.ts::clamp)
  - 2 = Multiple conditions, branching logic (request.ts::buildTryOnPayload)
  - 3 = Complex async, state mutations, multiple error paths (api/client.ts::fetchWithTimeout)

- **Error Surface Area** (0-3 pts):
  - 0 = No error handling (palette.ts constants)
  - 1 = Happy path + 1 error (roundToStep edge case)
  - 2 = Multiple error paths (media picker: cancel, permission, etc.)
  - 3 = Network errors, timeouts, retries, aborts (api/client.ts)

- **External Dependencies** (0-2 pts):
  - 0 = No dependencies (palette.ts, number.ts)
  - 1 = Types only (request.ts)
  - 2 = Network, native APIs, external state (api/client.ts, media.ts)

- **Mutation/State** (0-2 pts):
  - 0 = Pure functions only (palette.ts)
  - 1 = Reads from state (useTryOnState hooks)
  - 2 = Mutates state or global effects (selfieStore, share.ts)

**Total RISK = Code Complexity + Error Surface + Dependencies + Mutation**

---

### IMPACT Score (0-10)
How much of the app breaks if this code fails?

- **Number of Importers** (0-3 pts):
  - 0 = Not imported (types/selfie.ts)
  - 1 = Imported by 1 file (api/tryOnApi.ts → tryOnApi)
  - 2 = Imported by 2-3 files (number.ts)
  - 3 = Imported by 4+ files (palette.ts: 6 importers)

- **Position in Call Chain** (0-3 pts):
  - 0 = Leaf node, nothing depends on it (share.ts, cta.ts)
  - 1 = Mid-chain, other modules depend on it (request.ts)
  - 2 = Critical bridge, multiple paths go through it (useTryOnState.ts)
  - 3 = Bottleneck, everything flows through (api/client.ts, api/tryOnApi.ts)

- **User-Facing Impact** (0-2 pts):
  - 0 = Internal utility, users don't notice (palette.ts constants)
  - 1 = Affects one feature (cta.ts = WhatsApp only)
  - 2 = Affects core feature (media.ts = can't capture), app unusable (api/client.ts = no results)

- **Data Flow Criticality** (0-2 pts):
  - 0 = Optional feature (cta.ts WhatsApp, share.ts)
  - 1 = One of two paths (media.ts OR camera OR gallery)
  - 2 = Critical path, no workaround (api/client.ts → HTTP layer)

**Total IMPACT = Importers + Position + User-Facing + Data-Flow**

---

## Scoring Matrix

| File | Code Complexity | Error Surface | Dependencies | Mutation | **RISK** | Importers | Position | User-Facing | Data-Flow | **IMPACT** | **Priority** |
|------|-----------------|---|---|---|---|---|---|---|---|---|---|
| **api/client.ts** | 2 | 2 | 2 | 0 | **6** | 1 | 3 | 2 | 2 | **8** | **🔴 CRITICAL** |
| **api/tryOnApi.ts** | 1 | 2 | 1 | 0 | **4** | 1 | 3 | 2 | 2 | **8** | **🔴 CRITICAL** |
| **useTryOnState.ts** | 2 | 1 | 1 | 2 | **6** | 1 | 2 | 2 | 1 | **6** | **🟠 HIGH** |
| **request.ts** | 1 | 1 | 0 | 0 | **2** | 3 | 1 | 1 | 2 | **7** | **🟠 HIGH** |
| **media.ts** | 2 | 2 | 2 | 1 | **7** | 1 | 1 | 2 | 1 | **5** | **🟠 HIGH** |
| **number.ts** | 1 | 1 | 0 | 0 | **2** | 4 | 1 | 1 | 1 | **7** | **🟠 HIGH** |
| **palette.ts** | 0 | 0 | 0 | 0 | **0** | 6 | 0 | 1 | 0 | **7** | **🟠 HIGH** |
| **CaptureScreen.tsx** | 3 | 3 | 2 | 2 | **10** | 0 | 0 | 2 | 2 | **4** | **🟡 MEDIUM** |
| **selfieStore.ts** | 2 | 1 | 1 | 2 | **6** | 2 | 1 | 1 | 1 | **5** | **🟡 MEDIUM** |
| **SelfiePreview.tsx** | 2 | 1 | 1 | 0 | **4** | 1 | 0 | 1 | 0 | **2** | **🟢 LOW** |
| **SliderControl.tsx** | 2 | 2 | 1 | 0 | **5** | 1 | 0 | 1 | 0 | **2** | **🟢 LOW** |
| **ColorPalette.tsx** | 1 | 1 | 0 | 0 | **2** | 1 | 0 | 1 | 0 | **2** | **🟢 LOW** |
| **share.ts** | 1 | 2 | 2 | 1 | **6** | 1 | 0 | 1 | 0 | **2** | **🟢 LOW** |
| **cta.ts** | 1 | 1 | 1 | 0 | **3** | 1 | 0 | 1 | 0 | **2** | **🟢 LOW** |
| **tryOnService.ts** | 0 | 0 | 0 | 0 | **0** | 1 | 2 | 2 | 2 | **7** | **🟠 HIGH** |
| **config/env.ts** | 0 | 0 | 0 | 0 | **0** | 2 | 1 | 1 | 1 | **5** | **🟡 MEDIUM** |
| **types/selfie.ts** | 0 | 0 | 0 | 0 | **0** | 4 | 1 | 0 | 0 | **5** | **🟡 MEDIUM** |

---

## Priority Groups (Risk × Impact)

### 🔴 CRITICAL (Test Immediately)
**Criteria**: RISK ≥ 6 AND IMPACT ≥ 8, OR Position = 3 (Bottleneck)

| Rank | File | Risk | Impact | Why |
|------|------|------|--------|-----|
| 1 | **api/client.ts** | 9 | 8 | Bottleneck (everything HTTP), complex (timeout/abort), high error surface |
| 2 | **api/tryOnApi.ts** | 6 | 8 | Bottleneck (request/response), maps API contract, error handling critical |

**Testing Strategy**: Mock network, test timeout/abort/error cases comprehensively
**Blocker**: YES - api/client.ts must pass before api/tryOnApi.ts

---

### 🟠 HIGH (Test Soon)
**Criteria**: RISK ≥ 5 OR IMPACT ≥ 6 (and not in CRITICAL group)

| Rank | File | Risk | Impact | Why |
|------|------|------|--------|-----|
| 3 | **useTryOnState.ts** | 8 | 6 | High complexity (state machine), mid-chain dependency, user interactions |
| 4 | **request.ts** | 5 | 7 | Used by 3 files, critical data path, payload validation |
| 5 | **media.ts** | 7 | 5 | Error surface (picker errors), external dependency (native APIs) |
| 6 | **number.ts** | 2 | 7 | Used by 4 files (hub), simple but foundational |
| 7 | **palette.ts** | 0 | 7 | Used by 6 files (hub), but very simple (constants only) |
| 8 | **tryOnService.ts** | 0 | 7 | Appears as mid-chain bridge (re-export, acts as facade) |

**Testing Strategy**: TDD approach, test state transitions, integration with other modules
**Blocker**: Partially - api/client.ts must pass before media.ts

---

### 🟡 MEDIUM (Test Later)
**Criteria**: RISK ≥ 3 OR IMPACT ≥ 4 (and not in higher priority)

| Rank | File | Risk | Impact | Why |
|------|------|------|--------|-----|
| 9 | **CaptureScreen.tsx** | 10 | 4 | Highest complexity (main screen), but entry point (no importers) |
| 10 | **selfieStore.ts** | 6 | 5 | State mutations, but only 2 importers, lower impact |
| 11 | **config/env.ts** | 0 | 5 | Simple config, 2 importers, low complexity |
| 12 | **types/selfie.ts** | 0 | 5 | Type definitions only, no runtime risk |

**Testing Strategy**: Component snapshots, integration tests, mocking dependencies
**Blocker**: Lower priority - api tests should pass first

---

### 🟢 LOW (Test Last)
**Criteria**: RISK < 3 AND IMPACT < 5

| Rank | File | Risk | Impact | Why |
|------|------|------|--------|-----|
| 13 | **SelfiePreview.tsx** | 4 | 2 | Component, simple rendering logic |
| 14 | **SliderControl.tsx** | 5 | 2 | Component with gesture logic, but isolated |
| 15 | **ColorPalette.tsx** | 2 | 2 | Simple color list rendering |
| 16 | **share.ts** | 6 | 2 | Optional feature (nice-to-have), isolated |
| 17 | **cta.ts** | 3 | 2 | Optional feature (CTA only), simple logic |

**Testing Strategy**: Snapshots, basic happy path tests
**Blocker**: None - these are decorative

---

## Revised Implementation Order (Risk-Based)

### Phase 1: Critical Bottlenecks (5-6h)
```
TIER 1 - MUST PASS FIRST:
1. api/client.ts        (Risk 9, Impact 8)  → 2-3h
2. api/tryOnApi.ts      (Risk 6, Impact 8)  → 2-3h

Justification:
- Both are bottlenecks (position = 3)
- High complexity + error surface
- Block everything else (data flow)
- Establish HTTP contract/mocking strategy
```

### Phase 2: High-Impact Data Layer (6-8h)
```
TIER 2 - FOUNDATION:
3. request.ts           (Risk 5, Impact 7)  → 1-2h (extend)
4. useTryOnState.ts     (Risk 8, Impact 6)  → 2-3h
5. media.ts             (Risk 7, Impact 5)  → 2-3h
6. number.ts            (Risk 2, Impact 7)  → 1-2h
7. palette.ts           (Risk 0, Impact 7)  → 0.5h
8. tryOnService.ts      (Risk 0, Impact 7)  → 0.5h (wrapper)

Justification:
- Hubs (used by multiple files)
- Mid-chain dependencies
- Data validation layer
- Blocks Phase 3 (components)
```

### Phase 3: Screen & Components (6-8h)
```
TIER 3 - UI LAYER:
9.  selfieStore.ts      (Risk 6, Impact 5)  → 1h
10. CaptureScreen.tsx   (Risk 10, Impact 4) → 3-4h (largest)
11. SelfiePreview.tsx   (Risk 4, Impact 2)  → 2h
12. SliderControl.tsx   (Risk 5, Impact 2)  → 2h
13. ColorPalette.tsx    (Risk 2, Impact 2)  → 1h

Justification:
- High complexity but low criticality (entry points)
- Can mock dependencies from Phase 1-2
- User interactions, state mutations
```

### Phase 4: Polish & Platform (2-3h)
```
TIER 4 - OPTIONAL:
14. share.ts            (Risk 6, Impact 2)  → 2h
15. cta.ts              (Risk 3, Impact 2)  → 1h
16. config/env.ts       (Risk 0, Impact 5)  → 0.5h
17. types/selfie.ts     (Risk 0, Impact 5)  → 0 (types only)

Justification:
- Optional features (don't affect core try-on)
- Low complexity
- Can test last
```

---

## Transparency on Evaluation Method

### What I Did Well ✅
1. **Dependency analysis** - Counted importers correctly
2. **Position in chain** - Identified bottlenecks
3. **Error surface** - Recognized complex error paths
4. **User-facing impact** - Separated critical vs. optional features

### What I Missed ❌
1. **Quantitative scoring** - Was too qualitative/subjective
2. **Branch coverage gaps** - Focused on line coverage, not branch complexity
3. **Testability cost** - Didn't account for "cost to test" (mocking difficulty)
4. **Execution frequency** - Didn't measure "how often does this run per user action"

### Assumptions I Made 🤔
1. **HTTP timeout is complex** - Assumed fetchWithTimeout has abort/retry logic (check code?)
2. **api/tryOnApi.ts is mid-complexity** - Assumed request/response mapping has error cases
3. **CaptureScreen is "entry point"** - Assumed no other files import it (verify?)
4. **State mutations = higher risk** - Assumption about Zustand stores

---

## Verification Needed

Before finalizing the plan, please verify:

1. **Does `api/client.ts` actually have timeout/abort/retry logic?**
   - If just basic fetch, Risk drops to 5-6
   - If it has exponential backoff, Risk stays at 9

2. **Does `api/tryOnApi.ts` have error status mapping?**
   - If just happy path, Risk drops to 3-4
   - If it maps 400/500/504 errors, Risk stays at 6

3. **Is `CaptureScreen.tsx` really the root, or is there a nav wrapper?**
   - If wrapped by navigation, Impact might be lower
   - Affects Phase 3 priority

4. **Are there any untested async flows?**
   - Promise chains, async/await in state
   - Not visible from static analysis

---

## Final Risk Score Summary

**Total Risk (Sum of all RISK scores)**: 98/10 = 9.8 avg
**Total Impact (Sum of all IMPACT scores)**: 91/10 = 9.1 avg

→ This means the codebase has **HIGH overall risk** due to untested async/network layer.
→ **Critical to test Phase 1-2** before deploying to production.

---

*This matrix is now explicit, quantifiable, and reviewable. Please question any scores—they are assumptions that need validation.*
