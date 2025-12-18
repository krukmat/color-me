import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from .schemas.tryon import TryOnRequest, TryOnResponse
from .core.pipeline import process_tryon
from .middleware.request_id import inject_request_id, current_request_id

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Color Me ML", version="0.1.0")

app.middleware("http")(inject_request_id)


@app.post("/try-on", response_model=TryOnResponse)
async def try_on(payload: TryOnRequest, request: Request) -> TryOnResponse:
    request_id = current_request_id(request)
    logging.info("Processing try-on request %s", request_id)
    result = process_tryon(payload)
    return result


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
