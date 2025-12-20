# Final Testing Plan - Based on Code Review

**Date**: 2025-12-20
**Status**: ✅ CODE REVIEWED & VALIDATED
**Methodology**: Risk assessment corrected after code inspection

---

## Executive Summary

After code review, my initial risk assessment was **too conservative**. The codebase is:
- ✅ **Well-structured** (clean separation of concerns)
- ✅ **Simple** (no complex async/retry logic)
- ✅ **Low cognitive complexity** (functions do one thing)
- ⚠️ **But critical integrations need testing** (HTTP, state transitions)

**Result**: Testing will be **easier & faster** than initially estimated (8-10h vs 15-20h)

---

## Corrected Risk Assessment

### What I Got Wrong ❌
| Assumption | Reality | Impact |
|---|---|---|
| "api/client.ts has complex retry/backoff logic" | Just AbortController + try/catch | Simpler to test ✅ |
| "api/tryOnApi.ts has complex error mapping" | Simple JSON fallback + statusText | Simpler to test ✅ |
| "useTryOnState.ts has complex state logic" | Simple useState + useCallback | Simpler to test ✅ |

### Risk Scores (Corrected)

| File | Original Risk | Corrected Risk | Test Effort | Test Cases |
|------|---|---|---|---|
| **api/client.ts** | 9 | 6 | 1-2h | 4 (success, timeout, error, cleanup) |
| **api/tryOnApi.ts** | 6 | 4 | 1-2h | 3 (success, error+JSON, error-no-JSON) |
| **useTryOnState.ts** | 8 | 6 | 1-2h | 7 (each callback + integration) |
| **request.ts** | 5 | 2 | 0.5h | 3 (valid, invalid selfie, edge cases) |
| **number.ts** | 2 | 2 | 0.5h | 4 (clamp, roundToStep edge cases) |
| **palette.ts** | 0 | 0 | 0.5h | 2 (find existing, find missing) |

---

## Finalized Testing Strategy

### PHASE 1: API Layer (2-3 hours)

**Why First**:
- Bottleneck for all HTTP communication
- Must be bulletproof before UI tests depend on mocks
- Simple code = fast test development

**Files**:
1. **`api/client.ts`** (fetchWithTimeout)
   - Lines: 10, 15-16, 25-28 critical
   - Test cases:
     ```typescript
     // Case 1: Success
     await fetchWithTimeout('http://...', {method: 'GET'})
       → should return Response object

     // Case 2: Timeout triggered
     await fetchWithTimeout('http://...', {}, 100)
       → should throw AbortError → "Request timeout..."

     // Case 3: Network error
     fetch mock throws
       → should re-throw error

     // Case 4: Cleanup (clearTimeout)
       → setTimeout should be cleared
     ```
   - Mock strategy: Mock fetch, control timeout

2. **`api/tryOnApi.ts`** (performTryOn)
   - Lines: 14-37, 39-47 critical
   - Test cases:
     ```typescript
     // Case 1: Success response
     response.ok = true, JSON valid
       → should map {image_url, processing_ms, request_id, color}
         to {imageUrl, processingMs, requestId, color}

     // Case 2: Error with JSON body
     response.ok = false, error.json() succeeds
       → should throw Error(error.message)

     // Case 3: Error without JSON body
     response.ok = false, error.json() throws
       → should throw Error(response.statusText)

     // Case 4: Missing fields
     response.json() returns {image_url: null}
       → should handle undefined imageUrl
     ```
   - Mock strategy: Mock fetchWithTimeout, control response

---

### PHASE 2: Foundation Layer (1-2 hours)

**Why Second**:
- Utilities used by Phase 3 (UI tests)
- Simple pure functions = fast tests
- Must be correct before state/component tests

**Files**:
1. **`number.ts`** (clamp, roundToStep)
   ```typescript
   // clamp:
   - clamp(5, 0, 10) → 5
   - clamp(-1, 0, 10) → 0
   - clamp(15, 0, 10) → 10
   - clamp(NaN, 0, 10) → 0

   // roundToStep:
   - roundToStep(53, 5) → 55
   - roundToStep(52, 5) → 50
   - roundToStep(1.23, 0.05) → 1.25 (precision handling)
   - roundToStep(10, 0) → 10 (zero step)
   ```

2. **`palette.ts`** (constants + findPaletteColor)
   ```typescript
   - PALETTE has 10 items
   - Each item has {name, hex, description}
   - findPaletteColor("Sunlit Amber") → returns item
   - findPaletteColor("Unknown") → undefined
   - Intensity constants: MIN=0, MAX=100, STEP=5, DEFAULT=50
   ```

3. **`request.ts`** (buildTryOnPayload, createRequestId)
   ```typescript
   // createRequestId:
   - Generates "req-{timestamp}-{random}"
   - Two calls produce different IDs

   // buildTryOnPayload:
   - Valid {selfie, color, intensity} → returns TryOnPayload
   - Missing selfie.base64 → throws Error
   - intensity snapping via snapIntensity

   // snapIntensity:
   - undefined → DEFAULT_INTENSITY (50)
   - 53 → 55 (snapped to INTENSITY_STEP=5)
   - -10 → 0 (clamped)
   - 150 → 100 (clamped)
   ```

4. **`useTryOnState.ts`** (state machine)
   ```typescript
   // Initial state:
   - selectedColor = PALETTE[0]
   - intensity = 50
   - beforeAfterPosition = 1
   - status = "idle"

   // selectColor callback:
   - Updates selectedColor
   - Doesn't affect other state

   // setIntensity callback:
   - Snaps value via snapIntensityValue
   - Updates intensity

   // setBeforeAfterPosition callback:
   - Clamps value 0-1
   - Updates beforeAfterPosition

   // markLoading callback:
   - status → "loading"
   - error → undefined

   // markSuccess callback:
   - status → "success"
   - Updates result
   - Clears error
   - Resets beforeAfterPosition → 1

   // markError callback:
   - status → "error"
   - Updates error object

   // resetFlow callback:
   - Returns to initial state

   // regenerateRequestId callback:
   - Generates new requestId
   - Keeps other state
   ```

