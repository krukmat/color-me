from app.schemas.tryon import TryOnRequest, TryOnResponse
from app.core.pipeline import process_tryon


def test_process_tryon_has_expected_fields():
    payload = TryOnRequest(
        selfie="any",
        color="Sunlit Amber",
        intensity=50,
        request_id="req-123",
    )
    response: TryOnResponse = process_tryon(payload)

    assert response.request_id == "req-123"
    assert response.color == "Sunlit Amber"
    assert response.processing_ms >= 0
    assert response.details is not None
