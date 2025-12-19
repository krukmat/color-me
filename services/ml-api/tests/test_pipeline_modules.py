from app.core.models import ModelCache
from app.core.recolor import apply_recolor
from app.core.segmenter import segment_selfie


def test_model_cache_returns_singleton():
    ModelCache.clear()
    first = ModelCache.segmenter()
    second = ModelCache.segmenter()
    assert first is second
    assert first.name == "mock-segmenter"


def test_segment_and_recolor_flow():
    selfie = "data:image/png;base64,AAA"
    segment = segment_selfie(selfie)
    recolor = apply_recolor(segment, color="Sunlit Amber", intensity=65)

    assert segment.mask_id
    assert recolor.metadata["segment_mask_id"] == segment.mask_id
    assert recolor.color == "Sunlit Amber"
    assert "sunlit-amber" in recolor.image_url
