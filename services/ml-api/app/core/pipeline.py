import time
from . import schemas


def recolor_image(color: str, intensity: int) -> str:
    """Mock recolor pipeline that returns a placeholder URL."""
    time.sleep(0.1)
    return f"https://cdn.example.com/processed/{color.replace(' ', '-').lower()}-{intensity}.png"


def process_tryon(payload: schemas.TryOnRequest) -> schemas.TryOnResponse:
    started = time.perf_counter()
    image_url = recolor_image(payload.color, payload.intensity)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return schemas.TryOnResponse(
        image_url=image_url,
        processing_ms=elapsed_ms,
        request_id=payload.request_id,
        color=payload.color,
        details={"intensity": str(payload.intensity)},
    )
