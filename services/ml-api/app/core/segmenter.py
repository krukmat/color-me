from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Optional

from app.core.media import decode_selfie_payload
from app.core.models import ModelCache, SegmenterModel

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - optional dependency
    mp = None  # type: ignore


@dataclass(frozen=True)
class SegmentResult:
    mask_id: str
    model_version: str
    mask: Optional[bytes] = None
    backend: str = "stub"


def _fingerprint_selfie(selfie: str) -> str:
    digest = hashlib.sha1(selfie.encode("utf-8")).hexdigest()
    return digest[:12]


def _segment_with_mediapipe(selfie: str, model: SegmenterModel) -> SegmentResult:
    if mp is None or model.backend is None:
        return _segment_stub(selfie, model)
    _, image_bytes = decode_selfie_payload(selfie)
    # MediaPipe integration placeholder: real mask extraction to be added when
    # model assets and runtime are configured.
    mask_id = _fingerprint_selfie(selfie)
    return SegmentResult(
        mask_id=mask_id,
        model_version=model.version,
        mask=image_bytes[:64],
        backend="mediapipe",
    )


def _segment_stub(selfie: str, model: SegmenterModel) -> SegmentResult:
    mask_id = _fingerprint_selfie(selfie)
    return SegmentResult(mask_id=mask_id, model_version=model.version, backend="stub")


def segment_selfie(selfie: str) -> SegmentResult:
    """Segment hair region; uses MediaPipe if available, otherwise stub."""
    model: SegmenterModel = ModelCache.segmenter()
    return _segment_with_mediapipe(selfie, model)
