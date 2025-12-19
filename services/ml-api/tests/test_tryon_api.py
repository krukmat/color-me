import base64

import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient  # type: ignore

from app.main import app

client = TestClient(app)


def _make_payload(selfie_base64: str):
    return {
        "selfie": f"data:image/png;base64,{selfie_base64}",
        "color": "Sunlit Amber",
        "intensity": 50,
        "request_id": "req-test",
    }


def test_try_on_rejects_large_payload(monkeypatch):
    from app.core import media

    monkeypatch.setattr(media, "MAX_SELFIE_BYTES", 10)
    big_data = base64.b64encode(b"a" * 20).decode()
    response = client.post("/try-on", json=_make_payload(big_data))
    assert response.status_code == 413
    assert response.json()["code"] == "PAYLOAD_TOO_LARGE"


def test_try_on_rejects_bad_mime():
    payload = {
        "selfie": f"data:image/gif;base64,{base64.b64encode(b'aaa').decode()}",
        "color": "Sunlit Amber",
        "intensity": 50,
        "request_id": "req-test",
    }
    response = client.post("/try-on", json=payload)
    assert response.status_code == 415
    assert response.json()["code"] == "UNSUPPORTED_MEDIA_TYPE"
