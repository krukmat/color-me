from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Optional

import numpy as np

from app.core.media import decode_selfie_payload
from app.core.models import ModelCache, SegmenterModel

logger = logging.getLogger(__name__)

try:
    import cv2
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    MP_AVAILABLE = False
    cv2 = None  # type: ignore
    mp = None  # type: ignore


@dataclass(frozen=True)
class SegmentResult:
    """Result of hair segmentation operation.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.2
    """
    mask_id: str
    model_version: str
    mask: Optional[np.ndarray] = None  # Binary mask (0-255 uint8)
    backend: str = "stub"
    width: int = 0
    height: int = 0


def _fingerprint_selfie(selfie: str) -> str:
    """Generate unique ID for selfie (for caching/logging).

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.2
    """
    digest = hashlib.sha1(selfie.encode("utf-8")).hexdigest()
    return digest[:12]


def _segment_with_mediapipe(selfie: str, model: SegmenterModel) -> SegmentResult:
    """Segment hair using MediaPipe SelfieSegmentation.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.2
    """
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
        logger.warning(
            f"MediaPipe segmentation failed, using stub fallback. "
            f"Error: {type(e).__name__}: {str(e)}"
        )
        return _segment_stub(selfie, model)


def _segment_stub(selfie: str, model: SegmenterModel) -> SegmentResult:
    """Stub segmentation (returns placeholder mask ID).

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.2
    """
    mask_id = _fingerprint_selfie(selfie)
    return SegmentResult(
        mask_id=mask_id,
        model_version=model.version,
        backend="stub"
    )


def segment_selfie(selfie: str) -> SegmentResult:
    """Segment hair region from selfie.

    Uses MediaPipe SelfieSegmentation if available, otherwise stub.

    Args:
        selfie: Base64-encoded image (data:image/png;base64,...)

    Returns:
        SegmentResult with mask and metadata

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.2
    """
    model: SegmenterModel = ModelCache.segmenter()
    return _segment_with_mediapipe(selfie, model)
