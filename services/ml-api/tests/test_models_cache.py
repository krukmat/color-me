import importlib
import sys
import types

from app.core import models as models_module
from app.core.models import ModelCache, SegmenterModel


class _FakeSegmenter:
    def __init__(self, model_selection: int):
        self.model_selection = model_selection
        self.closed = False

    def close(self) -> None:
        self.closed = True


class _ErrorSegmenter:
    def __init__(self, *args, **kwargs):
        raise RuntimeError("boom")


def test_model_cache_loads_mediapipe_when_available(monkeypatch):
    fake_mp = types.SimpleNamespace(
        solutions=types.SimpleNamespace(
            selfie_segmentation=types.SimpleNamespace(
                SelfieSegmentation=_FakeSegmenter
            )
        )
    )

    monkeypatch.setattr(models_module, "mp", fake_mp)
    monkeypatch.setattr(models_module, "MP_AVAILABLE", True)

    ModelCache.clear()
    model = ModelCache.segmenter()
    assert isinstance(model.backend, _FakeSegmenter)
    assert model.version == "mediapipe-v1.0-general"
    ModelCache.clear()


def test_model_cache_falls_back_to_stub_on_load_failure(monkeypatch):
    failing_mp = types.SimpleNamespace(
        solutions=types.SimpleNamespace(
            selfie_segmentation=types.SimpleNamespace(
                SelfieSegmentation=_ErrorSegmenter
            )
        )
    )

    monkeypatch.setattr(models_module, "mp", failing_mp)
    monkeypatch.setattr(models_module, "MP_AVAILABLE", True)

    ModelCache.clear()
    model = ModelCache.segmenter()
    assert model.backend is None
    assert model.version == "stub-v0.1.0"
    ModelCache.clear()


def test_model_cache_clear_closes_backend():
    class DummyBackend:
        def __init__(self):
            self.closed = False

        def close(self):
            self.closed = True

    ModelCache.clear()
    backend = DummyBackend()
    ModelCache._segmenter_model = SegmenterModel(
        name="hair-segmenter",
        version="stub-v0.1.0",
        backend=backend,
    )

    ModelCache.clear()
    assert backend.closed
    assert ModelCache._segmenter_model is None


def test_models_module_detects_mediapipe(monkeypatch):
    fake_mp = types.SimpleNamespace()
    monkeypatch.setitem(sys.modules, "mediapipe", fake_mp)

    importlib.reload(models_module)
    assert models_module.MP_AVAILABLE is True

    monkeypatch.delitem(sys.modules, "mediapipe")
    importlib.reload(models_module)
    ModelCache.clear()
