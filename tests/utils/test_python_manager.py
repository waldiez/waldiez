# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-function-docstring,missing-param-doc
# pylint: disable=no-self-use,missing-yield-doc
# flake8: noqa: D102
"""Test waldiez.utils.python_manager.*."""

import os
import sys
from collections.abc import AsyncGenerator
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

import pytest

from waldiez.utils.python_manager import (
    WALDIEZ_APP_ROOT,
    WALDIEZ_SITE_PACKAGES,
    PythonManager,
    strip_ansi,
)


class TestPythonManager:
    """Tests for the manager class."""

    def test_init(self) -> None:
        pm = PythonManager()
        assert pm.system in ["windows", "linux", "darwin"]
        assert isinstance(pm.is_frozen, bool)

    def test_app_dir_development(self) -> None:
        pm = PythonManager()
        pm.is_frozen = False
        # Should point to project root in dev mode
        assert pm.app_dir.exists()

    def test_app_dir_from_env(self) -> None:
        pm = PythonManager()

        original_app_root = os.environ.get(WALDIEZ_APP_ROOT)
        # pylint: disable=too-many-try-statements
        try:
            test_app_path = os.path.join("custom", "app", "root")
            os.environ[WALDIEZ_APP_ROOT] = test_app_path

            with patch.object(Path, "is_dir", return_value=True):
                result = pm.app_dir
                assert test_app_path in str(result)

        finally:
            if original_app_root is not None:
                os.environ[WALDIEZ_APP_ROOT] = original_app_root
            else:
                os.environ.pop(WALDIEZ_APP_ROOT, None)

    @patch("sys.executable", "/app/myapp.exe")
    @patch.object(Path, "exists", return_value=True)
    def test_app_dir_frozen(self, tmp_path: Path) -> None:
        pm = PythonManager()
        pm.is_frozen = True
        with patch("sys._MEIPASS", str(tmp_path / "meipass"), create=True):
            result = pm.app_dir
            assert str(result) == str(tmp_path / "meipass")

    def test_site_packages_directory_not_frozen(self) -> None:
        pm = PythonManager()
        pm.is_frozen = False
        assert pm.site_packages_directory is None

    def test_site_packages_from_env(self) -> None:
        pm = PythonManager()
        original_site_packages = os.environ.get(WALDIEZ_SITE_PACKAGES)
        # pylint: disable=too-many-try-statements
        try:
            test_site_packages_path = os.path.join("custom", "site", "packages")
            os.environ[WALDIEZ_SITE_PACKAGES] = test_site_packages_path
            with patch.object(Path, "is_dir", return_value=True):
                result = pm.site_packages_directory
                assert result is not None
                assert test_site_packages_path in str(result)

        finally:
            if original_site_packages is not None:
                os.environ[WALDIEZ_SITE_PACKAGES] = original_site_packages
            else:
                os.environ.pop(WALDIEZ_SITE_PACKAGES, None)

    def test_site_packages_directory_frozen_exists(self) -> None:
        pm = PythonManager()
        pm.is_frozen = True
        with patch.object(Path, "exists", return_value=True):
            result = pm.site_packages_directory
            assert result is not None
            assert os.path.join("bundled_python", "site-packages") in str(
                result
            )

    def test_get_python_executable_not_frozen(self) -> None:
        pm = PythonManager()
        pm.is_frozen = False
        assert pm.get_python_executable() == sys.executable

    @pytest.mark.parametrize(
        "system,expected_candidates",
        [
            (
                "windows",
                ["Scripts/python.exe", "Scripts/python3.exe", "python.exe"],
            ),
            ("linux", ["bin/python3", "bin/python", "python3"]),
        ],
    )
    def test_get_python_executable_frozen(
        self,
        system: str,
        expected_candidates: list[str],
    ) -> None:
        pm = PythonManager()
        pm.is_frozen = True
        pm.system = system

        # Mock the first candidate to exist
        with patch.object(Path, "exists") as mock_exists:
            mock_exists.side_effect = lambda: True  # First candidate exists
            result = pm.get_python_executable()
            assert "bundled_python" in result
            assert any(item in result for item in expected_candidates)

    def test_list_installed_packages_success(self) -> None:
        pm = PythonManager()
        mock_result = Mock()
        mock_result.returncode = 0
        mock_result.stdout = '[{"name": "requests", "version": "2.28.1"}]'

        with patch("subprocess.run", return_value=mock_result):
            packages = pm.list_installed_packages()
            assert len(packages) == 1
            assert packages[0]["name"] == "requests"

    def test_list_installed_packages_failure(self) -> None:
        pm = PythonManager()
        with patch("subprocess.run", side_effect=Exception("Command failed")):
            packages = pm.list_installed_packages()
            assert not packages

    def test_pip_install_with_target(self) -> None:
        pm = PythonManager()
        pm.is_frozen = True
        bundled_packages = os.path.join("bundled", "site-packages")
        original_site_packages = os.environ.pop(WALDIEZ_SITE_PACKAGES, None)
        with patch.object(
            pm,
            "_get_site_packages_path",
            return_value=Path(bundled_packages),
        ):
            with patch("subprocess.Popen") as mock_popen:
                mock_proc = Mock()
                mock_proc.stdout = []
                mock_proc.stderr = []
                mock_proc.wait.return_value = 0
                mock_popen.return_value.__enter__.return_value = mock_proc

                pm.pip_install({"requests"})

                call_args = mock_popen.call_args[0][0]
                assert "--target" in call_args
                assert bundled_packages in call_args
        if original_site_packages is not None:
            os.environ[WALDIEZ_SITE_PACKAGES] = original_site_packages
        else:
            os.environ.pop(WALDIEZ_SITE_PACKAGES, None)

    @pytest.mark.asyncio
    async def test_a_pip_install_with_target(self) -> None:
        pm = PythonManager()
        pm.is_frozen = True
        bundled_packages = os.path.join("bundled", "site-packages")

        with patch.object(
            pm,
            "_get_site_packages_path",
            return_value=Path(bundled_packages),
        ):
            with patch("asyncio.create_subprocess_exec") as mock_subprocess:
                # Mock the async subprocess
                mock_proc = Mock()
                mock_proc.returncode = 0
                mock_proc.stdout = Mock()
                mock_proc.stderr = Mock()
                mock_proc.wait = AsyncMock(return_value=0)

                # Mock the async streams
                async def mock_stream() -> AsyncGenerator[bytes, None]:
                    yield b"Installing requests...\n"
                    yield b"Successfully installed requests\n"

                mock_proc.stdout.__aiter__ = mock_stream
                mock_proc.stderr.__aiter__ = lambda: iter([])  # Empty stderr

                mock_subprocess.return_value = mock_proc

                # Capture print output
                output_lines: list[str] = []

                def capture_print(*args: list[str]) -> None:
                    output_lines.append(" ".join(str(arg) for arg in args))

                await pm.a_pip_install({"requests"}, printer=capture_print)

                # Verify subprocess was called with correct arguments
                # _call_args = mock_subprocess.call_args[1]  # keyword arguments
                assert (
                    "--target" in mock_subprocess.call_args[0]
                )  # positional args
                assert bundled_packages in mock_subprocess.call_args[0]

                # Verify output was captured
                assert any(
                    "Installing requirements: requests" in line
                    for line in output_lines
                )

    def test_get_debug_info(self) -> None:
        pm = PythonManager()
        mock_resource = os.path.join("mock", "resource")
        mock_packages = os.path.join("mock", "site-packages")

        # Mock some properties for consistent testing
        with patch.object(pm, "_get_app_dir", return_value=Path(mock_resource)):
            with patch.object(
                pm,
                "_get_site_packages_path",
                return_value=Path(mock_packages),
            ):
                with patch.object(
                    pm, "get_python_executable", return_value="/usr/bin/python3"
                ):
                    debug_info = pm.get_debug_info()

                    # Check all expected keys are present
                    expected_keys = {
                        "system",
                        "is_frozen",
                        "site_packages_directory",
                        "python_executable",
                        "python_version",
                        "in_virtualenv",
                        "sys_path",
                        "pythonpath",
                    }
                    assert set(debug_info.keys()) == expected_keys

                    # Check some specific values
                    assert debug_info["system"] in [
                        "windows",
                        "linux",
                        "darwin",
                    ]
                    assert isinstance(debug_info["is_frozen"], bool)
                    assert (
                        debug_info["site_packages_directory"] == mock_packages
                    )
                    assert debug_info["python_executable"] == "/usr/bin/python3"
                    assert isinstance(debug_info["sys_path"], list)
                    assert isinstance(debug_info["pythonpath"], str)

    def test_get_debug_info_none_site_packages(self) -> None:
        pm = PythonManager()

        with patch.object(pm, "_get_site_packages_path", return_value=None):
            debug_info = pm.get_debug_info()
            assert debug_info["site_packages_directory"] is None


@pytest.mark.parametrize(
    "text,expected",
    [
        ("\x1b[31mRed Text\x1b[0m", "Red Text"),
        ("Normal Text", "Normal Text"),
        ("\x1b[1;34mBlue Bold\x1b[0m", "Blue Bold"),
        ("\x1b[?25lHidden Cursor\x1b[?25h", "Hidden Cursor"),
    ],
)
def test_strip_ansi(text: str, expected: str) -> None:
    """Test the strip_ansi function."""
    assert strip_ansi(text) == expected
