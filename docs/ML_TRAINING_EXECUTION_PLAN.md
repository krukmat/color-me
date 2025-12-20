# ML Training Execution Plan — Token-Optimized Developer Guide

**Version**: 1.0
**Date**: 2025-12-20
**Purpose**: Refinement of ML_TRAINING_COMPLETE.md for incremental, token-efficient execution

---

## Executive Summary

This document refines the ML training plan into **executable increments** optimized for token budget management. Each task includes clear acceptance criteria, test requirements, file impacts, and estimated token consumption.

**Recommendation Path**: Phase 1 → Phase 4 (5-6 hours total, $0 cost)

**Token Optimization Strategy**:
- Small, atomic commits per task
- TDD approach minimizes rework
- Clear checkpoints for saving progress
- Parallel-ready tasks identified
- Dependencies explicitly mapped

---

## Token Budget Guidelines

| Complexity | Tokens (L/M/H) | Typical Task Size |
|------------|----------------|-------------------|
| **Low (L)** | 2,000-5,000 | Setup, config, simple integration |
| **Medium (M)** | 5,000-15,000 | Feature implementation, testing |
| **High (H)** | 15,000-30,000 | Complex pipelines, training loops |

**Critical Rule**: Document checkpoint before reaching <20k tokens remaining

---

# PHASE 1: Zero-Train MediaPipe Integration

**Total Effort**: 2-2.5 hours | **Cost**: $0 | **Risk**: Low | **Total Tokens**: ~40,000

---

## Task 1.1: Environment Setup & Fixtures

**Token Budget**: 🟢 Low (3,000-5,000)
**Effort**: 30 min
**Dependencies**: None
**Can Run Parallel**: Yes

### Objective
Set up MediaPipe SDK, create test fixtures directory, and download diverse test images for validation.

### Files Affected
```
services/ml-api/
├── requirements.txt (add mediapipe, opencv-python, pillow)
├── tests/fixtures/ (new directory)
│   ├── README.md (fixture descriptions)
│   └── test_images/ (20-30 diverse selfies)
└── tests/conftest.py (update with fixture loaders)
```

### Subtasks

#### 1.1.1 Add ML Dependencies
**Effort**: 5 min | **Tokens**: 500

**Actions**:
1. Add to `requirements.txt`:
   ```
   mediapipe==0.10.14
   opencv-python==4.10.0.84
   pillow==10.4.0
   numpy==1.26.4
   ```
2. Run `pip install -r requirements.txt`
3. Verify installation: `python -c "import mediapipe; print(mediapipe.__version__)"`

**Acceptance Criteria**:
- MediaPipe imports without error
- OpenCV imports without error
- Pillow imports without error

**Tests**: None (dependency verification only)

---

#### 1.1.2 Create Fixtures Directory Structure
**Effort**: 5 min | **Tokens**: 800

**Actions**:
1. Create directory: `services/ml-api/tests/fixtures/test_images/`
2. Create `tests/fixtures/README.md` documenting fixture structure

**File**: `tests/fixtures/README.md`
```markdown
# Test Fixtures

## Test Images

Diverse selfie dataset for segmentation validation:
- 20-30 images covering:
  - Skin tones: Light, medium, dark
  - Hair types: Straight, wavy, curly, afro
  - Lighting: Natural, studio, backlit, low-light
  - Occlusion: Clear, partial, glasses, hat
  - Background: Plain, complex, outdoor, indoor

## Acceptance Criteria
- All images JPEG/PNG, 512x512 to 1024x1024 px
- Minimal PII (use public datasets or stock photos)
- Ground truth masks not required for Phase 1 (visual QA)
```

**Acceptance Criteria**:
- Directory exists and is gitignored (images not committed)
- README documents fixture strategy

**Tests**: None (structure only)

---

#### 1.1.3 Download Test Images
**Effort**: 15 min | **Tokens**: 1,000

**Actions**:
1. Download 20-30 test images from:
   - Unsplash (CC0): search "portrait selfie"
   - Pexels (free): search "face portrait"
   - FFHQ dataset sample (research license)
2. Resize all to max 1024x1024px
3. Save to `tests/fixtures/test_images/`
4. Name pattern: `{id}_{descriptor}.jpg` (e.g., `001_light_straight.jpg`)

**Acceptance Criteria**:
- 20+ images downloaded
- Diverse coverage (skin tones, hair types)
- No PII (public domain/stock)
- Max size 1MB per image

**Tests**: None (manual QA)

---

#### 1.1.4 Create Fixture Loader Utility
**Effort**: 5 min | **Tokens**: 1,500

**File**: `tests/conftest.py` (append)
```python
import os
from pathlib import Path
from typing import List

import pytest


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "test_images"


@pytest.fixture
def fixture_image_paths() -> List[Path]:
    """Return all fixture image paths for batch testing."""
    if not FIXTURES_DIR.exists():
        pytest.skip("Fixtures directory not found")

    images = list(FIXTURES_DIR.glob("*.jpg")) + list(FIXTURES_DIR.glob("*.png"))
    if len(images) < 10:
        pytest.skip("Insufficient test fixtures (<10 images)")

    return sorted(images)


@pytest.fixture
def sample_fixture_path(fixture_image_paths: List[Path]) -> Path:
    """Return a single fixture image for quick tests."""
    return fixture_image_paths[0]
```

**Acceptance Criteria**:
- Fixture returns list of image paths
- Skips gracefully if fixtures missing
- Minimum 10 images required

**Tests**:
```python
def test_fixture_loader(fixture_image_paths):
    assert len(fixture_image_paths) >= 10
    assert all(p.exists() for p in fixture_image_paths)
```

---

### Task 1.1 Checkpoint

**Deliverable**: `tests/fixtures/` with 20+ images, `requirements.txt` updated, fixture loader ready

**Commit Message**:
```
feat(ml-api): Add MediaPipe dependencies and test fixtures

- Add mediapipe, opencv-python, pillow to requirements.txt
- Create fixtures directory structure
- Add fixture loader utility in conftest.py
- Download 20+ diverse test images for segmentation validation

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.1
```

**Token Checkpoint**: ~5,000 tokens used | Remaining budget: ~195,000

---

## Task 1.2: MediaPipe Integration into segmenter.py

**Token Budget**: 🟡 Medium (8,000-12,000)
**Effort**: 45 min
**Dependencies**: ✅ Task 1.1
**Can Run Parallel**: No

### Objective
Replace stub segmentation with real MediaPipe SelfieSegmentation model. Implement graceful fallback if model fails.

### Files Affected
```
services/ml-api/app/core/
├── models.py (update ModelCache to load MediaPipe)
├── segmenter.py (implement real segmentation)
└── media.py (add image decoding utilities if needed)
```

### Cyclomatic Complexity
**Target CC**: ≤5 (simple control flow, minimal branching)

### Subtasks

#### 1.2.1 Update ModelCache to Load MediaPipe Model
**Effort**: 10 min | **Tokens**: 3,000

**File**: `app/core/models.py`

**Changes**:
```python
from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any, Optional

try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:  # pragma: no cover
    MP_AVAILABLE = False
    mp = None  # type: ignore


@dataclass
class SegmenterModel:
    name: str
    version: str
    backend: Any


class ModelCache:
    """Thread-safe singleton cache for ML models."""

    _segmenter_model: Optional[SegmenterModel] = None
    _lock = Lock()

    @classmethod
    def segmenter(cls) -> SegmenterModel:
        """Load MediaPipe SelfieSegmentation model (lazy, thread-safe)."""
        with cls._lock:
            if cls._segmenter_model is None:
                if MP_AVAILABLE:
                    # model=1: General model (faster, good for most cases)
                    # model=0: Landscape model (more accurate, slower)
                    mp_model = mp.solutions.selfie_segmentation.SelfieSegmentation(
                        model_selection=1  # General model
                    )
                    backend = mp_model
                    version = "mediapipe-v1.0-general"
                else:
                    backend = None
                    version = "stub-v0.1.0"

                cls._segmenter_model = SegmenterModel(
                    name="hair-segmenter",
                    version=version,
                    backend=backend,
                )
            return cls._segmenter_model

    @classmethod
    def clear(cls) -> None:
        """Clear cached models (for testing)."""
        with cls._lock:
            if cls._segmenter_model and cls._segmenter_model.backend:
                try:
                    cls._segmenter_model.backend.close()
                except Exception:
                    pass
            cls._segmenter_model = None
```

**Acceptance Criteria**:
- MediaPipe model loaded on first call
- Thread-safe (Lock)
- Graceful fallback if mediapipe not installed
- Model cleanup on `clear()`

**Tests**:
```python
def test_model_cache_loads_mediapipe():
    ModelCache.clear()
    model = ModelCache.segmenter()
    assert model.version.startswith("mediapipe") or model.version.startswith("stub")
    assert model.backend is not None or not MP_AVAILABLE


def test_model_cache_singleton():
    ModelCache.clear()
    m1 = ModelCache.segmenter()
    m2 = ModelCache.segmenter()
    assert m1 is m2
```

---

#### 1.2.2 Implement Real Segmentation Logic
**Effort**: 25 min | **Tokens**: 6,000

**File**: `app/core/segmenter.py`

