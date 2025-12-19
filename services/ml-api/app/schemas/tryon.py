from typing import Annotated

from pydantic import AnyUrl, BaseModel, Field, PositiveInt

try:
    from pydantic import field_validator
except ImportError:  # pragma: no cover - fallback for Pydantic v1
    from pydantic import validator as field_validator  # type: ignore

from app.core.palette import (
    DEFAULT_INTENSITY,
    MAX_INTENSITY,
    MIN_INTENSITY,
    PALETTE_NAMES,
)

MAX_SELFIE_BASE64_CHARS = 8_000_000  # ~6 MB payload allowance

SelfieStr = Annotated[
    str,
    Field(
        min_length=1,
        max_length=MAX_SELFIE_BASE64_CHARS,
        description="Base64 string (data URL or raw base64).",
        examples=["data:image/png;base64,iVBORw0KGgoAAA..."],
    ),
]

RequestIdStr = Annotated[
    str,
    Field(
        min_length=5,
        max_length=64,
        description="Trace ID propagated from BFF (x-request-id).",
        examples=["req-123-abc"],
    ),
]


class TryOnRequest(BaseModel):
    selfie: SelfieStr
    color: str = Field(..., min_length=1, description="One of the palette names.")
    intensity: int = Field(
        default=DEFAULT_INTENSITY,
        ge=MIN_INTENSITY,
        le=MAX_INTENSITY,
        description="Slider 0-100 (steps of 5 enforced upstream).",
    )
    request_id: RequestIdStr

    @field_validator("color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        if value not in PALETTE_NAMES:
            raise ValueError("Color no soportado.")
        return value


class TryOnResponse(BaseModel):
    image_url: AnyUrl
    processing_ms: PositiveInt = Field(
        ..., description="Time spent processing the image in milliseconds."
    )
    request_id: RequestIdStr
    color: str
    details: dict[str, str] | None = Field(
        default=None,
        description="Optional metadata (no base64/raw image data).",
    )
