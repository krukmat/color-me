from __future__ import annotations

from typing import Dict, Optional

from app.core.recolor import RecolorResult
from app.core.segmenter import SegmentResult


def smooth_mask(mask: Optional[bytes]) -> bytes:
    """Placeholder for feathering/smoothing mask operations."""
    if not mask:
        return b""
    # Simple no-op: ensure mask bytes are within safe range
    return bytes(min(255, b) for b in mask)


def apply_postprocess(
    segment: SegmentResult, recolor_result: RecolorResult, intensity: int
) -> Dict[str, str]:
    """Apply post-processing steps such as anti-bleed and metadata assembly."""
    smoothed = smooth_mask(segment.mask)
    metadata = {
        **recolor_result.metadata,
        "intensity": str(intensity),
        "processing_ms": str(int(recolor_result.intensity or intensity)),
        "mask_hash": segment.mask_id,
        "smoothed_mask_len": str(len(smoothed)),
        "backend": segment.backend,
    }
    return metadata
