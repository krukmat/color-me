#!/usr/bin/env bash
set -euo pipefail

echo "== Verify: services/ml-api =="
if [ -d "services/ml-api" ]; then
  pushd services/ml-api >/dev/null
  if [ -f "pyproject.toml" ]; then
    echo "Running ruff..."
    ruff check .
    echo "Running mypy (if configured)..."
    if grep -q "\[tool.mypy\]" pyproject.toml 2>/dev/null; then
      mypy .
    else
      echo "mypy not configured; skipping."
    fi
    echo "Running pytest..."
    pytest -q
  else
    echo "No pyproject.toml found; skipping."
  fi
  popd >/dev/null
else
  echo "services/ml-api not found; skipping."
fi

echo "== Verify: services/bff =="
if [ -d "services/bff" ]; then
  pushd services/bff >/dev/null
  if [ -f "package.json" ]; then
    if npm run -s lint >/dev/null 2>&1; then npm run -s lint; else echo "No lint script; skipping."; fi
    if npm test >/dev/null 2>&1; then npm test; else echo "No test script; skipping."; fi
  else
    echo "No package.json found; skipping."
  fi
  popd >/dev/null
else
  echo "services/bff not found; skipping."
fi

echo "== Verify: apps/mobile =="
if [ -d "apps/mobile" ]; then
  pushd apps/mobile >/dev/null
  if [ -f "package.json" ]; then
    if npm run -s lint >/dev/null 2>&1; then npm run -s lint; else echo "No lint script; skipping."; fi
    echo "Nota: el build Android depende del entorno; correr 'npm run android' localmente."
  else
    echo "No package.json found; skipping."
  fi
  popd >/dev/null
else
  echo "apps/mobile not found; skipping."
fi

echo "== Done =="
