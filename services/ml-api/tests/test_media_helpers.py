import base64

import pytest

from app.core.media import (
    MAX_SELFIE_BYTES,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
    decode_selfie_payload,
    validate_selfie_payload,
)


def _fixture_base64():
    return base64.b64encode(b"abc").decode()


def test_validate_selfie_payload_success():
    selfie = f"data:image/png;base64,{_fixture_base64()}"
    info = validate_selfie_payload(selfie)
    assert info.mime_type == "image/png"


def test_validate_selfie_payload_size_limit():
    big = base64.b64encode(b"a" * (MAX_SELFIE_BYTES + 1)).decode()
    with pytest.raises(PayloadTooLargeError):
        validate_selfie_payload(f"data:image/png;base64,{big}")


def test_decode_selfie_payload_returns_bytes():
    selfie = f"data:image/jpeg;base64,{_fixture_base64()}"
    mime, data = decode_selfie_payload(selfie)
    assert mime == "image/jpeg"
    assert data == base64.b64decode(_fixture_base64())


def test_decode_selfie_payload_invalid_mime():
    payload = f"data:image/gif;base64,{_fixture_base64()}"
    with pytest.raises(UnsupportedMediaTypeError):
        decode_selfie_payload(payload)