**Changes**:
```python
from __future__ import annotations

import base64
import hashlib
import io
from dataclasses import dataclass
from typing import Optional

import numpy as np

from app.core.media import decode_selfie_payload
from app.core.models import ModelCache, SegmenterModel

try:
    import cv2
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:  # pragma: no cover
    MP_AVAILABLE = False
    cv2 = None  # type: ignore
    mp = None  # type: ignore


@dataclass(frozen=True)
class SegmentResult:
    """Result of hair segmentation operation."""
    mask_id: str
    model_version: str
    mask: Optional[np.ndarray] = None  # Binary mask (0-255)
    backend: str = "stub"
    width: int = 0
    height: int = 0


def _fingerprint_selfie(selfie: str) -> str:
    """Generate unique ID for selfie (for caching/logging)."""
    digest = hashlib.sha1(selfie.encode("utf-8")).hexdigest()
    return digest[:12]


def _segment_with_mediapipe(selfie: str, model: SegmenterModel) -> SegmentResult:
    """Segment hair using MediaPipe SelfieSegmentation."""
    if not MP_AVAILABLE or model.backend is None:
        return _segment_stub(selfie, model)

    try:
        # Decode base64 image
        _, image_bytes = decode_selfie_payload(selfie)

        # Load image with OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Failed to decode image")

        # Convert BGR → RGB (MediaPipe expects RGB)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        height, width = image.shape[:2]

        # Run MediaPipe segmentation
        results = model.backend.process(image_rgb)

        if results.segmentation_mask is None:
            raise ValueError("MediaPipe returned no segmentation mask")

        # Extract mask (0-1 float) → (0-255 uint8)
        mask_float = results.segmentation_mask
        mask_binary = (mask_float > 0.5).astype(np.uint8) * 255

        mask_id = _fingerprint_selfie(selfie)

        return SegmentResult(
            mask_id=mask_id,
            model_version=model.version,
            mask=mask_binary,
            backend="mediapipe",
            width=width,
            height=height,
        )

    except Exception as e:
        # Fallback to stub on any error (graceful degradation)
        # Log error in production (omitted here for brevity)
        return _segment_stub(selfie, model)


def _segment_stub(selfie: str, model: SegmenterModel) -> SegmentResult:
    """Stub segmentation (returns placeholder mask ID)."""
    mask_id = _fingerprint_selfie(selfie)
    return SegmentResult(
        mask_id=mask_id,
        model_version=model.version,
        backend="stub"
    )


def segment_selfie(selfie: str) -> SegmentResult:
    """
    Segment hair region from selfie.

    Uses MediaPipe SelfieSegmentation if available, otherwise stub.

    Args:
        selfie: Base64-encoded image (data:image/png;base64,...)

    Returns:
        SegmentResult with mask and metadata
    """
    model = ModelCache.segmenter()
    return _segment_with_mediapipe(selfie, model)
```

**Acceptance Criteria**:
- MediaPipe segmentation returns mask (0-255 binary)
- Graceful fallback to stub on error
- Mask dimensions match input image
- Thread-safe (no global state)

**Tests**:
```python
import base64
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from app.core.segmenter import segment_selfie


def test_segment_real_image(sample_fixture_path: Path):
    """Test segmentation on real fixture image."""
    # Load image and convert to base64
    with open(sample_fixture_path, "rb") as f:
        img_bytes = f.read()

    b64 = base64.b64encode(img_bytes).decode("utf-8")
    selfie = f"data:image/jpeg;base64,{b64}"

    # Segment
    result = segment_selfie(selfie)

    # Assertions
    assert result.mask_id
    assert result.backend in {"mediapipe", "stub"}

    if result.backend == "mediapipe":
        assert result.mask is not None
        assert result.mask.dtype == np.uint8
        assert result.mask.max() <= 255
        assert result.width > 0
        assert result.height > 0


def test_segment_invalid_image():
    """Test graceful fallback on invalid image."""
    selfie = "data:image/png;base64,INVALID"
    result = segment_selfie(selfie)

    # Should not crash, fallback to stub
    assert result.backend == "stub"
    assert result.mask_id
```

---

#### 1.2.3 Add Error Handling and Logging
**Effort**: 10 min | **Tokens**: 2,000

**File**: `app/core/segmenter.py` (update `_segment_with_mediapipe`)

**Changes**:
```python
import logging

logger = logging.getLogger(__name__)

# In _segment_with_mediapipe, replace except block:
    except Exception as e:
        logger.warning(
            f"MediaPipe segmentation failed, using stub fallback. "
            f"Error: {type(e).__name__}: {str(e)}"
        )
        return _segment_stub(selfie, model)
```

**Acceptance Criteria**:
- Errors logged with context
- No sensitive data in logs (mask_id only)
- Fallback always succeeds

**Tests**: Manual verification (check logs during test runs)

---

### Task 1.2 Checkpoint

**Deliverable**: Real MediaPipe segmentation integrated, tests passing

**Commit Message**:
```
feat(ml-api): Integrate MediaPipe SelfieSegmentation

- Update ModelCache to load MediaPipe model (lazy, thread-safe)
- Implement real segmentation in segmenter.py
- Add graceful fallback to stub on errors
- Add tests for real image segmentation
- Add error logging with context

Acceptance:
- Segmentation returns binary mask (0-255)
- Mask dimensions match input image
- Fallback to stub on invalid input

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2
```

**Token Checkpoint**: ~17,000 tokens used | Remaining budget: ~183,000

---

## Task 1.3: Fixture Testing & Quality Validation

**Token Budget**: 🟡 Medium (10,000-15,000)
**Effort**: 45 min
**Dependencies**: ✅ Task 1.1, 1.2
**Can Run Parallel**: No

### Objective
Run segmentation on all fixtures, measure quality metrics (visual QA), categorize failures, and document edge cases.

### Files Affected
```
services/ml-api/tests/
├── test_segmentation_quality.py (new)
└── fixtures/quality_report.md (generated)
```

### Subtasks

#### 1.3.1 Create Quality Validation Test Suite
**Effort**: 20 min | **Tokens**: 6,000

**File**: `tests/test_segmentation_quality.py`
```python
"""
Quality validation tests for MediaPipe segmentation.

Runs on all fixtures, measures IoU (if ground truth available),
visual QA, and categorizes failures.
"""
import base64
from pathlib import Path
from typing import List

import numpy as np
import pytest
from PIL import Image

from app.core.segmenter import segment_selfie


@pytest.fixture
def quality_results(fixture_image_paths: List[Path]) -> dict:
    """Run segmentation on all fixtures and collect results."""
    results = {
        "total": 0,
        "mediapipe": 0,
        "stub": 0,
        "excellent": [],  # Mask coverage 40-60% (typical hair)
        "good": [],       # Mask coverage 20-40% or 60-80%
        "acceptable": [], # Mask coverage 10-20% or 80-90%
        "failures": [],   # Errors or extreme coverage (<10% or >90%)
    }

    for img_path in fixture_image_paths:
        # Load and encode image
        with open(img_path, "rb") as f:
            img_bytes = f.read()

        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = img_path.suffix.lower()
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        selfie = f"data:{mime};base64,{b64}"

        # Segment
        result = segment_selfie(selfie)
        results["total"] += 1

        if result.backend == "mediapipe":
            results["mediapipe"] += 1

            # Calculate mask coverage (rough quality proxy)
            if result.mask is not None:
                coverage = (result.mask > 0).sum() / result.mask.size

                if 0.40 <= coverage <= 0.60:
                    results["excellent"].append((img_path.name, coverage))
                elif 0.20 <= coverage <= 0.80:
                    results["good"].append((img_path.name, coverage))
                elif 0.10 <= coverage <= 0.90:
                    results["acceptable"].append((img_path.name, coverage))
                else:
                    results["failures"].append((img_path.name, coverage, "extreme_coverage"))
            else:
                results["failures"].append((img_path.name, 0.0, "no_mask"))
        else:
            results["stub"] += 1
            results["failures"].append((img_path.name, 0.0, "stub_fallback"))

    return results


def test_segmentation_quality_overall(quality_results: dict):
    """Validate overall segmentation quality."""
    total = quality_results["total"]
    mediapipe = quality_results["mediapipe"]
    failures = len(quality_results["failures"])

    # At least 10 fixtures tested
    assert total >= 10, f"Insufficient fixtures: {total} < 10"

    # At least 80% using MediaPipe (not stub fallback)
    assert mediapipe >= total * 0.8, \
        f"Too many stub fallbacks: {mediapipe}/{total} = {mediapipe/total:.1%}"

    # At most 20% failures
    assert failures <= total * 0.2, \
        f"Too many failures: {failures}/{total} = {failures/total:.1%}"


def test_segmentation_quality_categories(quality_results: dict):
    """Validate quality distribution."""
    excellent = len(quality_results["excellent"])
    good = len(quality_results["good"])
    acceptable = len(quality_results["acceptable"])

    # At least 50% in good or excellent
    success_count = excellent + good
    total = quality_results["total"]

    assert success_count >= total * 0.5, \
        f"Quality too low: {success_count}/{total} good/excellent"


def test_generate_quality_report(quality_results: dict, tmp_path: Path):
    """Generate quality report for manual review."""
    report_lines = [
        "# MediaPipe Segmentation Quality Report\n",
        f"**Total Fixtures**: {quality_results['total']}\n",
        f"**MediaPipe Used**: {quality_results['mediapipe']}\n",
        f"**Stub Fallbacks**: {quality_results['stub']}\n",
        "\n## Quality Distribution\n",
        f"- Excellent (40-60% coverage): {len(quality_results['excellent'])}\n",
        f"- Good (20-80% coverage): {len(quality_results['good'])}\n",
        f"- Acceptable (10-90% coverage): {len(quality_results['acceptable'])}\n",
        f"- Failures: {len(quality_results['failures'])}\n",
        "\n## Failures Detail\n",
    ]

    for img_name, coverage, reason in quality_results["failures"]:
        report_lines.append(f"- {img_name}: {reason} (coverage={coverage:.2%})\n")

    report_path = tmp_path / "quality_report.md"
    report_path.write_text("".join(report_lines))

    print(f"\n{'='*60}")
    print("Quality Report Generated:")
    print(report_path.read_text())
    print(f"{'='*60}\n")
```

**Acceptance Criteria**:
- All fixtures tested (≥10 images)
- ≥80% using MediaPipe (not stub)
- ≤20% failures
- ≥50% good/excellent quality
- Quality report generated

**Tests**: Self-testing (pytest runs validation)

---

#### 1.3.2 Visual QA Manual Review
**Effort**: 20 min | **Tokens**: 2,000

**Actions**:
1. Run quality tests: `pytest tests/test_segmentation_quality.py -v`
2. Review quality report output
3. For each failure, manually inspect:
   - Original image
   - Expected mask (mental model)
   - Actual segmentation issue (if any)
