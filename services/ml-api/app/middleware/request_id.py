from fastapi import Request
from fastapi.responses import Response
from uuid import uuid4

async def inject_request_id(request: Request, call_next):
    header_value = request.headers.get("x-request-id")
    request_id = header_value or str(uuid4())
    request.state.request_id = request_id
    response: Response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response

def current_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")
