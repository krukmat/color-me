# Coverage Improvement Plan for apps/mobile

**Date**: 2025-12-20
**Current Coverage**: 44.91% statements (Target: 90%)
**Tests Passing**: 40/40 (App tests only)
**Gap**: ~45% coverage improvement needed

---

## Executive Summary

Currently, `apps/mobile` has **44.91% statement coverage**, falling **45%** short of the 90% target. The coverage audit reveals:

- **5 files at 100%** (already excellent)
- **7 files with <50% coverage** (major gaps requiring work)
- **1 major component (CaptureScreen) at 34.84%** (highest priority due to complexity)

---

## Current Coverage Breakdown

| Category | Files | Statements | Status | Priority |
|----------|-------|-----------|--------|----------|
| Store | 1 | 100% | ✅ Ready | - |
| Utils (core) | 2 | 100% | ✅ Ready | - |
| Components | 3 | 56.09% avg | ⚠️ Medium | HIGH |
| State | 1 | 55.88% | ⚠️ Medium | MEDIUM |
| Screens | 1 | 34.84% | ❌ Low | CRITICAL |
| Services/API | 4 | ~10% avg | ❌ Very Low | HIGH |
| Utils (platform) | 3 | 36.8% avg | ❌ Low | MEDIUM |

---

## Detailed Coverage By File

### 🟢 100% Coverage (Ready)
```
✅ store/selfieStore.ts         100% (100/100) → No changes needed
✅ utils/palette.ts             100% (100/100) → No changes needed
✅ utils/request.ts             100% (100/100) → No changes needed
```

### 🟡 High Coverage (Near Complete - <5% gap)
```
🔶 components/ColorPalette.tsx   87.5% (35/40 statements)
   → Missing: 1 line (line 41)
   → Estimated effort: LOW

🔶 utils/number.ts               80% (4/5 statements)
   → Missing: 2-9 range check paths
   → Estimated effort: LOW
```

### 🟠 Medium Coverage (Requires Work)
```
🟠 components/SelfiePreview.tsx  55.55% (10/18 statements)
   → Missing: 4 lines (16, 38-41) - blend/overlay logic
   → Estimated effort: MEDIUM

🟠 state/useTryOnState.ts        55.88% (19/34 statements)
   → Missing: 8 lines (78, 85, 92, 99, 107, 117, 125, 129)
   → Estimated effort: MEDIUM

🟠 components/SliderControl.tsx  45.83% (11/24 statements)
   → Missing: 6 lines (38, 43-46, 54-65) - PanResponder handlers
   → Estimated effort: MEDIUM
```

### 🔴 Low Coverage (Requires Significant Work)
```
🔴 screens/CaptureScreen.tsx     34.84% (33/94 statements)
   → Missing: 61 lines (27-28, 55-66, 73-87, 94, 98, 103, 112-139, 154, 157, 160)
   → Estimated effort: HIGH (largest screen, complex state)

🔴 services/media.ts             25% (1/4 statements)
   → Missing: 5 lines (25-26, 37-42, 46-51)
   → Estimated effort: MEDIUM

🔴 utils/cta.ts                  10% (1/10 statements)
   → Missing: 15 lines (15-30)
   → Estimated effort: LOW (pure utility, simple logic)

🔴 services/api/tryOnApi.ts      9.09% (1/11 statements)
   → Missing: 10 lines (14-42) - HTTP logic
   → Estimated effort: MEDIUM
```

### 🔴 Zero Coverage (Requires Tests)
```
🔴 services/api/client.ts        0% (0/6 statements)
   → Missing: 6 lines (15-30) - fetchWithTimeout
   → Estimated effort: LOW (pure utility, testable)

🔴 services/tryOnService.ts      0% (0/3 statements)
   → Missing: 3 lines - Simple re-export, low priority
   → Estimated effort: LOW

🔴 utils/share.ts                0% (0/21 statements)
   → Missing: 21 lines (17-38) - Share API wrapper
   → Estimated effort: MEDIUM
```

---

## Implementation Plan (Prioritized by Impact)

### Phase 1: Quick Wins (Low effort, quick coverage gains) - ~1-2h
**Goal**: Add 8-10% coverage

1. **utils/number.ts** (80% → 100%)
   - Tests needed: Boundary conditions for `clamp()` and `roundToStep()`
   - Files to create: `__tests__/number.test.ts` or extend existing utils test
   - Impact: ~1%

