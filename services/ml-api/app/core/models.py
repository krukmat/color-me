from __future__ import annotations

import logging
from dataclasses import dataclass
from threading import Lock
from typing import Any, Optional

logger = logging.getLogger(__name__)

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
    """Thread-safe singleton cache for ML models.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.1
    """

    _segmenter_model: Optional[SegmenterModel] = None
    _lock = Lock()

    @classmethod
    def segmenter(cls) -> SegmenterModel:
        """Load MediaPipe SelfieSegmentation model (lazy, thread-safe).

        Uses model_selection=1 (general model, faster).
        Falls back to stub if MediaPipe unavailable.

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.1
        """
        with cls._lock:
            if cls._segmenter_model is None:
                if MP_AVAILABLE:
                    # model=1: General model (faster, good for most cases)
                    # model=0: Landscape model (more accurate, slower)
                    try:
                        mp_model = mp.solutions.selfie_segmentation.SelfieSegmentation(
                            model_selection=1  # General model
                        )
                        backend = mp_model
                        version = "mediapipe-v1.0-general"
                    except Exception as e:  # pragma: no cover
                        logger.warning(
                            f"Failed to load MediaPipe model: {type(e).__name__}: {str(e)}. "
                            f"Using stub fallback."
                        )
                        backend = None
                        version = "stub-v0.1.0"
                else:
                    backend = None
                    version = "stub-v0.1.0"

                cls._segmenter_model = SegmenterModel(
                    name="hair-segmenter",
                    version=version,
                    backend=backend,
                )
                logger.info(
                    f"Loaded segmenter model: {cls._segmenter_model.version} "
                    f"(backend={'mediapipe' if MP_AVAILABLE and backend else 'stub'})"
                )
            return cls._segmenter_model

    @classmethod
    def clear(cls) -> None:
        """Clear cached models (for testing).

        Task: ML_TRAINING_EXECUTION_PLAN.md § 1.2.1
        """
        with cls._lock:
            if cls._segmenter_model and cls._segmenter_model.backend:
                try:
                    cls._segmenter_model.backend.close()
                except Exception:  # pragma: no cover
                    pass
            cls._segmenter_model = None
