import asyncio

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse  # type: ignore
from app.core.errors import ApiError
from app.main import (
    _collect_validation_errors,
    api_error_handler,
    generic_exception_handler,
    get_image,
    try_on,
    validation_exception_handler,
)
from app.schemas.tryon import TryOnRequest
from app.core.output_store import OUTPUT_STORE


def _build_request():
    return Request(headers={}, base_url="http://testserver/")


def test_collect_validation_errors():
    errors = [
        {"loc": ["body", "color"], "msg": "invalid"},
        {"loc": ["body", "intensity"], "msg": "too low"},
    ]
    table = _collect_validation_errors(errors)
    assert "body.color" in table
    assert table["body.intensity"][0] == "too low"


def test_validation_exception_handler():
    request = _build_request()

    exc = RequestValidationError(
        errors=[{"loc": ["body", "color"], "msg": "invalid"}], body=None
    )
    response = asyncio.run(validation_exception_handler(request, exc))
    assert isinstance(response, JSONResponse)
    assert response.status_code == 400
    assert response.body


def test_try_on_and_get_image_roundtrip():
    payload = TryOnRequest(
        selfie="data:image/png;base64,ZmFrZS1kYXRh",
        color="Sunlit Amber",
        intensity=50,
        request_id="req-test",
    )
    request = _build_request()
    response = asyncio.run(try_on(payload, request))
    assert response.image_url.startswith("http://testserver/images/")

    image_id = response.image_url.rsplit("/", 1)[-1]
    image_response = asyncio.run(get_image(image_id, request))
    assert image_response.status_code == 200


def test_api_error_handler():
    request = _build_request()
    exc = ApiError(status_code=413, code="PAYLOAD_TOO_LARGE", message="too big")
    response = asyncio.run(api_error_handler(request, exc))
    assert response.status_code == 413
    assert "code" in response.body.decode()


def test_generic_exception_handler():
    request = _build_request()
    response = asyncio.run(generic_exception_handler(request, RuntimeError("boom")))
    assert response.status_code == 500
    assert isinstance(response, JSONResponse)
