from __future__ import annotations

import base64
import os
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple

from app.core.errors import ImageNotFoundError

DEFAULT_TTL_SECONDS = int(os.getenv("OUTPUT_TTL_SECONDS", "300"))
DEFAULT_OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/tmp/color-me-outputs")

_PLACEHOLDER_PNG_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA"
    "AAC0lEQVR42mP8/x8AAwMCAO+7n0kAAAAASUVORK5CYII="
)


def placeholder_png_bytes() -> bytes:
    return base64.b64decode(_PLACEHOLDER_PNG_BASE64)


@dataclass(frozen=True)
class StoredOutput:
    data: bytes
    content_type: str
    expires_at: float


class OutputStore:
    """Ephemeral output store for processed images (TTL-based)."""

    def __init__(
        self,
        output_dir: str = DEFAULT_OUTPUT_DIR,
        ttl_seconds: int = DEFAULT_TTL_SECONDS,
    ) -> None:
        self._output_dir = Path(output_dir)
        self._output_dir.mkdir(parents=True, exist_ok=True)
        self._ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._metadata: Dict[str, StoredOutput] = {}

    def save(self, data: bytes, content_type: str) -> str:
        image_id = uuid.uuid4().hex
        expires_at = time.time() + max(self._ttl_seconds, 0)
        with self._lock:
            self._metadata[image_id] = StoredOutput(
                data=data, content_type=content_type, expires_at=expires_at
            )
        return image_id

    def get(self, image_id: str) -> Tuple[bytes, str]:
        with self._lock:
            output = self._metadata.get(image_id)
            if output is None:
                raise ImageNotFoundError(image_id)
            if output.expires_at <= time.time():
                self._metadata.pop(image_id, None)
                raise ImageNotFoundError(image_id)
            return output.data, output.content_type

    def clear(self) -> None:
        with self._lock:
            self._metadata.clear()


OUTPUT_STORE = OutputStore()
