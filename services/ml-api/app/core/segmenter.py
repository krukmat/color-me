from __future__ import annotations

import hashlib
from dataclasses import dataclass

from app.core.models import ModelCache, SegmenterModel


@dataclass(frozen=True)
class SegmentResult:
    mask_id: str
    model_version: str


def _fingerprint_selfie(selfie: str) -> str:
    digest = hashlib.sha1(selfie.encode("utf-8")).hexdigest()
    return digest[:12]


def segment_selfie(selfie: str) -> SegmentResult:
    """Pure-ish segmentation stub that simulates generating a mask id."""
    model: SegmenterModel = ModelCache.segmenter()
    mask_id = _fingerprint_selfie(selfie)
    return SegmentResult(mask_id=mask_id, model_version=model.version)
