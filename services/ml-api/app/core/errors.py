from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class ApiError(Exception):
    status_code: int
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

    def to_dict(self, request_id: str) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "code": self.code,
            "message": self.message,
            "request_id": request_id,
        }
        if self.details:
            payload["details"] = self.details
        return payload


class PayloadTooLargeError(ApiError):
    def __init__(self, limit_bytes: int):
        super().__init__(
            status_code=413,
            code="PAYLOAD_TOO_LARGE",
            message="La selfie excede el tamaño permitido.",
            details={"max_bytes": str(limit_bytes)},
        )


class UnsupportedMediaTypeError(ApiError):
    def __init__(self, mime_type: str):
        super().__init__(
            status_code=415,
            code="UNSUPPORTED_MEDIA_TYPE",
            message="Formato de imagen no soportado. Usa PNG o JPG.",
            details={"mime_type": mime_type},
        )


class InvalidSelfieDataError(ApiError):
    def __init__(self):
        super().__init__(
            status_code=400,
            code="INVALID_SELFIE",
            message="La selfie enviada es inválida o está corrupta.",
        )


class ImageNotFoundError(ApiError):
    def __init__(self, image_id: str):
        super().__init__(
            status_code=404,
            code="IMAGE_NOT_FOUND",
            message="El recurso de imagen no existe o expiró.",
            details={"image_id": image_id},
        )
