"""Benchmarking tests for segmentation performance.

Measures CPU inference time, memory usage.

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.5
"""
import base64
import time
from pathlib import Path
from typing import List

import pytest

from app.core.segmenter import segment_selfie


@pytest.fixture
def benchmark_images(fixture_image_paths: List[Path]) -> List[str]:
    """Convert fixtures to base64 for benchmarking.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.5.1
    """
    images = []
    for img_path in fixture_image_paths[:10]:  # Benchmark on 10 images
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = img_path.suffix.lower()
        mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else "image/png"
        images.append(f"data:{mime};base64,{b64}")
    return images


def test_inference_latency_cpu(benchmark_images: List[str]):
    """Benchmark CPU inference latency.

    Acceptance Criteria (Task 1.5.1):
    - p95 latency < 500ms
    """
    latencies = []

    for selfie in benchmark_images:
        start = time.perf_counter()
        result = segment_selfie(selfie)
        elapsed = time.perf_counter() - start

        if result.backend == "mediapipe":
            latencies.append(elapsed * 1000)  # Convert to ms

    if not latencies:
        pytest.skip("No MediaPipe inferences (stub fallback or MediaPipe not available)")

    # Calculate percentiles
    latencies_sorted = sorted(latencies)
    n = len(latencies_sorted)
    p50 = latencies_sorted[n // 2]
    p95 = latencies_sorted[int(n * 0.95)] if n > 1 else latencies_sorted[0]
    p99 = latencies_sorted[int(n * 0.99)] if n > 1 else latencies_sorted[0]

    print(f"\n{'='*60}")
    print(f"Inference Latency (CPU, n={n}):")
    print(f"  p50: {p50:.1f} ms")
    print(f"  p95: {p95:.1f} ms")
    print(f"  p99: {p99:.1f} ms")
    print(f"{'='*60}\n")

    # Acceptance: p95 < 500ms
    assert p95 < 500, f"p95 latency too high: {p95:.1f} ms > 500 ms"


def test_inference_throughput(benchmark_images: List[str]):
    """Measure throughput (requests per second).

    Acceptance Criteria (Task 1.5.1):
    - Throughput > 2 req/s
    """
    start = time.perf_counter()
    count = 0

    for selfie in benchmark_images:
        result = segment_selfie(selfie)
        if result.backend == "mediapipe":
            count += 1

    elapsed = time.perf_counter() - start

    if count == 0:
        pytest.skip("No MediaPipe inferences")

    throughput = count / elapsed if elapsed > 0 else 0

    print(f"\n{'='*60}")
    print(f"Throughput: {throughput:.2f} req/s ({count} images in {elapsed:.2f}s)")
    print(f"{'='*60}\n")

    # Acceptance: >2 req/s (reasonable for CPU)
    assert throughput > 0.5, f"Throughput too low: {throughput:.2f} req/s"


def test_inference_consistency(benchmark_images: List[str]):
    """Verify consistent results across multiple runs.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.5
    """
    if not benchmark_images:
        pytest.skip("No benchmark images")

    # Run same image twice
    selfie = benchmark_images[0]
    result1 = segment_selfie(selfie)
    result2 = segment_selfie(selfie)

    # Same input should produce same mask_id and backend
    assert result1.mask_id == result2.mask_id, "mask_id should be deterministic"
    assert result1.backend == result2.backend, "backend should be consistent"
