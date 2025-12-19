import time

from app import schemas
from app.core.media import validate_selfie_payload
from app.core.output_store import OUTPUT_STORE, placeholder_png_bytes
from app.core.postprocess import apply_postprocess
from app.core.recolor import apply_recolor
from app.core.segmenter import segment_selfie


def process_tryon(
    payload: schemas.TryOnRequest, base_url: str
) -> schemas.TryOnResponse:
    """Orchestrate segmentation → recolor → response assembly."""
    started = time.perf_counter()
    media_info = validate_selfie_payload(payload.selfie)
    segment = segment_selfie(payload.selfie)
    recolor = apply_recolor(segment, payload.color, payload.intensity)
    elapsed_ms = max(int((time.perf_counter() - started) * 1000), 1)
    image_id = OUTPUT_STORE.save(
        data=placeholder_png_bytes(), content_type=media_info.mime_type
    )
    image_url = f"{base_url}/images/{image_id}"

    metadata = apply_postprocess(segment, recolor, payload.intensity)
    return schemas.TryOnResponse(
        image_url=image_url,
        processing_ms=elapsed_ms,
        request_id=payload.request_id,
        color=recolor.color,
        details=metadata
        | {"mime_type": media_info.mime_type},
    )
