import pytest

from app.core.errors import (
    ApiError,
    ImageNotFoundError,
    InvalidSelfieDataError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)


def test_api_error_to_dict():
    exc = ApiError(status_code=400, code="TEST", message="msg", details={"a": "b"})
    payload = exc.to_dict("req-1")
    assert payload["code"] == "TEST"
    assert payload["message"] == "msg"
    assert payload["request_id"] == "req-1"
    assert payload["details"]["a"] == "b"


@pytest.mark.parametrize(
    "cls,args,code",
    [
        (PayloadTooLargeError, (1024,), "PAYLOAD_TOO_LARGE"),
        (UnsupportedMediaTypeError, ("image/gif",), "UNSUPPORTED_MEDIA_TYPE"),
        (InvalidSelfieDataError, (), "INVALID_SELFIE"),
        (ImageNotFoundError, ("abc123",), "IMAGE_NOT_FOUND"),
    ],
)
def test_specific_api_errors(cls, args, code):
    exc = cls(*args)
    payload = exc.to_dict("req-2")
    assert payload["code"] == code
    assert payload["request_id"] == "req-2"
