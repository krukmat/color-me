"""Tests for postprocess.py (Task 1.4.1).

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4
"""
import numpy as np
import pytest

from app.core import postprocess as postprocess_module
from app.core.postprocess import PostprocessConfig, apply_postprocess, postprocess_mask
from app.core.recolor import RecolorResult
from app.core.segmenter import SegmentResult


class TestPostprocessMask:
    """Tests for postprocess_mask function (Task 1.4.1)."""

    def test_postprocess_handles_none(self):
        """Test graceful handling of None mask."""
        result = postprocess_mask(None)
        assert result is None

    def test_postprocess_handles_empty(self):
        """Test graceful handling of empty mask."""
        mask = np.zeros((0, 0), dtype=np.uint8)
        result = postprocess_mask(mask)
        assert result.size == 0

    def test_postprocess_feathering_blurs_edges(self):
        """Test feathering (blur) on mask smooths edges.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
        """
        # Create sharp mask with clear edge
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[25:75, 25:75] = 255  # Square mask

        config = PostprocessConfig(feather_radius=5, enable_erosion=False, enable_dilation=False)
        result = postprocess_mask(mask, config)

        # After blur, edges should be smoothed (not sharp 0→255)
        # Check that border pixels are now non-zero (blurred)
        assert result[24, 50] > 0, "Edge pixels should be blurred (non-zero)"
        assert result[24, 50] < 255, "Edge pixels should not be fully white"
        assert result[50, 50] > 200, "Center should remain high"

    def test_postprocess_erosion_removes_noise(self):
        """Test erosion removes small noise.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
        """
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[25:75, 25:75] = 255  # Main region
        mask[10, 10] = 255  # Single pixel noise

        config = PostprocessConfig(enable_erosion=True, morph_kernel_size=3, feather_radius=0)
        result = postprocess_mask(mask, config)

        # Single pixel noise should be removed by erosion
        assert result[10, 10] == 0, "Single-pixel noise should be removed by erosion"
        # Main region should still exist (but slightly smaller)
        assert result[50, 50] > 0, "Main region should survive erosion"

    def test_postprocess_dilation_fills_holes(self):
        """Test dilation fills small holes.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
        """
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[25:75, 25:75] = 255
        mask[50, 50] = 0  # Hole in center

        config = PostprocessConfig(enable_dilation=True, morph_kernel_size=3, feather_radius=0)
        result = postprocess_mask(mask, config)

        # Dilation should fill small holes
        assert result[50, 50] > 0, "Dilation should fill small holes"

    def test_postprocess_antibleed_maintains_edges(self):
        """Test anti-bleed threshold maintains edge definition.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
        """
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[25:75, 25:75] = 255

        # First blur the mask
        config_blur = PostprocessConfig(feather_radius=5, anti_bleed_threshold=0)
        blurred = postprocess_mask(mask, config_blur)

        # Then apply antibleed
        config_antibleed = PostprocessConfig(
            feather_radius=0,
            anti_bleed_threshold=100  # High threshold to preserve definition
        )
        antibled = postprocess_mask(blurred, config_antibleed)

        # Antibleed should threshold the blurred result back to binary
        assert antibled[50, 50] == 255, "Center should be white (above threshold)"
        assert antibled[20, 50] == 0, "Far edge should be black (below threshold)"

    def test_postprocess_config_defaults(self):
        """Test PostprocessConfig default values.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
        """
        config = PostprocessConfig()
        assert config.feather_radius == 5
        assert config.morph_kernel_size == 3
        assert config.enable_erosion is False
        assert config.enable_dilation is False
        assert config.anti_bleed_threshold == 10

    def test_postprocess_preserves_dtype(self):
        """Test postprocess_mask preserves uint8 dtype."""
        mask = np.ones((50, 50), dtype=np.uint8) * 128
        config = PostprocessConfig(feather_radius=3)
        result = postprocess_mask(mask, config)
        assert result.dtype == np.uint8

    def test_postprocess_chain_operations(self):
        """Test chaining multiple operations (erode → feather → threshold)."""
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[30:70, 30:70] = 255
        mask[50, 50] = 0  # Small hole

        config = PostprocessConfig(
            feather_radius=3,
            morph_kernel_size=3,
            enable_erosion=True,
            enable_dilation=False,
            anti_bleed_threshold=50
        )
        result = postprocess_mask(mask, config)

        # Result should be binary and similar in size
        assert result.min() in {0, 1}  # Binary after threshold
        assert result.max() in {0, 255}  # Binary after threshold


def _dummy_segment():
    return SegmentResult(mask_id="mask-id", model_version="stub-v0.1.0")


def _dummy_recolor(intensity: int) -> RecolorResult:
    return RecolorResult(
        image_url="https://cdn.example.com",
        color="Sunlit Amber",
        intensity=intensity,
        metadata={
            "segment_mask_id": "mask-id",
            "segment_model_version": "stub-v0.1.0",
        },
    )


def test_postprocess_mask_returns_original_when_cv2_unavailable(monkeypatch):
    monkeypatch.setattr(postprocess_module, "CV2_AVAILABLE", False)
    mask = np.ones((4, 4), dtype=np.uint8)
    result = postprocess_mask(mask)
    assert result is mask


def test_apply_postprocess_high_intensity_uses_max_feathering():
    segment = _dummy_segment()
    recolor = _dummy_recolor(intensity=80)
    metadata = apply_postprocess(segment, recolor, intensity=80)
    assert "feather_radius=7" in metadata["postprocess"]


def test_apply_postprocess_low_intensity_uses_min_feathering():
    segment = _dummy_segment()
    recolor = _dummy_recolor(intensity=20)
    metadata = apply_postprocess(segment, recolor, intensity=20)
    assert "feather_radius=3" in metadata["postprocess"]