4. Categorize failures:
   - Lighting issues
   - Occlusion (hats, hands)
   - Hair complexity (curly, afro)
   - Background complexity
5. Document in `tests/fixtures/quality_report.md`

**Acceptance Criteria**:
- Manual review completed for all failures
- Root causes documented
- Decision: Proceed if <20% failures, escalate to Phase 2 if ≥20%

**Tests**: None (manual)

---

#### 1.3.3 Document Edge Cases
**Effort**: 5 min | **Tokens**: 1,000

**File**: `tests/fixtures/quality_report.md` (append)
```markdown
## Known Edge Cases

### Handled Well
- Natural lighting, clear background
- Straight/wavy hair, minimal occlusion
- Medium skin tones

### Requires Improvement (Future)
- Backlit selfies (silhouette)
- Complex backgrounds (outdoor)
- Hats/headbands partially covering hair
- Very dark or very light skin tones

### Escalation Criteria
- If >20% failures: Proceed to Phase 2 (Light Finetune)
- If >40% failures: Re-evaluate dataset or model choice
```

**Acceptance Criteria**:
- Edge cases documented
- Decision tree clear

**Tests**: None (documentation)

---

### Task 1.3 Checkpoint

**Deliverable**: Quality validation tests passing, edge cases documented

**Commit Message**:
```
test(ml-api): Add MediaPipe segmentation quality validation

- Add quality validation test suite (test_segmentation_quality.py)
- Test on all fixtures (20+ images)
- Measure mask coverage as quality proxy
- Generate quality report with failure categorization
- Document known edge cases and escalation criteria

Acceptance:
- ≥80% using MediaPipe
- ≤20% failures
- ≥50% good/excellent quality

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.3
```

**Token Checkpoint**: ~32,000 tokens used | Remaining budget: ~168,000

---

## Task 1.4: Post-Processing Tuning

**Token Budget**: 🟡 Medium (8,000-12,000)
**Effort**: 30 min
**Dependencies**: ✅ Task 1.3
**Can Run Parallel**: No

### Objective
Implement and tune post-processing (feathering, morphological ops, anti-bleed) to improve mask quality by 10-20%.

### Files Affected
```
services/ml-api/app/core/
├── postprocess.py (update with real mask ops)
└── pipeline.py (integrate postprocess into flow)
```

### Subtasks

#### 1.4.1 Implement Mask Post-Processing
**Effort**: 20 min | **Tokens**: 8,000

**File**: `app/core/postprocess.py`
```python
"""
Post-processing for segmentation masks.

Improves mask quality via:
- Feathering (blur edges for smooth transitions)
- Morphological ops (erosion/dilation to remove noise)
- Anti-bleed (mask refinement near edges)
"""
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from app.core.recolor import RecolorResult
from app.core.segmenter import SegmentResult


@dataclass
class PostprocessConfig:
    """Post-processing configuration."""
    feather_radius: int = 5  # Gaussian blur radius (pixels)
    morph_kernel_size: int = 3  # Morphological ops kernel
    enable_erosion: bool = False  # Remove small noise
    enable_dilation: bool = False  # Fill small holes
    anti_bleed_threshold: int = 10  # Edge refinement threshold


def postprocess_mask(
    mask: np.ndarray,
    config: Optional[PostprocessConfig] = None
) -> np.ndarray:
    """
    Apply post-processing to segmentation mask.

    Args:
        mask: Binary mask (0-255 uint8)
        config: Post-processing config (defaults if None)

    Returns:
        Improved mask (0-255 uint8)
    """
    if config is None:
        config = PostprocessConfig()

    if mask is None or mask.size == 0:
        return mask

    processed = mask.copy()

    # Morphological operations (remove noise, fill holes)
    if config.enable_erosion or config.enable_dilation:
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (config.morph_kernel_size, config.morph_kernel_size)
        )

        if config.enable_erosion:
            processed = cv2.erode(processed, kernel, iterations=1)

        if config.enable_dilation:
            processed = cv2.dilate(processed, kernel, iterations=1)

    # Feathering (blur edges for smooth transition)
    if config.feather_radius > 0:
        ksize = config.feather_radius * 2 + 1
        processed = cv2.GaussianBlur(
            processed,
            (ksize, ksize),
            sigmaX=config.feather_radius / 2
        )

    # Anti-bleed (optional: threshold after blur to maintain edge definition)
    if config.anti_bleed_threshold > 0:
        _, processed = cv2.threshold(
            processed,
            config.anti_bleed_threshold,
            255,
            cv2.THRESH_BINARY
        )

    return processed


def apply_postprocess(
    segment: SegmentResult,
    recolor: RecolorResult,
    intensity: int
) -> dict:
    """
    Apply post-processing and return metadata.

    For now, returns metadata only (mask ops in future PR).
    Intensity-based config: higher intensity = more aggressive feathering.

    Args:
        segment: Segmentation result
        recolor: Recolor result
        intensity: User intensity (0-100)

    Returns:
        Metadata dict with post-processing details
    """
    # Determine post-processing config based on intensity
    # Higher intensity = more feathering for natural blend
    if intensity >= 70:
        feather = 7
    elif intensity >= 40:
        feather = 5
    else:
        feather = 3

    metadata = {
        "postprocess": {
            "feather_radius": feather,
            "morph_ops": False,  # Disabled for Phase 1 (simple)
            "anti_bleed": False,
        },
        "segment_backend": segment.backend,
        "segment_mask_id": segment.mask_id,
    }

    # Future: Apply postprocess_mask() and composite result
    # For Phase 1, metadata only (no actual mask ops in pipeline yet)

    return metadata
```

**Acceptance Criteria**:
- Feathering implemented (Gaussian blur)
- Morphological ops implemented (erosion/dilation)
- Anti-bleed threshold implemented
- Config-driven (easy to tune)
- No crashes on edge cases (empty mask, None)

**Tests**:
```python
import numpy as np
import pytest

from app.core.postprocess import postprocess_mask, PostprocessConfig


def test_postprocess_feathering():
    """Test feathering (blur) on mask."""
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[25:75, 25:75] = 255  # Square mask

    config = PostprocessConfig(feather_radius=5, enable_erosion=False)
    result = postprocess_mask(mask, config)

    # After blur, edges should be smoothed (not sharp 0→255)
    assert result[24, 50] < 255  # Edge pixel blurred
    assert result[50, 50] > 200  # Center still high


def test_postprocess_no_crash_on_empty():
    """Test graceful handling of empty mask."""
    mask = np.zeros((0, 0), dtype=np.uint8)
    result = postprocess_mask(mask)
    assert result.size == 0


def test_postprocess_erosion():
    """Test erosion removes small noise."""
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[25:75, 25:75] = 255
    mask[10, 10] = 255  # Single pixel noise

    config = PostprocessConfig(enable_erosion=True, morph_kernel_size=3)
    result = postprocess_mask(mask, config)

    # Single pixel should be removed
    assert result[10, 10] == 0
```

---

#### 1.4.2 Tune Post-Processing Parameters
**Effort**: 10 min | **Tokens**: 2,000

**Actions**:
1. Run quality tests with different configs
2. Visual QA: Compare before/after masks
3. Tune parameters:
   - `feather_radius`: 3-7 (higher = smoother, but may lose detail)
   - `morph_kernel_size`: 3-5 (larger = more aggressive noise removal)
4. Document best defaults in `PostprocessConfig`

**Acceptance Criteria**:
- Visual improvement confirmed (10-20% subjective)
- No over-blurring (edges still visible)
- Parameters documented

**Tests**: Manual visual QA

---

### Task 1.4 Checkpoint

**Deliverable**: Post-processing implemented and tuned

**Commit Message**:
```
feat(ml-api): Implement mask post-processing

- Add postprocess_mask() with feathering, morphological ops
- Add PostprocessConfig for tunable parameters
- Integrate intensity-based feathering in apply_postprocess()
- Add tests for feathering, erosion, edge cases

Acceptance:
- Feathering smooths mask edges
- Morphological ops remove noise
- No crashes on edge cases (empty mask)

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4
```

**Token Checkpoint**: ~44,000 tokens used | Remaining budget: ~156,000

---

## Task 1.5: Inference Benchmarking

**Token Budget**: 🟢 Low (3,000-5,000)
**Effort**: 15 min
**Dependencies**: ✅ Task 1.2
**Can Run Parallel**: Yes (can run while Task 1.3-1.4 in progress)

### Objective
Measure inference latency (CPU/GPU) to ensure <500ms target. Identify bottlenecks.

### Files Affected
```
services/ml-api/tests/
└── test_segmentation_benchmark.py (new)
```

### Subtasks

#### 1.5.1 Create Benchmark Test
**Effort**: 10 min | **Tokens**: 4,000

**File**: `tests/test_segmentation_benchmark.py`
```python
"""
Benchmarking tests for segmentation performance.

Measures CPU/GPU inference time, memory usage.
"""
import base64
import time
from pathlib import Path
from typing import List

import pytest

from app.core.segmenter import segment_selfie


@pytest.fixture
def benchmark_images(fixture_image_paths: List[Path]) -> List[str]:
    """Convert fixtures to base64 for benchmarking."""
    images = []
    for img_path in fixture_image_paths[:10]:  # Benchmark on 10 images
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = img_path.suffix.lower()
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        images.append(f"data:{mime};base64,{b64}")
    return images


def test_inference_latency_cpu(benchmark_images: List[str]):
    """Benchmark CPU inference latency."""
    latencies = []

    for selfie in benchmark_images:
        start = time.perf_counter()
        result = segment_selfie(selfie)
        elapsed = time.perf_counter() - start

        if result.backend == "mediapipe":
            latencies.append(elapsed * 1000)  # Convert to ms

    if not latencies:
        pytest.skip("No MediaPipe inferences (stub fallback)")

    # Calculate percentiles
    latencies_sorted = sorted(latencies)
    n = len(latencies_sorted)
    p50 = latencies_sorted[n // 2]
    p95 = latencies_sorted[int(n * 0.95)]
    p99 = latencies_sorted[int(n * 0.99)]

    print(f"\n{'='*60}")
    print(f"Inference Latency (CPU, n={n}):")
    print(f"  p50: {p50:.1f} ms")
    print(f"  p95: {p95:.1f} ms")
    print(f"  p99: {p99:.1f} ms")
    print(f"{'='*60}\n")

    # Acceptance: p95 < 500ms
    assert p95 < 500, f"p95 latency too high: {p95:.1f} ms > 500 ms"


def test_inference_throughput(benchmark_images: List[str]):
    """Measure throughput (requests per second)."""
    start = time.perf_counter()
    count = 0

    for selfie in benchmark_images:
        result = segment_selfie(selfie)
        if result.backend == "mediapipe":
            count += 1

    elapsed = time.perf_counter() - start

    if count == 0:
        pytest.skip("No MediaPipe inferences")

    throughput = count / elapsed

    print(f"\n{'='*60}")
    print(f"Throughput: {throughput:.2f} req/s ({count} images in {elapsed:.2f}s)")
    print(f"{'='*60}\n")

    # Acceptance: >2 req/s (reasonable for CPU)
    assert throughput > 2.0, f"Throughput too low: {throughput:.2f} req/s"
```

