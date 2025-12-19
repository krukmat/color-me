import logging
from typing import Any, Dict, List

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .core.errors import ApiError
from .schemas.tryon import TryOnRequest, TryOnResponse
from .core.output_store import OUTPUT_STORE
from .core.pipeline import process_tryon
from .middleware.request_id import inject_request_id, current_request_id

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Color Me ML", version="0.1.0")

app.middleware("http")(inject_request_id)


@app.post("/try-on", response_model=TryOnResponse)
async def try_on(payload: TryOnRequest, request: Request) -> TryOnResponse:
    request_id = current_request_id(request)
    logging.info("Processing try-on request %s", request_id)
    base_url = str(request.base_url).rstrip("/")
    result = process_tryon(payload, base_url=base_url)
    return result


@app.get("/images/{image_id}")
async def get_image(image_id: str, request: Request) -> Response:
    data, content_type = OUTPUT_STORE.get(image_id)
    return Response(content=data, media_type=content_type)


def _collect_validation_errors(errors: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    field_map: Dict[str, List[str]] = {}
    for error in errors:
        loc_parts = [
            str(part)
            for part in error.get("loc", [])
            if isinstance(part, (str, int))
        ]
        loc_key = ".".join(loc_parts) if loc_parts else "payload"
        field_map.setdefault(loc_key, []).append(error.get("msg", "invalid"))
    return field_map


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    request_id = current_request_id(request)
    logging.info("Validation error (%s): %s", request_id, exc.errors())
    return JSONResponse(
        status_code=400,
        content={
            "code": "INVALID_PAYLOAD",
            "message": "Revisa los campos enviados.",
            "request_id": request_id,
            "details": _collect_validation_errors(exc.errors()),
        },
    )


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    request_id = current_request_id(request)
    logging.info("API error (%s): %s", request_id, exc.code)
    return JSONResponse(
        status_code=exc.status_code, content=exc.to_dict(request_id)
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    request_id = current_request_id(request)
    logging.exception("Unhandled exception (%s)", request_id)
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "Error procesando la imagen.",
            "request_id": request_id,
        },
    )