2. **components/ColorPalette.tsx** (87.5% → 100%)
   - Tests needed: Cover line 41 (likely onColorSelect callback path)
   - Update: `__tests__/ColorPalette.test.tsx` (if exists) or create new
   - Impact: ~2%

3. **utils/cta.ts** (10% → 100%)
   - Tests needed: WhatsApp linking with different text/number scenarios
   - Mocking: Use existing Linking mock from `__mocks__/Linking.js`
   - Files to create: `__tests__/cta.test.ts`
   - Impact: ~3%

4. **services/api/client.ts** (0% → 100%)
   - Tests needed: fetchWithTimeout timeout, success, error paths
   - Mocking: HTTP fetch mock
   - Files to create: `__tests__/client.test.ts`
   - Impact: ~2%

**Subtotal after Phase 1**: 44.91% → ~54.91% (10% gain)

---

### Phase 2: Medium Effort (Important features) - ~3-4h
**Goal**: Add 15-20% coverage

5. **services/api/tryOnApi.ts** (9.09% → 100%)
   - Tests needed: performTryOn with success/error/timeout cases
   - Mocking: fetchWithTimeout via mock
   - Files to create: `__tests__/tryOnApi.test.ts`
   - Impact: ~5%

6. **services/media.ts** (25% → 100%)
   - Tests needed: launchCamera, launchImageLibrary cancel/success scenarios
   - Mocking: react-native-image-picker (already has mock)
   - Update: Create `__tests__/media.test.ts`
   - Impact: ~3%

7. **utils/share.ts** (0% → 100%)
   - Tests needed: Share API success/error cases, different content types
   - Mocking: Share mock from `__mocks__/Share.js`
   - Files to create: `__tests__/share.test.ts`
   - Impact: ~5%

8. **state/useTryOnState.ts** (55.88% → 100%)
   - Tests needed: All useState/useCallback hooks interactions
   - Focus: Lines 78, 85, 92, 99, 107, 117, 125, 129
   - Update: Extend `__tests__/useTryOnState.test.ts`
   - Impact: ~5%

**Subtotal after Phase 2**: ~54.91% → ~74.91% (20% gain)

---

### Phase 3: Component Testing (Complex UI) - ~4-5h
**Goal**: Add 10-15% coverage

9. **components/SelfiePreview.tsx** (55.55% → 100%)
   - Tests needed: Image rendering, overlay calculations, blend effects
   - Focus: Lines 16, 38-41 (blend/overlay logic)
   - Mocking: Image, View components via react-test-renderer
   - Files to create: `__tests__/SelfiePreview.test.tsx`
   - Impact: ~4%

10. **components/SliderControl.tsx** (45.83% → 100%)
    - Tests needed: PanResponder handlers, value updates, touch interactions
    - Focus: Lines 38, 43-46, 54-65 (gesture handlers)
    - Mocking: PanResponder via jest mocks
    - Update: Create `__tests__/SliderControl.test.tsx`
    - Impact: ~5%

11. **screens/CaptureScreen.tsx** (34.84% → 100%)
    - Tests needed: State management, button clicks, camera/library flows
    - Focus: Lines 27-28, 55-66, 73-87, 94, 98, 103, 112-139, 154, 157, 160
    - Mocking: Navigation, media service, tryOn API
    - Strategy: Break into smaller sub-components first for easier testing
    - Impact: ~8%

**Subtotal after Phase 3**: ~74.91% → ~89.91% (15% gain)

---

### Phase 4: Final Push to 90%+ - ~1h
**Goal**: Final 1%+ coverage

12. **Edge cases and branch coverage improvements**
    - Add missing branch coverage in:
      - components/ColorPalette.tsx (branch coverage: 100%)
      - state/useTryOnState.ts (branch coverage: 100%)
    - Integration test scenarios
    - Impact: ~2%

**Final Target**: 90%+ coverage

---

## Implementation Strategy

### Test Organization
```
__tests__/
  ├── setup.ts                          ✓ (Already created)
  ├── App.test.tsx                      ✓ (Exists, 1 test)
  ├── palette.test.ts                   ✓ (Exists, 100% coverage)
  ├── request.test.ts (rename from requestSerializer)
  ├── selfieStore.test.ts               ✓ (Exists, 100% coverage)
  ├── useTryOnState.test.ts             ✓ (Exists, extend)
  ├── number.test.ts                    → NEW (Phase 1)
  ├── ColorPalette.test.tsx             → NEW (Phase 1)
  ├── cta.test.ts                       → NEW (Phase 1)
  ├── client.test.ts                    → NEW (Phase 1)
  ├── tryOnApi.test.ts                  → NEW (Phase 2)
  ├── media.test.ts                     → NEW (Phase 2)
  ├── share.test.ts                     → NEW (Phase 2)
  ├── SelfiePreview.test.tsx            → NEW (Phase 3)
  ├── SliderControl.test.tsx            → NEW (Phase 3)
  ├── CaptureScreen.test.tsx            → NEW (Phase 3)
  └── fixtures/                         → Test data
      ├── selfieData.ts
      └── payloads.ts
```

