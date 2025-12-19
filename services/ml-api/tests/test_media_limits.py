import base64

import pytest
from pydantic import ValidationError

from app.core.errors import (
    InvalidSelfieDataError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)
from app.core.media import MAX_SELFIE_BYTES, validate_selfie_payload
from app.schemas.tryon import TryOnRequest


def test_validate_selfie_payload_allows_png_data_url():
    data = base64.b64encode(b"fake-bytes").decode()
    payload = f"data:image/png;base64,{data}"
    info = validate_selfie_payload(payload)
    assert info.mime_type == "image/png"
    assert info.size_bytes == len(b"fake-bytes")


def test_validate_selfie_payload_rejects_large_file():
    big_bytes = b"a" * (MAX_SELFIE_BYTES + 10)
    big_data = base64.b64encode(big_bytes).decode()
    payload = f"data:image/png;base64,{big_data}"
    with pytest.raises(PayloadTooLargeError):
        validate_selfie_payload(payload)


def test_validate_selfie_payload_rejects_mime():
    data = base64.b64encode(b"a").decode()
    with pytest.raises(UnsupportedMediaTypeError):
        validate_selfie_payload(f"data:image/gif;base64,{data}")


def test_validate_selfie_payload_invalid_string():
    with pytest.raises(InvalidSelfieDataError):
        validate_selfie_payload("not-base64!")


def test_schema_still_catches_length_limit():
    valid = base64.b64encode(b"a").decode()
    TryOnRequest(
        selfie=f"data:image/png;base64,{valid}",
        color="Sunlit Amber",
        intensity=50,
        request_id="req-x",
    )
