# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=protected-access,no-member,missing-param-doc
# pyright: reportPrivateUsage=false

"""Tests for waldiez version retrieval."""

from unittest.mock import mock_open, patch

import pytest

import waldiez.utils.version as version_mod


def test_get_waldiez_version_from_importlib_success() -> None:
    """Test getting the Waldiez version from importlib."""
    with patch("waldiez.utils.version.version", return_value="1.2.3"):
        ver = version_mod._get_waldiez_version_from_importlib()
        assert ver == "1.2.3"


def test_get_waldiez_version_from_importlib_failure() -> None:
    """Test getting the Waldiez version from importlib."""
    with patch("waldiez.utils.version.version", side_effect=Exception("fail")):
        ver = version_mod._get_waldiez_version_from_importlib()
        assert ver is None


def test_get_waldiez_version_from_package_json_found() -> None:
    """Test getting the Waldiez version from package.json."""
    fake_json = '{"version": "2.3.4"}'
    with patch("builtins.open", mock_open(read_data=fake_json)):
        result = version_mod._get_waldiez_version_from_package_json()
        assert result == "2.3.4"


def test_get_waldiez_version_from_package_json_not_found() -> None:
    """Test getting the Waldiez version from package.json."""
    with patch("waldiez.utils.version.Path.exists", return_value=False):
        result = version_mod._get_waldiez_version_from_package_json()
        assert result is None


def test_get_waldiez_version_from_version_py_found() -> None:
    """Test getting the Waldiez version from _version.py."""
    file_content = '__version__ = "3.4.5"\nother_line = "test"\n'

    m_open = mock_open(read_data=file_content)

    with (
        patch("waldiez.utils.version.Path.exists", return_value=True),
        patch("builtins.open", m_open),
    ):
        version = version_mod._get_waldiez_version_from_version_py()
        assert version == "3.4.5"


def test_get_waldiez_version_from_version_py_not_found() -> None:
    """Test getting the Waldiez version from _version.py."""
    m_open = mock_open(read_data="print('no version line here')")
    with (
        patch("waldiez.utils.version.Path.exists", return_value=True),
        patch("builtins.open", m_open),
    ):
        version = version_mod._get_waldiez_version_from_version_py()
        assert version is None


def test_get_waldiez_version_cache_and_fallback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test getting the Waldiez version with cache and fallback."""
    # Clear cache explicitly
    version_mod.get_waldiez_version.cache_clear()

    # Case 1: importlib returns version
    monkeypatch.setattr(
        version_mod,
        "_get_waldiez_version_from_importlib",
        lambda: "importlib_ver",
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_version_py", lambda: None
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_package_json", lambda: None
    )
    v = version_mod.get_waldiez_version()
    assert v == "importlib_ver"

    # Case 2: importlib returns None, version_py returns value
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_importlib", lambda: None
    )
    monkeypatch.setattr(
        version_mod,
        "_get_waldiez_version_from_version_py",
        lambda: "version_py_ver",
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_package_json", lambda: None
    )
    version_mod.get_waldiez_version.cache_clear()
    v = version_mod.get_waldiez_version()
    assert v == "version_py_ver"

    # Case 3: importlib and version_py return None, package_json returns value
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_importlib", lambda: None
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_version_py", lambda: None
    )
    monkeypatch.setattr(
        version_mod,
        "_get_waldiez_version_from_package_json",
        lambda: "package_json_ver",
    )
    version_mod.get_waldiez_version.cache_clear()
    v = version_mod.get_waldiez_version()
    assert v == "package_json_ver"

    # Case 4: all return None -> fallback "dev"
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_importlib", lambda: None
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_version_py", lambda: None
    )
    monkeypatch.setattr(
        version_mod, "_get_waldiez_version_from_package_json", lambda: None
    )
    version_mod.get_waldiez_version.cache_clear()
    v = version_mod.get_waldiez_version()
    assert v == "dev"