### TDD Approach (per project CLAUDE.md)
For each file to test:
1. **Write tests first** (RED phase) - Define expected behavior
2. **Run tests** - Verify they fail
3. **Implement minimum code** to make tests pass (GREEN phase)
4. **Refactor if needed** (REFACTOR phase)
5. **Verify coverage** threshold met

### Mocking Strategy
**Already available**:
- `__mocks__/react-native-image-picker.js` ✓
- `__mocks__/Linking.js` ✓
- `__mocks__/Share.js` ✓
- `__mocks__/react-native-config.js` ✓

**New mocks needed**:
- HTTP fetch mock (for client.ts, tryOnApi.ts)
- Image component mock (for SelfiePreview.tsx)
- Navigation mock (for CaptureScreen.tsx)

### Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| CaptureScreen.tsx complexity | HIGH | Break into sub-components before testing, test state separately |
| Navigation mocking | MEDIUM | Use jest.mock() with custom navigation stack mock |
| Gesture handler testing | MEDIUM | Use react-native-gesture-handler mocks for PanResponder |
| Time constraints | MEDIUM | Prioritize Phase 1 & 2 first, Phase 3 can be split across sprints |

---

## Success Criteria

✅ **Phase 1 Complete**: 54.91% coverage (App tests + quick wins)
✅ **Phase 2 Complete**: 74.91% coverage (Services layer complete)
✅ **Phase 3 Complete**: 89.91% coverage (Components & screens mostly done)
✅ **Phase 4 Complete**: 90%+ coverage (Edge cases & branch coverage)
✅ **No broken tests** in pre-commit hook
✅ **All files have at least 1 test**
✅ **Branch coverage >= 75%** for critical paths

---

## Commands Reference

```bash
# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests for a specific file
npm test -- palette.test.ts

# Update snapshots
npm test -- -u

# Check coverage per file
npm test -- --coverage --verbose
```

---

## Timeline Estimate

| Phase | Files | Effort | Dependencies |
|-------|-------|--------|--------------|
| Phase 1 | 4 files | 1-2h | None |
| Phase 2 | 4 files | 3-4h | Phase 1 |
| Phase 3 | 3 files | 4-5h | Phase 1 & 2 |
| Phase 4 | Polish | 1h | Phase 1-3 |
| **TOTAL** | **11 new tests** | **9-12h** | Sequential |

---

## Files to Create/Modify

### Create (New test files)
- `__tests__/number.test.ts`
- `__tests__/ColorPalette.test.tsx`
- `__tests__/cta.test.ts`
- `__tests__/client.test.ts`
- `__tests__/tryOnApi.test.ts`
- `__tests__/media.test.ts`
- `__tests__/share.test.ts`
- `__tests__/SelfiePreview.test.tsx`
- `__tests__/SliderControl.test.tsx`
- `__tests__/CaptureScreen.test.tsx`
- `__tests__/fixtures/` (test utilities)

### Modify (Existing test files)
- `__tests__/useTryOnState.test.ts` (expand coverage)
- `jest.config.js` (lower initial threshold to 50% during development)

### Configuration
- `jest.config.js`: Adjust `coverageThreshold` as phases complete

---

## Approval Checklist

**Before starting implementation, please review and approve:**

- [ ] Phase 1 quick wins approach (4 files, ~1-2h)
- [ ] Phase 2 services testing (4 files, ~3-4h)
- [ ] Phase 3 component testing (3 files, ~4-5h)
- [ ] TDD approach: Test first, implement, verify
- [ ] Mocking strategy (use existing mocks + minimal new ones)
- [ ] Timeline: 9-12h total development time
- [ ] Success criteria: 90%+ coverage + all tests passing
- [ ] Ready to proceed with Phase 1 implementation

**Questions/Changes needed?** Document them below before implementation starts.

---

*This plan follows the project's CLAUDE.md requirements: TDD approach, no unnecessary mocks, documentation before implementation, and structured rollout.*