---

### PHASE 3: UI Components (3-4 hours)

**Why Third**:
- Depends on Phase 1-2 being tested
- Component tests are more complex (mocking React Native)
- Can mock dependencies from Phase 1-2

**Files**:
1. **`SelfiePreview.tsx`** (simple image display)
   - Test: Renders Image with correct source
   - Test: Applies beforeAfterPosition opacity
   - Test: Blending logic works

2. **`ColorPalette.tsx`** (color list)
   - Test: FlatList renders all 10 colors
   - Test: onPress calls callback with color
   - Test: Visual feedback on selection

3. **`SliderControl.tsx`** (intensity slider)
   - Test: Drag updates value
   - Test: Value snaps to INTENSITY_STEP
   - Test: Min/max clamping works

4. **`media.ts`** (image picker integration)
   - Test: captureFromCamera calls launchCamera
   - Test: pickFromLibrary calls launchImageLibrary
   - Test: Error handling (cancelled, permission denied)

5. **`selfieStore.ts`** (Zustand store)
   - Test: setSelfie updates state
   - Test: clear() resets all fields
   - Test: Error state management

6. **`CaptureScreen.tsx`** (integration)
   - Test: Renders all child components
   - Test: Button clicks trigger correct flows
   - Test: State syncing between useTryOnState and selfieStore
   - Test: Loading/error UI states

7. **`share.ts`** & **`cta.ts`** (platform integration)
   - Test: Share API called with correct payload
   - Test: WhatsApp URL generated correctly
   - Test: Fallback behavior (Share unavailable)

---

## Realistic Timeline

| Phase | Files | Effort | Total |
|---|---|---|---|
| **1. API** | 2 | 2-3h | 2-3h |
| **2. Foundation** | 4 | 1-2h | 3-5h |
| **3. UI Components** | 7 | 3-4h | 6-9h |
| **Buffer/Polish** | - | 1h | 7-10h |
| **TOTAL** | **13** | - | **7-10h** |

**Faster than expected** (originally 15-20h) because code is simpler ✅

---

## Test Organization

```
__tests__/
├── setup.ts                    (mocks, utilities)
├── api/
│   ├── client.test.ts          (NEW - fetchWithTimeout)
│   └── tryOnApi.test.ts        (NEW - performTryOn)
├── utils/
│   ├── number.test.ts          (NEW - clamp, roundToStep)
│   ├── palette.test.ts         (EXISTS - extend)
│   └── request.test.ts         (NEW - buildTryOnPayload)
├── hooks/
│   └── useTryOnState.test.ts   (EXISTS - extend)
├── store/
│   └── selfieStore.test.ts     (EXISTS - extend)
├── components/
│   ├── SelfiePreview.test.tsx  (NEW)
│   ├── ColorPalette.test.tsx   (NEW)
│   └── SliderControl.test.tsx  (NEW)
├── screens/
│   └── CaptureScreen.test.tsx  (NEW)
├── services/
│   ├── media.test.ts           (NEW)
│   └── tryOnService.test.ts    (NEW)
├── utils/
│   ├── share.test.ts           (NEW)
│   └── cta.test.ts             (NEW)
└── fixtures/
    ├── mockResponses.ts
    └── testData.ts
```

---

## Implementation Approach

### TDD (Test-First)
1. Write test (RED)
2. Run test → fails
3. Write minimum code to pass (GREEN)
4. Refactor if needed (REFACTOR)
5. Move to next test

### Mocking Strategy
- **HTTP**: Mock fetch via jest.mock()
- **React Native**: Use existing mocks from `__mocks__/`
- **State**: Test callbacks directly, not integration
- **Components**: Use react-test-renderer + snapshot tests

### Coverage Gates
- Each test file aims for 100% of that module
- Overall target: 90%+ statements
- Branch coverage: 75%+ (for error paths)

---

## What Can Go Wrong (Mitigation)

| Risk | Likelihood | Mitigation |
|---|---|---|
| AbortController timeout test unreliable | MEDIUM | Use jest.useFakeTimers() to control time |
| Network error mocking incomplete | MEDIUM | Create comprehensive mock fetch module |
| State updates not batched correctly | LOW | Test state transitions in sequence |
| Component rendering depends on native modules | MEDIUM | Already mocked in __mocks__/ |

---

## Success Criteria

✅ All tests pass (40+ test cases)
✅ Coverage reaches 90% statements
✅ No console errors/warnings in test output
✅ Tests run in < 5 seconds total
✅ No flaky tests (deterministic results)

---

## Ready to Start

This plan is now **based on actual code**, not assumptions.

### Approve implementation of Phase 1?

**Phase 1 Plan** (2-3 hours):
- [ ] Write tests for `api/client.ts` (fetchWithTimeout)
- [ ] Write tests for `api/tryOnApi.ts` (performTryOn)
- [ ] Create HTTP mocking strategy
- [ ] Verify timeout handling works correctly
- [ ] Verify response mapping works correctly

**Approval needed on**:
1. ✅ Test approach (write test → implement → verify)
2. ✅ Mocking strategy (jest.mock fetch)
3. ✅ Test cases (4 for client, 3 for tryOnApi)
4. ✅ Timeline (2-3 hours for Phase 1)

**Proceed?** 🚀
