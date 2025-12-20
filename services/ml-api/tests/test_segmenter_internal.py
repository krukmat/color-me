from types import SimpleNamespace

import numpy as np

from app.core import segmenter as segmenter_module
from app.core.segmenter import SegmenterModel


MINIMAL_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


class _FakeCV2:
    IMREAD_COLOR = 1
    COLOR_BGR2RGB = 2

    def imdecode(self, _nparr, _flags):
        return np.ones((2, 2, 3), dtype=np.uint8) * 128

    def cvtColor(self, image, _flag):
        return image


class _FakeBackend:
    def __init__(self, *, raise_error: bool = False):
        self.raise_error = raise_error

    def process(self, _image_rgb):
        if self.raise_error:
            raise RuntimeError("boom")
        mask = np.ones((2, 2), dtype=np.float32)
        return SimpleNamespace(segmentation_mask=mask)


class _FakeBackendNoMask(_FakeBackend):
    def process(self, _image_rgb):
        return SimpleNamespace(segmentation_mask=None)


class _FakeCV2ReturningNone(_FakeCV2):
    def imdecode(self, _nparr, _flags):
        return None


def _make_selfie() -> str:
    return f"data:image/png;base64,{MINIMAL_PNG_B64}"


def test_segment_with_mediapipe_success(monkeypatch):
    monkeypatch.setattr(segmenter_module, "MP_AVAILABLE", True)
    monkeypatch.setattr(segmenter_module, "cv2", _FakeCV2())

    backend = _FakeBackend()
    model = SegmenterModel(name="hair-segmenter", version="test-v", backend=backend)
    result = segmenter_module._segment_with_mediapipe(_make_selfie(), model)

    assert result.backend == "mediapipe"
    assert result.mask is not None
    assert result.mask.dtype == np.uint8
    assert result.width == 2
    assert result.height == 2


def test_segment_with_mediapipe_falls_back_on_error(monkeypatch):
    monkeypatch.setattr(segmenter_module, "MP_AVAILABLE", True)
    monkeypatch.setattr(segmenter_module, "cv2", _FakeCV2())

    backend = _FakeBackend(raise_error=True)
    model = SegmenterModel(name="hair-segmenter", version="test-v", backend=backend)
    result = segmenter_module._segment_with_mediapipe(_make_selfie(), model)

    assert result.backend == "stub"
    assert result.model_version == model.version


def test_segment_with_mediapipe_shortcircuits_when_unavailable(monkeypatch):
    monkeypatch.setattr(segmenter_module, "MP_AVAILABLE", False)
    backend = _FakeBackend()
    model = SegmenterModel(name="hair-segmenter", version="test-v", backend=backend)
    result = segmenter_module._segment_with_mediapipe(_make_selfie(), model)

    assert result.backend == "stub"


def test_segment_with_mediapipe_falls_back_on_invalid_image(monkeypatch):
    monkeypatch.setattr(segmenter_module, "MP_AVAILABLE", True)
    monkeypatch.setattr(segmenter_module, "cv2", _FakeCV2ReturningNone())

    backend = _FakeBackend()
    model = SegmenterModel(name="hair-segmenter", version="test-v", backend=backend)
    result = segmenter_module._segment_with_mediapipe(_make_selfie(), model)

    assert result.backend == "stub"


def test_segment_with_mediapipe_falls_back_when_mask_missing(monkeypatch):
    monkeypatch.setattr(segmenter_module, "MP_AVAILABLE", True)
    monkeypatch.setattr(segmenter_module, "cv2", _FakeCV2())

    backend = _FakeBackendNoMask()
    model = SegmenterModel(name="hair-segmenter", version="test-v", backend=backend)
    result = segmenter_module._segment_with_mediapipe(_make_selfie(), model)

    assert result.backend == "stub"


def test_segmenter_module_detects_mediapipe(monkeypatch):
    import importlib
    import sys

    fake_mp = SimpleNamespace()
    monkeypatch.setitem(sys.modules, "mediapipe", fake_mp)

    importlib.reload(segmenter_module)
    assert segmenter_module.MP_AVAILABLE is True

    monkeypatch.delitem(sys.modules, "mediapipe")
    importlib.reload(segmenter_module)
    segmenter_module.ModelCache.clear()