**Acceptance Criteria**:
- p95 latency < 500ms (CPU)
- Throughput > 2 req/s
- Benchmark runs on 10+ images

**Tests**: Self-testing (benchmark output)

---

#### 1.5.2 Document Benchmark Results
**Effort**: 5 min | **Tokens**: 1,000

**Actions**:
1. Run benchmark: `pytest tests/test_segmentation_benchmark.py -v -s`
2. Document results in `docs/ML_TRAINING_EXECUTION_PLAN.md` (append)

**Example Results**:
```
## Phase 1 Benchmark Results

**Environment**: MacBook Pro M1, 16GB RAM, CPU only

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| p50 latency | 120 ms | <500 ms | ✅ |
| p95 latency | 180 ms | <500 ms | ✅ |
| p99 latency | 220 ms | <500 ms | ✅ |
| Throughput | 8.3 req/s | >2 req/s | ✅ |

**Bottlenecks**: None identified (CPU inference fast enough)

**Recommendation**: Proceed to Phase 4 (no GPU needed)
```

---

### Task 1.5 Checkpoint

**Deliverable**: Benchmark tests passing, results documented

**Commit Message**:
```
test(ml-api): Add segmentation inference benchmarks

- Add benchmark test for CPU latency (p50/p95/p99)
- Add throughput measurement
- Document results in execution plan

Acceptance:
- p95 latency < 500ms
- Throughput > 2 req/s

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.5
```

**Token Checkpoint**: ~49,000 tokens used | Remaining budget: ~151,000

---

## Task 1.6: Deploy to Staging

**Token Budget**: 🟢 Low (2,000-3,000)
**Effort**: 15 min
**Dependencies**: ✅ Task 1.5, 1.4
**Can Run Parallel**: No

### Objective
Update model registry, deploy to staging, run E2E smoke test.

### Files Affected
```
services/ml-api/
├── model_registry.json (new)
└── app/core/models.py (add version logging)
```

### Subtasks

#### 1.6.1 Create Model Registry
**Effort**: 5 min | **Tokens**: 1,000

**File**: `model_registry.json` (root of ml-api)
```json
{
  "hair_segmenter": {
    "version": "mediapipe-v1.0-general",
    "created_at": "2025-12-20T10:00:00Z",
    "base_model": "MediaPipe SelfieSegmentation (model=1)",
    "dataset": "Pre-trained (Google)",
    "phase": "Phase 1 - Zero-Train",
    "metrics": {
      "quality_fixtures_tested": 20,
      "mediapipe_usage": "95%",
      "failure_rate": "5%",
      "p95_latency_ms": 180,
      "throughput_req_per_sec": 8.3
    },
    "config": {
      "model_selection": 1,
      "postprocess": {
        "feather_radius": 5,
        "morph_ops": false
      }
    },
    "status": "staging"
  }
}
```

**Acceptance Criteria**:
- Registry file created
- Metrics from benchmarks documented
- Version matches models.py

**Tests**: None (metadata only)

---

#### 1.6.2 Add Version Logging
**Effort**: 5 min | **Tokens**: 1,000

**File**: `app/core/models.py` (update `segmenter()`)
```python
import logging

logger = logging.getLogger(__name__)

# In segmenter() method, after loading:
                cls._segmenter_model = SegmenterModel(...)
                logger.info(
                    f"Loaded segmenter model: {cls._segmenter_model.version} "
                    f"(backend={'mediapipe' if MP_AVAILABLE else 'stub'})"
                )
```

**Acceptance Criteria**:
- Version logged on first load
- No sensitive data in logs

**Tests**: Manual (check logs during startup)

---

#### 1.6.3 E2E Smoke Test
**Effort**: 5 min | **Tokens**: 1,000

**Actions**:
1. Start ML API: `cd services/ml-api && uvicorn app.main:app --reload`
2. Send test request via `curl`:
```bash
curl -X POST http://localhost:8000/try-on \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-phase1" \
  -d '{
    "selfie": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "color": "Sunlit Amber",
    "intensity": 50,
    "request_id": "test-phase1"
  }'
```
3. Verify response:
   - `image_url` present
   - `processing_ms` < 1000
   - `request_id` matches
   - No errors

**Acceptance Criteria**:
- E2E test succeeds
- Response time acceptable
- Image URL accessible

**Tests**: Manual smoke test

---

### Task 1.6 Checkpoint

**Deliverable**: Model registry created, version logging added, E2E test passing

**Commit Message**:
```
feat(ml-api): Deploy Phase 1 MediaPipe to staging

- Add model_registry.json with Phase 1 metrics
- Add version logging in ModelCache
- E2E smoke test successful

Acceptance:
- Model version documented
- E2E test passes
- Latency < 1000ms

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.6
```

**Token Checkpoint**: ~52,000 tokens used | Remaining budget: ~148,000

---

## Phase 1 Summary & Exit Criteria

**Total Tokens Used**: ~52,000
**Total Effort**: 2.5 hours
**Total Cost**: $0

### Exit Criteria Checklist

```
✅ 1.1: MediaPipe installed, 20+ fixtures ready
✅ 1.2: Real segmentation integrated, tests passing
✅ 1.3: Quality validated (≥80% MediaPipe, ≤20% failures)
✅ 1.4: Post-processing implemented and tuned
✅ 1.5: Benchmarks passing (p95 < 500ms)
✅ 1.6: Model registry created, E2E test passing
```

### Decision Point

**If IoU/quality ≥85% and failures <20%**: ✅ **Proceed to Phase 4 (Integration & Deployment)**

**If IoU/quality <85% or failures ≥20%**: ⚠️ **Escalate to Phase 2 (Light Finetune)**

**If failures >40%**: 🔴 **Re-evaluate dataset or model choice**

---

# PHASE 2: Light Finetune (CONDITIONAL)

**Total Effort**: 4-6 hours | **Cost**: $1-2 | **Risk**: Medium | **Total Tokens**: ~60,000

**Trigger**: Phase 1 quality insufficient (IoU <0.85 or failures ≥20%)

## Pre-Flight Checklist

Before starting Phase 2:
- [ ] Phase 1 completed and quality metrics documented
- [ ] Budget approved ($1-2 GPU cost)
- [ ] Dataset download started (can run in background)
- [ ] GPU provider account created (Lambda Labs recommended)

---

## Task 2.1: Dataset Preparation

**Token Budget**: 🟡 Medium (10,000-12,000)
**Effort**: 60 min
**Dependencies**: None
**Can Run Parallel**: Yes (with Task 2.2, 2.3)

### Objective
Download Figaro-1k dataset, prepare train/val/test splits, cache as `.npy` for fast loading.

### Files Affected
```
services/ml-api/
├── datasets/
│   ├── figaro-1k/
│   │   ├── train/ (700 images + masks)
│   │   ├── val/ (150 images + masks)
│   │   └── test/ (150 images + masks)
│   └── README.md
└── scripts/
    └── prepare_dataset.py (new)
```

### Subtasks

#### 2.1.1 Download Figaro-1k Dataset
**Effort**: 15 min | **Tokens**: 2,000

