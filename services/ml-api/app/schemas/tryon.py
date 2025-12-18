from pydantic import BaseModel, Field


class TryOnRequest(BaseModel):
    selfie: str = Field(..., description="Base64 or multipart upload placeholder.")
    color: str = Field(..., min_length=1, description="One of the 10 palette names.")
    intensity: int = Field(..., ge=0, le=100, description="Slider 0-100.")
    request_id: str = Field(..., description="Trace ID from BFF.")


class TryOnResponse(BaseModel):
    image_url: str
    processing_ms: int
    request_id: str
    color: str
    details: dict[str, str] | None = None
