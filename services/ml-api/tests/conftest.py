import importlib.util
import json
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOT_STR = str(ROOT)
if ROOT_STR not in sys.path:
    sys.path.insert(0, ROOT_STR)


def _install_fastapi_stub() -> None:
    if "fastapi" in sys.modules or importlib.util.find_spec("fastapi") is not None:
        return

    fastapi = types.ModuleType("fastapi")
    fastapi.__stub__ = True

    class Request:
        def __init__(
            self,
            scope=None,
            receive=None,
            send=None,
            headers=None,
            base_url="http://testserver/",
        ):
            header_pairs = []
            if isinstance(scope, dict):
                header_pairs = scope.get("headers", [])
            elif headers is not None:
                header_pairs = headers
            elif scope is not None:
                header_pairs = scope
            normalized = {}
            iterator = header_pairs.items() if isinstance(header_pairs, dict) else header_pairs
            for key, value in iterator or []:
                if isinstance(key, bytes):
                    key = key.decode()
                if isinstance(value, bytes):
                    value = value.decode()
                normalized[key] = value
            self.headers = normalized
            self.base_url = base_url
            self.state = types.SimpleNamespace()

    class Response:
        def __init__(self, content=b"", media_type=None, status_code=200):
            self.content = content
            self.media_type = media_type
            self.status_code = status_code
            self.headers = {}

    class FastAPI:
        def __init__(self, *args, **kwargs):
            pass

        def middleware(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

        def exception_handler(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

        def post(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

        def get(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

    fastapi.Request = Request
    fastapi.Response = Response
    fastapi.FastAPI = FastAPI
    sys.modules["fastapi"] = fastapi

    exc_mod = types.ModuleType("fastapi.exceptions")

    class RequestValidationError(Exception):
        def __init__(self, errors=None, body=None):
            super().__init__("validation error")
            self._errors = errors or []
            self.body = body

        def errors(self):
            return self._errors

    exc_mod.RequestValidationError = RequestValidationError
    sys.modules["fastapi.exceptions"] = exc_mod

    responses_mod = types.ModuleType("fastapi.responses")

    class JSONResponse(Response):
        def __init__(self, status_code=200, content=None):
            body = json.dumps(content or {}).encode()
            super().__init__(content=body, status_code=status_code)
            self.body = body

    responses_mod.JSONResponse = JSONResponse
    responses_mod.Response = Response
    sys.modules["fastapi.responses"] = responses_mod

    testclient_mod = types.ModuleType("fastapi.testclient")

    class TestClient:
        def __init__(self, _app):
            self._app = _app

    testclient_mod.TestClient = TestClient
    sys.modules["fastapi.testclient"] = testclient_mod


_install_fastapi_stub()
