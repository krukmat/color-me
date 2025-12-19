import asyncio

from fastapi import Request
from fastapi.responses import Response  # type: ignore

from app.middleware.request_id import current_request_id, inject_request_id


def _build_request(headers=None):
    async def receive():
        return {"type": "http.request"}

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"x-timestamp", b"1")] if not headers else headers,
    }
    return Request(scope, receive)


async def _call_next(request: Request) -> Response:
    return Response(status_code=204)


def test_inject_request_id_default():
    request = _build_request()
    response = asyncio.run(inject_request_id(request, _call_next))
    assert "x-request-id" in response.headers
    assert current_request_id(request) != "unknown"


def test_inject_request_id_kwarg():
    headers = [(b"x-request-id", b"custom")]
    request = _build_request(headers=headers)
    response = asyncio.run(inject_request_id(request, _call_next))
    assert response.headers["x-request-id"] == "custom"
    assert current_request_id(request) == "custom"
