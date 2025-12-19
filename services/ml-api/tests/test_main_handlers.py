import asyncio

import pytest
pytest.importorskip("fastapi")
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse, Response

from app.core.errors import ApiError
from app.main import (
    _collect_validation_errors,
    api_error_handler,
    generic_exception_handler,
    validation_exception_handler,
)


def _build_request():
    async def receive():
        return {"type": "http.request"}

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [],
    }
    return Request(scope, receive)


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
