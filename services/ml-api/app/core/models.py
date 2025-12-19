from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any, Optional


@dataclass
class SegmenterModel:
    name: str
    version: str
    backend: Any


class ModelCache:
    """Simple in-process cache for expensive ML models."""

    _segmenter_model: Optional[SegmenterModel] = None
    _lock = Lock()

    @classmethod
    def segmenter(cls) -> SegmenterModel:
        with cls._lock:
            if cls._segmenter_model is None:
                cls._segmenter_model = SegmenterModel(
                    name="mediapipe-segmenter",
                    version="v0.1.0",
                    backend=None,
                )
            return cls._segmenter_model

    @classmethod
    def clear(cls) -> None:
        with cls._lock:
            cls._segmenter_model = None
