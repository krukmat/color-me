from __future__ import annotations

from typing import Dict

from app.core.recolor import RecolorResult


def build_response_metadata(
    recolor_result: RecolorResult, processing_ms: int
) -> Dict[str, str]:
    """Prepare the safe metadata returned to clients."""
    metadata = {
        **recolor_result.metadata,
        "intensity": str(recolor_result.intensity),
        "processing_ms": str(processing_ms),
    }
    return metadata
