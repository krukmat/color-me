import time

import pytest

from app.core.errors import ImageNotFoundError
from app.core.output_store import OutputStore, placeholder_png_bytes


def test_output_store_save_and_get():
    store = OutputStore(ttl_seconds=10)
    image_id = store.save(placeholder_png_bytes(), "image/png")
    data, content_type = store.get(image_id)
    assert data.startswith(b"\x89PNG")
    assert content_type == "image/png"


def test_output_store_expiry():
    store = OutputStore(ttl_seconds=0)
    image_id = store.save(placeholder_png_bytes(), "image/png")
    time.sleep(0.01)
    with pytest.raises(ImageNotFoundError):
        store.get(image_id)
