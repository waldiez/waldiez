# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-yield-doc
# pylint: disable=protected-access
# pyright: reportUnknownMemberType=false,reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false,reportAttributeAccessIssue=false

"""Pytest configuration and fixtures for storage tests."""

import tempfile
from collections.abc import Generator
from pathlib import Path

import pytest

from waldiez.storage.utils import get_root_dir, is_frozen, is_installed_package


@pytest.fixture(autouse=True)
def clean_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[None, None, None]:
    """Clean environment variables that might affect tests."""
    # Remove any existing WALDIEZ environment variables
    for mapping in monkeypatch._setitem:
        for key in mapping[0].keys():
            if key.startswith("WALDIEZ_"):
                # cspell: disable-next-line
                monkeypatch.delenv(key, raising=False)
    is_frozen.cache_clear()
    is_installed_package.cache_clear()
    get_root_dir.cache_clear()
    yield
    is_frozen.cache_clear()
    is_installed_package.cache_clear()
    get_root_dir.cache_clear()


@pytest.fixture
def temp_workspace() -> Generator[Path, None, None]:
    """Create a temporary workspace directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        workspace = Path(tmpdir) / "test_workspace"
        workspace.mkdir()
        yield workspace
        # Cleanup is automatic with TemporaryDirectory


@pytest.fixture
def mock_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Mock home directory for tests."""
    home_dir = tmp_path / "home" / "testuser"
    home_dir.mkdir(parents=True)

    monkeypatch.setattr(Path, "home", lambda: home_dir)

    return home_dir
