from __future__ import annotations

import base64
import re
from dataclasses import dataclass
from typing import Tuple

from app.core.errors import (
    InvalidSelfieDataError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
)

SUPPORTED_MIME_TYPES = {"image/png", "image/jpeg"}
MAX_SELFIE_BYTES = 6 * 1024 * 1024  # 6 MB

DATA_URL_REGEX = re.compile(
    r"^data:(?P<mime>[\w/+.-]+);base64,(?P<data>[A-Za-z0-9+/=\s]+)$"
)


@dataclass(frozen=True)
class MediaInfo:
    mime_type: str
    size_bytes: int


def _split_selfie_payload(selfie: str) -> Tuple[str, str]:
    """Return (mime_type, base64_data). Defaults mime when prefix missing."""
    match = DATA_URL_REGEX.match(selfie.strip())
    if match:
        return match.group("mime"), match.group("data")
    # assume raw base64 PNG if no prefix, but validate characters
    if not re.fullmatch(r"[A-Za-z0-9+/=\s]+", selfie):
        raise InvalidSelfieDataError()
    return "image/png", selfie


def _decode_base64(base64_str: str) -> bytes:
    cleaned = "".join(base64_str.split())
    if not cleaned:
        raise InvalidSelfieDataError()
    try:
        return base64.b64decode(cleaned, validate=True)
    except Exception as exc:  # pragma: no cover - wrap decode errors
        raise InvalidSelfieDataError() from exc


def _estimate_bytes(base64_str: str) -> int:
    return len(_decode_base64(base64_str))


def validate_selfie_payload(selfie: str) -> MediaInfo:
    mime_type, data = _split_selfie_payload(selfie)
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedMediaTypeError(mime_type)
    size_bytes = _estimate_bytes(data)
    if size_bytes > MAX_SELFIE_BYTES:
        raise PayloadTooLargeError(MAX_SELFIE_BYTES)
    return MediaInfo(mime_type=mime_type, size_bytes=size_bytes)


def decode_selfie_payload(selfie: str) -> Tuple[str, bytes]:
    mime_type, data = _split_selfie_payload(selfie)
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedMediaTypeError(mime_type)
    decoded = _decode_base64(data)
    if len(decoded) > MAX_SELFIE_BYTES:
        raise PayloadTooLargeError(MAX_SELFIE_BYTES)
    return mime_type, decoded
