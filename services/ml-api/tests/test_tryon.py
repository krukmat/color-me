import pytest
from pydantic import ValidationError

from app.core.pipeline import process_tryon
from app.schemas.tryon import TryOnRequest, TryOnResponse


def _make_selfie_payload() -> str:
    return "data:image/png;base64,ZmFrZS1kYXRh"


def test_process_tryon_has_expected_fields():
    payload = TryOnRequest(
        selfie=_make_selfie_payload(),
        color="Sunlit Amber",
        intensity=50,
        request_id="req-123",
    )
    response: TryOnResponse = process_tryon(payload, base_url="http://localhost")

    assert response.request_id == "req-123"
    assert response.color == "Sunlit Amber"
    assert response.processing_ms >= 1
    assert response.details is not None
    assert response.image_url.startswith("http://localhost/images/")
    assert "mask_hash" in response.details


def test_tryon_request_defaults_intensity():
    payload = TryOnRequest(
        selfie=_make_selfie_payload(),
        color="Copper Bloom",
        request_id="req-abc",
    )
    assert payload.intensity == 50


def test_tryon_request_rejects_invalid_color():
    with pytest.raises(ValidationError):
        TryOnRequest(
            selfie=_make_selfie_payload(),
            color="Invalid Color",
            intensity=40,
            request_id="req-xyz",
        )
