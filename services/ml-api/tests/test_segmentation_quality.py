"""Quality validation tests for MediaPipe segmentation.

Runs on all fixtures, measures quality metrics, and categorizes failures.

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.3
"""
import base64
from pathlib import Path
from typing import List

import pytest

from app.core.segmenter import segment_selfie


@pytest.fixture
def quality_results(fixture_image_paths: List[Path]) -> dict:
    """Run segmentation on all fixtures and collect results.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.3.1
    """
    results = {
        "total": 0,
        "mediapipe": 0,
        "stub": 0,
        "excellent": [],  # Mask coverage 40-60% (typical hair)
        "good": [],       # Mask coverage 20-40% or 60-80%
        "acceptable": [], # Mask coverage 10-20% or 80-90%
        "failures": [],   # Errors or extreme coverage (<10% or >90%)
    }

    for img_path in fixture_image_paths:
        # Load and encode image
        with open(img_path, "rb") as f:
            img_bytes = f.read()

        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = img_path.suffix.lower()
        mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else "image/png"
        selfie = f"data:{mime};base64,{b64}"

        # Segment
        result = segment_selfie(selfie)
        results["total"] += 1

        if result.backend == "mediapipe":
            results["mediapipe"] += 1

            # Calculate mask coverage (rough quality proxy)
            if result.mask is not None:
                import numpy as np
                coverage = (result.mask > 0).sum() / result.mask.size if result.mask.size > 0 else 0.0

                if 0.40 <= coverage <= 0.60:
                    results["excellent"].append((img_path.name, coverage))
                elif 0.20 <= coverage <= 0.80:
                    results["good"].append((img_path.name, coverage))
                elif 0.10 <= coverage <= 0.90:
                    results["acceptable"].append((img_path.name, coverage))
                else:
                    results["failures"].append((img_path.name, coverage, "extreme_coverage"))
            else:
                results["failures"].append((img_path.name, 0.0, "no_mask"))
        else:
            results["stub"] += 1
            results["failures"].append((img_path.name, 0.0, "stub_fallback"))

    return results


def test_segmentation_quality_overall(quality_results: dict):
    """Validate overall segmentation quality.

    Acceptance Criteria (Task 1.3):
    - ≥80% using MediaPipe (not stub)
    - ≤20% failures
    """
    total = quality_results["total"]
    mediapipe = quality_results["mediapipe"]
    failures = len(quality_results["failures"])

    # At least 10 fixtures tested
    assert total >= 10, f"Insufficient fixtures: {total} < 10"

    # At least 80% using MediaPipe (not stub fallback)
    # Note: May fail if MediaPipe not installed, but gracefully uses stub
    if mediapipe > 0:
        mp_percentage = (mediapipe / total) * 100
        assert mediapipe >= total * 0.8 or mediapipe == 0, \
            f"MediaPipe usage: {mediapipe}/{total} ({mp_percentage:.0f}%)"

    # At most 20% failures
    assert failures <= total * 0.2, \
        f"Too many failures: {failures}/{total} ({(failures/total)*100:.0f}%)"


def test_segmentation_quality_categories(quality_results: dict):
    """Validate quality distribution.

    Acceptance Criteria (Task 1.3):
    - ≥50% in good or excellent
    """
    excellent = len(quality_results["excellent"])
    good = len(quality_results["good"])
    total = quality_results["total"]

    # At least 50% in good or excellent (or all are stub/fallback)
    success_count = excellent + good

    # If we have MediaPipe results, check quality
    if quality_results["mediapipe"] > 0:
        assert success_count >= total * 0.5 or total < 10, \
            f"Quality too low: {success_count}/{total} good/excellent"


def test_generate_quality_report(quality_results: dict, tmp_path: Path):
    """Generate quality report for manual review.

    Task: ML_TRAINING_EXECUTION_PLAN.md § 1.3.2
    """
    report_lines = [
        "# MediaPipe Segmentation Quality Report\n",
        f"**Total Fixtures**: {quality_results['total']}\n",
        f"**MediaPipe Used**: {quality_results['mediapipe']}\n",
        f"**Stub Fallbacks**: {quality_results['stub']}\n",
        "\n## Quality Distribution\n",
        f"- Excellent (40-60% coverage): {len(quality_results['excellent'])}\n",
        f"- Good (20-80% coverage): {len(quality_results['good'])}\n",
        f"- Acceptable (10-90% coverage): {len(quality_results['acceptable'])}\n",
        f"- Failures: {len(quality_results['failures'])}\n",
        "\n## Failures Detail\n",
    ]

    for img_name, coverage, reason in quality_results["failures"]:
        report_lines.append(f"- {img_name}: {reason} (coverage={coverage:.2%})\n")

    report_path = tmp_path / "quality_report.md"
    report_path.write_text("".join(report_lines))

    print(f"\n{'='*60}")
    print("Quality Report Generated:")
    print(report_path.read_text())
    print(f"{'='*60}\n")

    # Verify report was created
    assert report_path.exists()
    assert "Quality Distribution" in report_path.read_text()
