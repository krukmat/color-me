from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import numpy as np

from app.core.recolor import RecolorResult
from app.core.segmenter import SegmentResult

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:  # pragma: no cover
    CV2_AVAILABLE = False
    cv2 = None  # type: ignore


@dataclass
class PostprocessConfig:
    """Post-processing configuration.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
    """
    feather_radius: int = 5  # Gaussian blur radius (pixels)
    morph_kernel_size: int = 3  # Morphological ops kernel
    enable_erosion: bool = False  # Remove small noise
    enable_dilation: bool = False  # Fill small holes
    anti_bleed_threshold: int = 10  # Edge refinement threshold


def postprocess_mask(
    mask: Optional[np.ndarray],
    config: Optional[PostprocessConfig] = None
) -> Optional[np.ndarray]:
    """Apply post-processing to segmentation mask.

    Args:
        mask: Binary mask (0-255 uint8)
        config: Post-processing config (defaults if None)

    Returns:
        Improved mask (0-255 uint8) or None if input is None

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
    """
    if not CV2_AVAILABLE:
        return mask

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

    # Anti-bleed (threshold after blur to maintain edge definition)
    if config.anti_bleed_threshold > 0:
        _, processed = cv2.threshold(
            processed,
            config.anti_bleed_threshold,
            255,
            cv2.THRESH_BINARY
        )

    return processed


def apply_postprocess(
    segment: SegmentResult, recolor_result: RecolorResult, intensity: int
) -> Dict[str, str]:
    """Apply post-processing and return metadata.

    For now, returns metadata only (mask ops in future PR).
    Intensity-based config: higher intensity = more aggressive feathering.

    Args:
        segment: Segmentation result
        recolor: Recolor result
        intensity: User intensity (0-100)

    Returns:
        Metadata dict with post-processing details

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.4.1
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
        **recolor_result.metadata,
        "intensity": str(intensity),
        "processing_ms": str(int(recolor_result.intensity or intensity)),
        "mask_hash": segment.mask_id,
        "backend": segment.backend,
        "postprocess": {
            "feather_radius": str(feather),
            "morph_ops": "false",  # Disabled for Phase 1 (simple)
            "anti_bleed": "false",
        },
    }

    # Future: Apply postprocess_mask() and composite result
    # For Phase 1, metadata only (no actual mask ops in pipeline yet)

    return metadata
