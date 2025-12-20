"""Tests for models.py and segmenter.py (Tasks 1.2.1 and 1.2.2).

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2
"""
import base64
from pathlib import Path

import pytest

from app.core.models import ModelCache
from app.core.segmenter import segment_selfie, SegmentResult


class TestModelCache:
    """Tests for ModelCache singleton (Task 1.2.1)."""

    def test_model_cache_singleton(self):
        """Verify ModelCache returns same instance on repeated calls."""
        ModelCache.clear()
        m1 = ModelCache.segmenter()
        m2 = ModelCache.segmenter()
        assert m1 is m2, "ModelCache should return same instance (singleton pattern)"

    def test_model_cache_loads_model(self):
        """Verify model is loaded and version is set."""
        ModelCache.clear()
        model = ModelCache.segmenter()
        assert model.name == "hair-segmenter"
        assert model.version in {"mediapipe-v1.0-general", "stub-v0.1.0"}
        # Either MediaPipe loaded or gracefully fell back to stub
        assert model.backend is not None or model.version == "stub-v0.1.0"

    def test_model_cache_clear(self):
        """Verify ModelCache.clear() resets cache."""
        ModelCache.clear()
        m1 = ModelCache.segmenter()
        ModelCache.clear()
        m2 = ModelCache.segmenter()
        assert m1 is not m2, "After clear(), new instance should be created"


class TestSegmentation:
    """Tests for segmentation logic (Task 1.2.2)."""

    def test_segment_returns_result(self):
        """Verify segment_selfie returns SegmentResult."""
        # Create minimal valid PNG base64
        minimal_png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        selfie = f"data:image/png;base64,{minimal_png_b64}"
        result = segment_selfie(selfie)
        assert isinstance(result, SegmentResult)
        assert result.mask_id
        assert result.backend in {"mediapipe", "stub"}

    def test_segment_handles_invalid_input(self):
        """Verify graceful fallback on invalid input."""
        result = segment_selfie("data:image/png;base64,INVALID_DATA")
        assert result.backend == "stub", "Should fallback to stub on invalid input"
        assert result.mask_id
        assert result.mask is None

    def test_segment_result_metadata(self):
        """Verify SegmentResult has required metadata."""
        minimal_png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        selfie = f"data:image/png;base64,{minimal_png_b64}"
        result = segment_selfie(selfie)
        assert hasattr(result, "mask_id")
        assert hasattr(result, "model_version")
        assert hasattr(result, "mask")
        assert hasattr(result, "backend")
        assert hasattr(result, "width")
        assert hasattr(result, "height")

    def test_segment_with_fixture(self, sample_fixture_path: Path):
        """Test segmentation on real fixture image (Task 1.2.2)."""
        # Load image and convert to base64
        with open(sample_fixture_path, "rb") as f:
            img_bytes = f.read()

        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = sample_fixture_path.suffix.lower()
        mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else "image/png"
        selfie = f"data:{mime};base64,{b64}"

        # Segment
        result = segment_selfie(selfie)

        # Assertions
        assert result.mask_id
        assert result.backend in {"mediapipe", "stub"}

        if result.backend == "mediapipe":
            assert result.mask is not None
            # For real MediaPipe, mask should be uint8
            if result.mask is not None:
                import numpy as np
                assert result.mask.dtype == np.uint8
                assert result.mask.max() <= 255
                assert result.width > 0
                assert result.height > 0


class TestSegmentationThread Safety:
    """Test thread-safe model loading."""

    def test_model_cache_thread_safe(self):
        """Verify ModelCache.segmenter() is thread-safe."""
        import threading
        ModelCache.clear()
        results = []

        def load_model():
            model = ModelCache.segmenter()
            results.append(model)

        threads = [threading.Thread(target=load_model) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All threads should get the same instance
        assert len(results) == 5
        assert all(r is results[0] for r in results), "All threads should get same model instance"
