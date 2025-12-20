"""Test fixture loader functionality.

Task: ML_TRAINING_EXECUTION_PLAN.md § 1.1
"""
from pathlib import Path


def test_fixture_loader(fixture_image_paths):
    """Test fixture loader returns valid paths."""
    assert len(fixture_image_paths) >= 10, f"Expected >=10 fixtures, got {len(fixture_image_paths)}"
    assert all(p.exists() for p in fixture_image_paths), "All fixture paths should exist"
    assert all(p.is_file() for p in fixture_image_paths), "All fixtures should be files"


def test_sample_fixture_path(sample_fixture_path):
    """Test sample fixture path is valid."""
    assert isinstance(sample_fixture_path, Path)
    assert sample_fixture_path.exists()
    assert sample_fixture_path.is_file()
    assert sample_fixture_path.suffix in {".png", ".jpg", ".jpeg"}