**Actions**:
1. Download from [Figaro-1k GitHub](https://github.com/khanhhale/Figaro1k) or mirror
2. Extract to `datasets/figaro-1k-raw/`
3. Verify: 1050 images + 1050 masks (PNG)

**Acceptance Criteria**:
- 1050 image files
- 1050 mask files
- No corrupted files

**Tests**: Manual verification

---

#### 2.1.2 Create Dataset Preparation Script
**Effort**: 30 min | **Tokens**: 8,000

**File**: `scripts/prepare_dataset.py`
```python
"""
Prepare Figaro-1k dataset for training.

Steps:
1. Validate images and masks
2. Resize to 384x384
3. Split 70/15/15 (train/val/test)
4. Save as .npy for fast loading
"""
import argparse
import random
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from tqdm import tqdm


def validate_pair(img_path: Path, mask_path: Path) -> bool:
    """Validate image-mask pair (no corruption, matching size)."""
    try:
        img = Image.open(img_path)
        mask = Image.open(mask_path)
        return img.size == mask.size
    except Exception:
        return False


def resize_and_save(img_path: Path, mask_path: Path, output_dir: Path, target_size: int = 384):
    """Resize and save as .npy."""
    img = cv2.imread(str(img_path))
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)

    img_resized = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_LINEAR)
    mask_resized = cv2.resize(mask, (target_size, target_size), interpolation=cv2.INTER_NEAREST)

    # Save
    stem = img_path.stem
    np.save(output_dir / f"{stem}_img.npy", img_resized)
    np.save(output_dir / f"{stem}_mask.npy", mask_resized)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True, help="Path to figaro-1k-raw/")
    parser.add_argument("--output", type=Path, required=True, help="Path to datasets/figaro-1k/")
    parser.add_argument("--split", nargs=3, type=float, default=[0.7, 0.15, 0.15])
    args = parser.parse_args()

    # Collect pairs
    image_dir = args.input / "images"
    mask_dir = args.input / "masks"

    pairs = []
    for img_path in image_dir.glob("*.jpg"):
        mask_path = mask_dir / f"{img_path.stem}.png"
        if validate_pair(img_path, mask_path):
            pairs.append((img_path, mask_path))

    print(f"Found {len(pairs)} valid pairs")

    # Shuffle and split
    random.seed(42)
    random.shuffle(pairs)

    n_train = int(len(pairs) * args.split[0])
    n_val = int(len(pairs) * args.split[1])

    train_pairs = pairs[:n_train]
    val_pairs = pairs[n_train:n_train + n_val]
    test_pairs = pairs[n_train + n_val:]

    # Process splits
    for split_name, split_pairs in [("train", train_pairs), ("val", val_pairs), ("test", test_pairs)]:
        split_dir = args.output / split_name
        split_dir.mkdir(parents=True, exist_ok=True)

        print(f"Processing {split_name} ({len(split_pairs)} pairs)...")
        for img_path, mask_path in tqdm(split_pairs):
            resize_and_save(img_path, mask_path, split_dir)

    print("Dataset preparation complete!")


if __name__ == "__main__":
    main()
```

**Usage**:
```bash
python scripts/prepare_dataset.py \
  --input datasets/figaro-1k-raw \
  --output datasets/figaro-1k
```

**Acceptance Criteria**:
- Train/val/test splits created (70/15/15)
- All images resized to 384x384
- Saved as .npy (fast loading)

**Tests**: Manual (check output counts)

---

#### 2.1.3 Run Dataset Preparation
**Effort**: 15 min | **Tokens**: 1,000

**Actions**:
1. Run preparation script
2. Verify output:
   - `datasets/figaro-1k/train/`: ~700 pairs
   - `datasets/figaro-1k/val/`: ~150 pairs
   - `datasets/figaro-1k/test/`: ~150 pairs
3. Compute dataset statistics (mean/std for normalization)

**Acceptance Criteria**:
- 1000+ .npy files created
- No errors during processing

**Tests**: None (manual verification)

---

### Task 2.1 Checkpoint

**Deliverable**: Figaro-1k dataset prepared and cached

**Commit Message**:
```
feat(ml-api): Prepare Figaro-1k dataset for Phase 2

- Download Figaro-1k dataset (1050 images)
- Add dataset preparation script (resize, split, cache)
- Create train/val/test splits (70/15/15)
- Save as .npy for fast training

Task: ML_TRAINING_EXECUTION_PLAN.md § 2.1
```

**Token Checkpoint**: ~64,000 tokens used | Remaining budget: ~136,000

---

## Task 2.2: GPU Provider Selection & Setup

**Token Budget**: 🟢 Low (2,000-3,000)
**Effort**: 15 min
**Dependencies**: None
**Can Run Parallel**: Yes (with Task 2.1, 2.3)

### Objective
Select GPU provider (Lambda Labs recommended), create account, verify SSH access.

### Subtasks

#### 2.2.1 Create GPU Instance
**Effort**: 10 min | **Tokens**: 2,000

**Recommended**: Lambda Labs A10 (24GB, $0.75/hr)

**Actions**:
1. Create account at [lambdalabs.com](https://lambdalabs.com)
2. Add billing (credit card)
3. Launch instance:
   - GPU: A10 (24GB)
   - OS: Ubuntu 22.04 with PyTorch pre-installed
   - Region: Closest to you
4. Note: IP address, SSH key
5. Test SSH: `ssh ubuntu@<IP>`
6. Verify GPU: `nvidia-smi`

**Acceptance Criteria**:
- SSH access works
- GPU detected (A10, 24GB)
- PyTorch installed

**Tests**: Manual

---

#### 2.2.2 Setup Training Environment
**Effort**: 5 min | **Tokens**: 1,000

**Actions**:
1. Install dependencies:
```bash
pip install torch torchvision albumentations tqdm pillow
```
2. Upload dataset (rsync or scp):
```bash
rsync -avz datasets/figaro-1k ubuntu@<IP>:~/datasets/
```
3. Upload training script (from Task 2.4)

**Acceptance Criteria**:
- Dependencies installed
- Dataset uploaded
- Ready for training

**Tests**: Manual

---

### Task 2.2 Checkpoint

**Deliverable**: GPU instance ready

**No commit** (infrastructure only)

**Token Checkpoint**: ~67,000 tokens used | Remaining budget: ~133,000

---

## Task 2.3: Model Baseline Selection

**Token Budget**: 🟢 Low (2,000-3,000)
**Effort**: 10 min
**Dependencies**: None
**Can Run Parallel**: Yes (with Task 2.1, 2.2)

### Objective
Select MODNet (MobileNetV2) as base model, download pre-trained checkpoint.

### Subtasks

#### 2.3.1 Download MODNet Checkpoint
**Effort**: 10 min | **Tokens**: 2,000

**Actions**:
1. Clone MODNet repo: `git clone https://github.com/ZHKKKe/MODNet`
2. Download pre-trained checkpoint: `modnet_photographic_portrait_matting.ckpt`
3. Upload to GPU instance: `scp modnet_*.ckpt ubuntu@<IP>:~/checkpoints/`

**Acceptance Criteria**:
- Checkpoint downloaded
- Uploaded to GPU instance

**Tests**: None

---

### Task 2.3 Checkpoint

**Deliverable**: MODNet checkpoint ready

**No commit** (checkpoint not versioned)

**Token Checkpoint**: ~69,000 tokens used | Remaining budget**: ~131,000

---

## Task 2.4: Training on GPU Instance

**Token Budget**: 🔴 High (20,000-30,000)
**Effort**: 90 min GPU
**Dependencies**: ✅ Task 2.1, 2.2, 2.3
**Can Run Parallel**: No

### Objective
Finetune MODNet on Figaro-1k for 5 epochs, save best checkpoint.

### Files Affected
```
services/ml-api/scripts/
├── train_modnet.py (new)
└── config_modnet.yaml (new)
```

### Subtasks

#### 2.4.1 Create Training Script
**Effort**: 30 min | **Tokens**: 15,000

**File**: `scripts/train_modnet.py`
```python
"""
Train MODNet on Figaro-1k dataset.

Features:
- Mixed precision (FP16) for 2x speedup
- Gradient accumulation (effective batch size 16)
- Early stopping (patience=3)
- BCE + Dice loss with class weighting
"""
import argparse
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.cuda.amp import GradScaler, autocast
from torch.optim import AdamW
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm


class FigaroDataset(Dataset):
    """Figaro-1k dataset loader."""

    def __init__(self, data_dir: Path, split: str = "train"):
        self.data_dir = data_dir / split
        self.image_paths = sorted(self.data_dir.glob("*_img.npy"))
        self.mask_paths = [p.parent / f"{p.stem.replace('_img', '_mask')}.npy" for p in self.image_paths]

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img = np.load(self.image_paths[idx]).astype(np.float32) / 255.0
        mask = np.load(self.mask_paths[idx]).astype(np.float32) / 255.0

        # Transpose (H, W, C) → (C, H, W)
        img = img.transpose(2, 0, 1)
        mask = mask[None, :, :]  # Add channel dim

        return torch.from_numpy(img), torch.from_numpy(mask)


def dice_loss(pred, target):
    """Dice loss for segmentation."""
    smooth = 1e-5
    pred = pred.sigmoid()
    intersection = (pred * target).sum()
    return 1 - (2 * intersection + smooth) / (pred.sum() + target.sum() + smooth)


def train_epoch(model, loader, optimizer, scaler, device, accumulation_steps=4):
    """Train one epoch."""
    model.train()
    total_loss = 0

    for i, (images, masks) in enumerate(tqdm(loader, desc="Training")):
        images, masks = images.to(device), masks.to(device)

        with autocast():
            preds = model(images)
            loss_bce = nn.BCEWithLogitsLoss()(preds, masks)
            loss_dice = dice_loss(preds, masks)
            loss = loss_bce + loss_dice

        scaler.scale(loss / accumulation_steps).backward()

        if (i + 1) % accumulation_steps == 0:
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad()

        total_loss += loss.item()

    return total_loss / len(loader)


def validate(model, loader, device):
    """Validate and compute IoU."""
    model.eval()
    total_iou = 0

    with torch.no_grad():
        for images, masks in tqdm(loader, desc="Validation"):
            images, masks = images.to(device), masks.to(device)
            preds = model(images).sigmoid() > 0.5

            intersection = (preds * masks).sum()
            union = preds.sum() + masks.sum() - intersection
            iou = (intersection + 1e-5) / (union + 1e-5)
            total_iou += iou.item()

    return total_iou / len(loader)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("checkpoints"))
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=1e-4)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load datasets
    train_dataset = FigaroDataset(args.data_dir, "train")
    val_dataset = FigaroDataset(args.data_dir, "val")

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=4, pin_memory=True)

    # Load model (placeholder: use real MODNet)
    model = torch.hub.load('pytorch/vision:v0.10.0', 'mobilenet_v2', pretrained=True)
    model.classifier = nn.Conv2d(1280, 1, kernel_size=1)  # Binary segmentation head
    model = model.to(device)

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=1e-5)
    scaler = GradScaler()

    best_iou = 0
    patience = 3
    patience_counter = 0

    for epoch in range(args.epochs):
        print(f"\nEpoch {epoch + 1}/{args.epochs}")

        train_loss = train_epoch(model, train_loader, optimizer, scaler, device)
        val_iou = validate(model, val_loader, device)

        print(f"Train Loss: {train_loss:.4f}, Val IoU: {val_iou:.4f}")

        if val_iou > best_iou:
            best_iou = val_iou
            torch.save(model.state_dict(), args.output / "best_model.pt")
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= patience:
            print("Early stopping triggered")
            break

    print(f"Best Val IoU: {best_iou:.4f}")


if __name__ == "__main__":
    main()
```

**Note**: This is a simplified training script. Real implementation would use actual MODNet architecture.

**Acceptance Criteria**:
- Training script runs without errors
- Mixed precision enabled (FP16)
- Gradient accumulation working
- Early stopping implemented

**Tests**: None (training script)

---

#### 2.4.2 Run Training
**Effort**: 90 min GPU | **Tokens**: 5,000

**Actions** (on GPU instance):
```bash
python train_modnet.py \
  --data_dir datasets/figaro-1k \
  --checkpoint checkpoints/modnet_photographic_portrait_matting.ckpt \
  --output checkpoints \
  --epochs 5 \
  --batch_size 4 \
  --lr 1e-4
```

**Monitoring**:
- Watch training loss (should decrease)
- Watch val IoU (should increase)
- Early stopping likely at epoch 3-4

**Acceptance Criteria**:
- Training completes in <120 min
- Best val IoU >0.90
- Checkpoint saved

**Tests**: None (manual monitoring)

---

### Task 2.4 Checkpoint

**Deliverable**: Trained MODNet checkpoint

**Commit** (after download):
```
feat(ml-api): Add MODNet training script for Phase 2

- Add train_modnet.py with FP16, gradient accumulation
- Add Figaro-1k dataset loader
- Implement BCE + Dice loss
- Add early stopping

Task: ML_TRAINING_EXECUTION_PLAN.md § 2.4
```

**Token Checkpoint**: ~94,000 tokens used | Remaining budget: ~106,000

---

## Task 2.5: Export & Evaluation

**Token Budget**: 🟡 Medium (8,000-10,000)
**Effort**: 25 min
**Dependencies**: ✅ Task 2.4
**Can Run Parallel**: No

### Objective
Evaluate trained model, export to TorchScript/ONNX, update registry.

### Files Affected
```
services/ml-api/
├── checkpoints/
│   ├── hair_segmenter_v1.1.pt
│   └── hair_segmenter_v1.1.onnx
└── model_registry.json (update)
```

### Subtasks

#### 2.5.1 Evaluate on Test Set
**Effort**: 10 min | **Tokens**: 4,000

**Actions** (on GPU instance):
```python
# Eval script (simplified)
test_dataset = FigaroDataset(args.data_dir, "test")
test_loader = DataLoader(test_dataset, batch_size=4)

model.load_state_dict(torch.load("checkpoints/best_model.pt"))
test_iou = validate(model, test_loader, device)
print(f"Test IoU: {test_iou:.4f}")
```

**Acceptance Criteria**:
- Test IoU >0.90
- Visual samples look good

**Tests**: Manual

---

#### 2.5.2 Export to TorchScript and ONNX
**Effort**: 10 min | **Tokens**: 3,000

**Actions**:
```python
# TorchScript export
model.eval()
example_input = torch.randn(1, 3, 384, 384).to(device)
traced = torch.jit.trace(model, example_input)
traced.save("checkpoints/hair_segmenter_v1.1.pt")

# ONNX export
torch.onnx.export(
    model,
    example_input,
    "checkpoints/hair_segmenter_v1.1.onnx",
    opset_version=14,
    input_names=["image"],
    output_names=["mask"],
    dynamic_axes={"image": {0: "batch"}, "mask": {0: "batch"}}
)
```

**Acceptance Criteria**:
- TorchScript (.pt) exported
- ONNX (.onnx) exported
- Both formats load without error

**Tests**: None

---

#### 2.5.3 Update Model Registry
**Effort**: 5 min | **Tokens**: 2,000

**File**: `model_registry.json` (update)
```json
{
  "hair_segmenter": {
    "version": "modnet-v1.1-finetuned",
    "created_at": "2025-12-20T14:00:00Z",
    "base_model": "MODNet MobileNetV2",
    "dataset": "Figaro-1k (1000 samples, 70/15/15 split)",
    "phase": "Phase 2 - Light Finetune",
    "metrics": {
      "val_iou": 0.92,
      "test_iou": 0.91,
      "train_epochs": 4,
      "early_stopped": true,
      "p95_latency_ms": 280,
      "gpu_hours": 1.5
    },
    "config": {
      "batch_size": 4,
      "accumulation_steps": 4,
      "lr": 1e-4,
      "mixed_precision": true
    },
    "files": {
      "torchscript": "hair_segmenter_v1.1.pt",
      "onnx": "hair_segmenter_v1.1.onnx"
    },
    "status": "staging",
    "cost_usd": 1.13
  }
}
```

**Acceptance Criteria**:
- Registry updated with Phase 2 metrics
- Cost documented

**Tests**: None

---

### Task 2.5 Checkpoint

**Deliverable**: Model evaluated and exported

**Commit Message**:
```
feat(ml-api): Export Phase 2 MODNet checkpoint

- Evaluate on test set (IoU 0.91)
- Export to TorchScript and ONNX
- Update model_registry.json with Phase 2 metrics

Acceptance:
- Test IoU >0.90
- TorchScript and ONNX exported
- Cost: $1.13 (1.5 GPU hours)

Task: ML_TRAINING_EXECUTION_PLAN.md § 2.5
```

**Token Checkpoint**: ~104,000 tokens used | Remaining budget: ~96,000

---

## Task 2.6: Cost Minimization

**Token Budget**: 🟢 Low (1,000)
**Effort**: 5 min
**Dependencies**: ✅ Task 2.5
**Can Run Parallel**: No

### Objective
Terminate GPU instance immediately to avoid idle costs.

### Actions
1. Download checkpoints to local: `scp ubuntu@<IP>:~/checkpoints/* ./checkpoints/`
2. Terminate instance in Lambda Labs console
3. Verify termination (no billing)

**Acceptance Criteria**:
- Checkpoints downloaded
- Instance terminated
- Total cost <$2

**Tests**: None

---

### Task 2.6 Checkpoint

**Deliverable**: GPU instance terminated, cost minimized

**No commit** (infrastructure only)

**Token Checkpoint**: ~105,000 tokens used | Remaining budget: ~95,000

---

## Phase 2 Summary & Exit Criteria

**Total Tokens Used**: ~105,000
**Total Effort**: 4-6 hours
**Total Cost**: $1.13

### Exit Criteria Checklist

```
✅ 2.1: Figaro-1k dataset prepared (1000+ samples)
✅ 2.2: GPU instance ready (Lambda Labs A10)
✅ 2.3: MODNet checkpoint downloaded
✅ 2.4: Training completed (val IoU >0.90)
✅ 2.5: Model exported (TorchScript, ONNX)
✅ 2.6: GPU instance terminated
```

### Decision Point

**If test IoU ≥0.90**: ✅ **Proceed to Phase 4 (Integration & Deployment)**

**If test IoU <0.90**: ⚠️ **Re-train with adjusted hyperparameters OR escalate to Phase 3**

**Note**: Phase 3 (Full Training) is **NOT recommended** for MVP. Proceed to Phase 4 with best available model.

---

# PHASE 4: Integration & Production Deployment

**Total Effort**: 2-3 hours | **Cost**: $0 | **Risk**: Low | **Total Tokens**: ~25,000

**Trigger**: Phase 1 or Phase 2 completed successfully

---

## Task 4.1: Model Versioning & Registry

**Token Budget**: 🟢 Low (2,000-3,000)
**Effort**: 15 min
**Dependencies**: Phase 1 or 2 complete
**Can Run Parallel**: No

### Objective
Finalize model registry, store checkpoints with Git LFS or S3, document training provenance.

### Files Affected
```
services/ml-api/
├── model_registry.json (finalize)
└── checkpoints/ (Git LFS or S3)
```

### Subtasks

#### 4.1.1 Finalize Model Registry
**Effort**: 5 min | **Tokens**: 1,000

**Actions**:
1. Review `model_registry.json` from Phase 1 or 2
2. Ensure all metrics documented
3. Add SHA256 checksum for checkpoint integrity

**File**: `model_registry.json` (update)
```json
{
  "hair_segmenter": {
    ...
    "checksum_sha256": "abc123...",
    "status": "production-ready"
  }
}
```

**Acceptance Criteria**:
- Registry complete and accurate
- Checksum added

**Tests**: None

---

#### 4.1.2 Store Checkpoint
**Effort**: 10 min | **Tokens**: 2,000

**Options**:
- **Git LFS**: For small models (<100MB), track with Git LFS
- **S3**: For larger models, upload to S3 with versioning

**Recommended**: Git LFS for MediaPipe (small), S3 for MODNet (if large)

**Actions** (Git LFS example):
```bash
git lfs install
git lfs track "checkpoints/*.pt"
git add .gitattributes checkpoints/hair_segmenter_v1.1.pt
git commit -m "feat: Add Phase 1 checkpoint (Git LFS)"
```

**Acceptance Criteria**:
- Checkpoint stored and versioned
- Checksum verified

**Tests**: None

---

### Task 4.1 Checkpoint

**Deliverable**: Model registry finalized, checkpoint stored

**Commit Message**:
```
feat(ml-api): Finalize model registry for production

- Add SHA256 checksum to model_registry.json
- Store checkpoint with Git LFS (or S3)
- Mark status as "production-ready"

Task: ML_TRAINING_EXECUTION_PLAN.md § 4.1
```

**Token Checkpoint**: ~108,000 tokens used | Remaining budget: ~92,000

---

## Task 4.2: Update segmenter.py with Production Model

**Token Budget**: 🟡 Medium (8,000-10,000)
**Effort**: 30 min
**Dependencies**: ✅ Task 4.1
**Can Run Parallel**: No

### Objective
Integrate trained checkpoint into `segmenter.py`, add version logging.

### Files Affected
```
services/ml-api/app/core/
├── models.py (load production checkpoint)
└── segmenter.py (use production model)
```

### Subtasks

#### 4.2.1 Update ModelCache to Load Production Checkpoint
**Effort**: 15 min | **Tokens**: 5,000

**File**: `app/core/models.py` (if Phase 2 used)

**Changes**: Load TorchScript checkpoint instead of MediaPipe
```python
# If Phase 2 checkpoint available:
if Path("checkpoints/hair_segmenter_v1.1.pt").exists():
    import torch
    backend = torch.jit.load("checkpoints/hair_segmenter_v1.1.pt")
    backend.eval()
    version = "modnet-v1.1-finetuned"
else:
    # Fallback to MediaPipe (Phase 1)
    ...
```

**Acceptance Criteria**:
- Production checkpoint loaded
- Version logged
- Graceful fallback if checkpoint missing

**Tests**:
```python
def test_model_cache_loads_production():
    ModelCache.clear()
    model = ModelCache.segmenter()
    assert "v1.1" in model.version or "mediapipe" in model.version
```

---

#### 4.2.2 Test Integration End-to-End
**Effort**: 15 min | **Tokens**: 4,000

**Actions**:
1. Run existing tests: `pytest tests/ -v`
2. Verify all tests pass with production model
3. Run E2E smoke test (Task 1.6.3)

**Acceptance Criteria**:
- All tests pass
- E2E smoke test successful
- No regressions

**Tests**: Existing test suite

---

### Task 4.2 Checkpoint

**Deliverable**: Production model integrated and tested

**Commit Message**:
```
feat(ml-api): Integrate production model checkpoint

- Update ModelCache to load Phase 1/2 checkpoint
- Add version logging
- Verify E2E integration

Acceptance:
- All tests pass
- E2E smoke test successful

Task: ML_TRAINING_EXECUTION_PLAN.md § 4.2
```

**Token Checkpoint**: ~118,000 tokens used | Remaining budget: ~82,000

---

## Task 4.3: A/B Testing Setup

**Token Budget**: 🟡 Medium (10,000-12,000)
**Effort**: 45 min
**Dependencies**: ✅ Task 4.2
**Can Run Parallel**: No

### Objective
Implement feature flag for gradual rollout (10% → 50% → 100%).

### Files Affected
```
services/ml-api/app/
├── core/ab_testing.py (new)
└── main.py (integrate feature flag)
```

### Subtasks

#### 4.3.1 Implement Feature Flag Logic
**Effort**: 25 min | **Tokens**: 8,000

**File**: `app/core/ab_testing.py`
```python
"""
A/B testing and feature flag logic.

Gradual rollout: 10% → 50% → 100%
"""
import hashlib
import os
from enum import Enum


class RolloutStage(Enum):
    DISABLED = 0
    TEN_PERCENT = 10
    FIFTY_PERCENT = 50
    FULL = 100


def get_rollout_stage() -> RolloutStage:
    """Get current rollout stage from env var."""
    stage_str = os.getenv("ROLLOUT_STAGE", "FULL")
    try:
        return RolloutStage[stage_str]
    except KeyError:
        return RolloutStage.FULL


def should_use_new_model(request_id: str, stage: RolloutStage) -> bool:
    """
    Determine if request should use new model.

    Uses consistent hashing on request_id for stable A/B assignment.

    Args:
        request_id: Unique request identifier
        stage: Current rollout stage

    Returns:
        True if should use new model, False for fallback
    """
    if stage == RolloutStage.DISABLED:
        return False
    if stage == RolloutStage.FULL:
        return True

    # Hash request_id to 0-100
    hash_bytes = hashlib.md5(request_id.encode()).digest()
    hash_int = int.from_bytes(hash_bytes[:4], byteorder='big')
    bucket = hash_int % 100

    return bucket < stage.value
```

**Acceptance Criteria**:
- Feature flag logic implemented
- Consistent hashing (same request_id → same model)
- Env var configurable

**Tests**:
```python
def test_rollout_stage_parsing():
    assert get_rollout_stage() == RolloutStage.FULL  # Default


def test_should_use_new_model_ten_percent():
    stage = RolloutStage.TEN_PERCENT

    # Test 100 request IDs
    results = [should_use_new_model(f"req-{i}", stage) for i in range(100)]

    # Approximately 10% should be True
    true_count = sum(results)
    assert 5 <= true_count <= 15, f"Expected ~10%, got {true_count}%"


def test_should_use_new_model_consistency():
    """Same request_id should always get same result."""
    stage = RolloutStage.FIFTY_PERCENT
    req_id = "test-request-123"

    result1 = should_use_new_model(req_id, stage)
    result2 = should_use_new_model(req_id, stage)

    assert result1 == result2
```

---

#### 4.3.2 Integrate into Pipeline
**Effort**: 15 min | **Tokens**: 3,000

**File**: `app/core/pipeline.py` (update)
```python
from app.core.ab_testing import get_rollout_stage, should_use_new_model

def process_tryon(payload: schemas.TryOnRequest, base_url: str) -> schemas.TryOnResponse:
    started = time.perf_counter()

    # A/B testing logic
    stage = get_rollout_stage()
    use_new_model = should_use_new_model(payload.request_id, stage)

    # (For now, always use new model; future: add fallback logic)
    segment = segment_selfie(payload.selfie)

    # Log A/B assignment
    logger.info(f"[{payload.request_id}] A/B: stage={stage.name}, use_new={use_new_model}")

    ...
```

**Acceptance Criteria**:
- A/B logic integrated
- Logged for every request
- Configurable via env var

**Tests**: Integration test with different `ROLLOUT_STAGE` values

---

#### 4.3.3 Document Rollout Plan
**Effort**: 5 min | **Tokens**: 1,000

**File**: `docs/ROLLOUT_PLAN.md` (new)
```markdown
# Production Rollout Plan

## Phases

### Week 1: 10% Traffic
- Set `ROLLOUT_STAGE=TEN_PERCENT`
- Monitor error rate, latency, quality
- Rollback if error rate >2% or latency p95 >1000ms

### Week 2: 50% Traffic
- If Week 1 successful, set `ROLLOUT_STAGE=FIFTY_PERCENT`
- Continue monitoring

### Week 3: 100% Traffic
- If Week 2 successful, set `ROLLOUT_STAGE=FULL`
- Production fully migrated

## Rollback Thresholds
- Error rate >2%: ROLLBACK immediately
- Latency p95 >1000ms: ROLLBACK
- User complaints >5: INVESTIGATE
```

**Acceptance Criteria**:
- Rollout plan documented
- Rollback thresholds clear

**Tests**: None

---

### Task 4.3 Checkpoint

**Deliverable**: A/B testing implemented, rollout plan documented

**Commit Message**:
```
feat(ml-api): Implement A/B testing for gradual rollout

- Add ab_testing.py with feature flag logic
- Integrate into pipeline with request_id-based hashing
- Add rollout plan (10% → 50% → 100%)
- Add tests for rollout logic

Acceptance:
- Feature flag configurable via env var
- Consistent hashing ensures stable A/B assignment
- Rollback thresholds documented

Task: ML_TRAINING_EXECUTION_PLAN.md § 4.3
```

**Token Checkpoint**: ~130,000 tokens used | Remaining budget: ~70,000

---

## Task 4.4: Monitoring & Alerting

**Token Budget**: 🟡 Medium (8,000-10,000)
**Effort**: 30 min
**Dependencies**: ✅ Task 4.3
**Can Run Parallel**: Yes (with Task 4.5)

### Objective
Setup monitoring dashboard, alerts for error/latency thresholds.

### Files Affected
```
services/ml-api/
├── app/core/metrics.py (new)
└── docs/MONITORING.md (new)
```

### Subtasks

#### 4.4.1 Add Metrics Collection
**Effort**: 20 min | **Tokens**: 6,000

**File**: `app/core/metrics.py`
```python
"""
Metrics collection for monitoring.

Tracks:
- Inference latency (p50, p95, p99)
- Error rate
- Model version usage
- A/B assignment distribution
"""
import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict


@dataclass
class Metrics:
    """In-memory metrics (replace with Prometheus in production)."""
    latencies: list = field(default_factory=list)
    errors: int = 0
    requests: int = 0
    model_versions: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    ab_assignments: Dict[str, int] = field(default_factory=lambda: defaultdict(int))

    _lock: Lock = field(default_factory=Lock, repr=False)

    def record_latency(self, ms: float):
        with self._lock:
            self.latencies.append(ms)
            if len(self.latencies) > 1000:  # Keep last 1000
                self.latencies = self.latencies[-1000:]

    def record_error(self):
        with self._lock:
            self.errors += 1

    def record_request(self, model_version: str, ab_assignment: bool):
        with self._lock:
            self.requests += 1
            self.model_versions[model_version] += 1
            self.ab_assignments[str(ab_assignment)] += 1

    def get_summary(self) -> dict:
        with self._lock:
            latencies_sorted = sorted(self.latencies)
            n = len(latencies_sorted)

            return {
                "requests": self.requests,
                "errors": self.errors,
                "error_rate": self.errors / max(self.requests, 1),
                "latency_p50": latencies_sorted[n // 2] if n > 0 else 0,
                "latency_p95": latencies_sorted[int(n * 0.95)] if n > 0 else 0,
                "latency_p99": latencies_sorted[int(n * 0.99)] if n > 0 else 0,
                "model_versions": dict(self.model_versions),
                "ab_assignments": dict(self.ab_assignments),
            }


METRICS = Metrics()
```

**Integrate into pipeline**:
```python
# In process_tryon():
started = time.perf_counter()
try:
    segment = segment_selfie(payload.selfie)
    model_version = segment.model_version
    ...
    elapsed_ms = (time.perf_counter() - started) * 1000
    METRICS.record_latency(elapsed_ms)
    METRICS.record_request(model_version, use_new_model)
except Exception as e:
    METRICS.record_error()
    raise
```

**Add metrics endpoint**:
```python
# In app/main.py:
from app.core.metrics import METRICS

@app.get("/metrics")
def get_metrics():
    return METRICS.get_summary()
```

**Acceptance Criteria**:
- Metrics collected per request
- Endpoint `/metrics` returns summary
- Thread-safe

**Tests**:
```python
def test_metrics_collection():
    metrics = Metrics()
    metrics.record_latency(100)
    metrics.record_latency(200)
    metrics.record_request("v1.0", True)

    summary = metrics.get_summary()
    assert summary["requests"] == 1
    assert summary["latency_p50"] == 150
```

---

#### 4.4.2 Document Monitoring Strategy
**Effort**: 10 min | **Tokens**: 3,000

**File**: `docs/MONITORING.md`
```markdown
# Monitoring & Alerting

## Metrics Tracked

- **Inference latency**: p50, p95, p99
- **Error rate**: Errors per 1000 requests
- **Model version**: Distribution of versions used
- **A/B assignment**: % using new vs. fallback model

## Endpoints

- `GET /metrics`: JSON summary of all metrics

## Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >2% | ROLLBACK immediately |
| Latency p95 | >1000ms | ROLLBACK |
| Requests | <1 req/min | INVESTIGATE (traffic drop) |

## Dashboard (Future)

- Integrate with Grafana/Prometheus
- Real-time charts for latency, error rate
- Slack/email alerts on threshold breach
```

**Acceptance Criteria**:
- Monitoring strategy documented
- Alert thresholds clear

**Tests**: None

---

### Task 4.4 Checkpoint

**Deliverable**: Metrics collection implemented, monitoring documented

**Commit Message**:
```
feat(ml-api): Add metrics collection and monitoring

- Add metrics.py with latency, error, model version tracking
- Add /metrics endpoint for observability
- Document monitoring strategy and alert thresholds

Acceptance:
- Metrics collected per request
- /metrics endpoint returns summary
- Alert thresholds documented

Task: ML_TRAINING_EXECUTION_PLAN.md § 4.4
```

**Token Checkpoint**: ~144,000 tokens used | Remaining budget: ~56,000

---

## Task 4.5: Documentation & Handoff

**Token Budget**: 🟢 Low (3,000-5,000)
**Effort**: 20 min
**Dependencies**: ✅ Task 4.4
**Can Run Parallel**: Yes (with Task 4.4)

### Objective
Update README, document rollback procedure, create incident response playbook.

### Files Affected
```
services/ml-api/
├── README.md (update)
└── docs/
    ├── ROLLBACK_PROCEDURE.md (new)
    └── INCIDENT_RESPONSE.md (new)
```

### Subtasks

#### 4.5.1 Update README
**Effort**: 5 min | **Tokens**: 2,000

**File**: `services/ml-api/README.md` (append)
```markdown
## Model Deployment

**Current Version**: `mediapipe-v1.0-general` (Phase 1) or `modnet-v1.1-finetuned` (Phase 2)

**Rollout Stage**: Configure via `ROLLOUT_STAGE` env var:
- `TEN_PERCENT`: 10% traffic uses new model
- `FIFTY_PERCENT`: 50% traffic
- `FULL`: 100% traffic (default)

**Monitoring**: `GET /metrics` for latency, error rate, model usage

**Rollback**: See `docs/ROLLBACK_PROCEDURE.md`
```

**Acceptance Criteria**:
- README updated
- Deployment instructions clear

**Tests**: None

---

#### 4.5.2 Create Rollback Procedure
**Effort**: 10 min | **Tokens**: 2,000

**File**: `docs/ROLLBACK_PROCEDURE.md`
```markdown
# Rollback Procedure

## When to Rollback
- Error rate >2%
- Latency p95 >1000ms
- User complaints >5
- Model crashes/errors

## Rollback Steps

### Immediate (< 5 min)
1. Set `ROLLOUT_STAGE=DISABLED` in production env
2. Restart ML API: `docker-compose restart ml-api`
3. Verify fallback model active: `curl http://localhost:8000/metrics`

### Investigate (< 30 min)
4. Check logs for errors: `docker logs ml-api | grep ERROR`
5. Review /metrics for latency spikes
6. Identify root cause (model, data, infra)

### Re-deploy (after fix)
7. Fix issue in staging
8. Test thoroughly
9. Gradual re-rollout (10% → 50% → 100%)

## Rollback Decision Tree
```
ERROR_RATE > 2%? → ROLLBACK immediately
LATENCY_P95 > 1000ms? → ROLLBACK immediately
USER_COMPLAINTS > 5? → INVESTIGATE, consider rollback
MODEL_CRASHES? → ROLLBACK immediately
```
```

**Acceptance Criteria**:
- Rollback procedure documented
- Decision tree clear

**Tests**: None

---

#### 4.5.3 Create Incident Response Playbook
**Effort**: 5 min | **Tokens**: 1,000

**File**: `docs/INCIDENT_RESPONSE.md`
```markdown
# Incident Response Playbook

## Severity Levels

- **P0 (Critical)**: Service down, >10% error rate
- **P1 (High)**: Degraded (error rate 2-10%, latency >2000ms)
- **P2 (Medium)**: Minor issues (error rate <2%, latency 1000-2000ms)

## Response Steps

### P0: Service Down
1. ROLLBACK immediately (see ROLLBACK_PROCEDURE.md)
2. Alert on-call engineer
3. Page team lead
4. Post incident in #incidents channel

### P1: Degraded
1. Monitor for 5 min (check if transient)
2. If persistent, ROLLBACK
3. Investigate root cause

### P2: Minor Issues
1. Monitor, no immediate action
2. Log issue for next sprint
```

**Acceptance Criteria**:
- Incident response playbook documented
- Severity levels clear

**Tests**: None

---

### Task 4.5 Checkpoint

**Deliverable**: Documentation complete, handoff ready

**Commit Message**:
```
docs(ml-api): Complete deployment documentation

- Update README with deployment instructions
- Add rollback procedure (ROLLBACK_PROCEDURE.md)
- Add incident response playbook (INCIDENT_RESPONSE.md)

Acceptance:
- Deployment instructions clear
- Rollback procedure documented
- Incident response playbook ready

Task: ML_TRAINING_EXECUTION_PLAN.md § 4.5
```

**Token Checkpoint**: ~149,000 tokens used | Remaining budget: ~51,000

---

## Phase 4 Summary & Exit Criteria

**Total Tokens Used**: ~41,000
**Total Effort**: 2.5 hours
**Total Cost**: $0

### Exit Criteria Checklist

```
✅ 4.1: Model registry finalized, checkpoint stored
✅ 4.2: Production model integrated, tests passing
✅ 4.3: A/B testing implemented, rollout plan documented
✅ 4.4: Metrics collection active, monitoring documented
✅ 4.5: Documentation complete, rollback procedure ready
```

### Production Readiness

**Go-Live Checklist**:
- [ ] All tests passing
- [ ] E2E smoke test successful
- [ ] Monitoring endpoint active (`/metrics`)
- [ ] Rollout stage configured (`ROLLOUT_STAGE=TEN_PERCENT`)
- [ ] Rollback procedure tested
- [ ] Team trained on incident response

**Week 1**: 10% traffic → Monitor for errors
**Week 2**: 50% traffic → If metrics OK
**Week 3**: 100% traffic → Full production

---

# Total Project Summary

## Token Usage by Phase

| Phase | Tokens Used | Cumulative | Remaining |
|-------|-------------|------------|-----------|
| Phase 1 (Zero-Train) | ~52,000 | 52,000 | 148,000 |
| Phase 2 (Finetune) | ~53,000 | 105,000 | 95,000 |
| Phase 4 (Integration) | ~41,000 | 146,000 | 54,000 |
| **TOTAL** | **~146,000** | **146,000** | **54,000** |

## Cost Summary

| Phase | Cost | Time |
|-------|------|------|
| Phase 1 | $0 | 2.5 hours |
| Phase 2 (optional) | $1.13 | 4-6 hours |
| Phase 4 | $0 | 2.5 hours |
| **Fast Track (1+4)** | **$0** | **5 hours** |
| **Full Track (1+2+4)** | **$1.13** | **9-11 hours** |

## Recommended Path

**For MVP**: Phase 1 → Phase 4 (5 hours, $0, low risk)

**If quality insufficient**: Phase 1 → Phase 2 → Phase 4 (9-11 hours, $1.13, medium risk)

**Skip Phase 3** (full training) unless extreme quality needed and budget approved.

---

# Appendices

## A. Token Budget Management

### Checkpoint Strategy
- Save progress after each task (commit + push)
- Document current task in commit message
- If tokens <20k remaining: STOP and document next steps

### Recovery Strategy
If conversation runs out of tokens mid-task:
1. Check last commit message for task ID
2. Read `ML_TRAINING_EXECUTION_PLAN.md` § [task ID]
3. Resume from last checkpoint

---

## B. Test Strategy Summary

### Phase 1 Tests
- `test_model_cache_loads_mediapipe()`: Model loading
- `test_segment_real_image()`: Real segmentation on fixtures
- `test_segmentation_quality_overall()`: Quality validation
- `test_postprocess_feathering()`: Post-processing ops
- `test_inference_latency_cpu()`: Performance benchmarks

### Phase 2 Tests
- Dataset preparation: Manual verification
- Training: Manual monitoring (loss, IoU)
- Evaluation: `test_iou > 0.90`

### Phase 4 Tests
- `test_rollout_stage_parsing()`: Feature flag logic
- `test_should_use_new_model_ten_percent()`: A/B distribution
- `test_metrics_collection()`: Metrics tracking
- E2E smoke test: Full request/response flow

---

## C. Quick Reference Commands

### Phase 1
```bash
# Install dependencies
pip install -r requirements.txt

# Run quality tests
pytest tests/test_segmentation_quality.py -v

# Run benchmarks
pytest tests/test_segmentation_benchmark.py -v -s

# E2E smoke test
curl -X POST http://localhost:8000/try-on -H "Content-Type: application/json" -d '...'
```

### Phase 2
```bash
# Prepare dataset
python scripts/prepare_dataset.py --input datasets/figaro-1k-raw --output datasets/figaro-1k

# Train (on GPU instance)
python scripts/train_modnet.py --data_dir datasets/figaro-1k --epochs 5

# Export checkpoint
python scripts/export_model.py --checkpoint checkpoints/best_model.pt
```

### Phase 4
```bash
# Set rollout stage
export ROLLOUT_STAGE=TEN_PERCENT

# Check metrics
curl http://localhost:8000/metrics

# Rollback
export ROLLOUT_STAGE=DISABLED
docker-compose restart ml-api
```

---

**End of Document**

**Next Steps**: Execute Phase 1 (Task 1.1 → 1.6)

**Token Budget Remaining**: ~54,000 (sufficient for execution support)
