from __future__ import annotations

from dataclasses import dataclass

from app.core.segmenter import SegmentResult


@dataclass(frozen=True)
class RecolorResult:
    image_url: str
    color: str
    intensity: int
    metadata: dict[str, str]


def apply_recolor(segment: SegmentResult, color: str, intensity: int) -> RecolorResult:
    """Mock recolor step that produces a deterministic URL for demo/testing."""
    slug = color.replace(" ", "-").lower()
    image_url = f"https://cdn.example.com/processed/{slug}-{intensity}-{segment.mask_id}.png"
    metadata = {
        "segment_mask_id": segment.mask_id,
        "segment_model_version": segment.model_version,
    }
    return RecolorResult(
        image_url=image_url,
        color=color,
        intensity=intensity,
        metadata=metadata,
    )
