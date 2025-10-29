# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use
# pyright: reportAttributeAccessIssue=false

"""Tests for storage utility functions."""

import builtins
import os
import platform
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from waldiez.storage.utils import (
    copy_results,
    get_root_dir,
    is_frozen,
    is_installed_package,
    safe_name,
    symlink,
)


class TestSymlink:
    """Tests for symlink function."""

    def test_symlink_basic(self, tmp_path: Path) -> None:
        """Test basic symlink creation."""
        target = tmp_path / "target"
        target.mkdir()
        (target / "file.txt").write_text("content")

        link = tmp_path / "link"
        symlink(link, target)

        assert link.is_symlink()
        assert link.resolve() == target

    def test_symlink_overwrite(self, tmp_path: Path) -> None:
        """Test symlink overwriting."""
        target1 = tmp_path / "target1"
        target1.mkdir()
        target2 = tmp_path / "target2"
        target2.mkdir()

        link = tmp_path / "link"

        # Create initial link
        symlink(link, target1)
        assert link.resolve() == target1

        # Try to overwrite without flag
        with pytest.raises(FileExistsError):
            symlink(link, target2)

        # Overwrite with flag
        symlink(link, target2, overwrite=True)
        assert link.resolve() == target2

    def test_symlink_no_op(self, tmp_path: Path) -> None:
        """Test symlink creation when link already points to target."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "link"
        symlink(link, target)

        # Second call should be no-op
        symlink(link, target)  # Should not raise

    def test_symlink_make_parents(self, tmp_path: Path) -> None:
        """Test symlink creation with parent directory creation."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "deep" / "path" / "link"

        # Without make_parents
        with pytest.raises((FileNotFoundError, OSError)):
            symlink(link, target, make_parents=False)

        # With make_parents
        symlink(link, target, make_parents=True)
        assert link.is_symlink()

    def test_symlink_overwrite_file(self, tmp_path: Path) -> None:
        """Test symlink overwriting an existing file."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "link"
        link.write_text("existing file")

        symlink(link, target, overwrite=True)
        assert link.is_symlink()
        assert link.resolve() == target

    def test_symlink_overwrite_directory(self, tmp_path: Path) -> None:
        """Test symlink overwriting an existing directory."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "link"
        link.mkdir()
        (link / "file.txt").write_text("content")

        symlink(link, target, overwrite=True)
        assert link.is_symlink()
        assert link.resolve() == target

    @pytest.mark.skipif(
        platform.system() != "Windows", reason="Windows-specific test"
    )
    def test_symlink_windows_junction_fallback(self, tmp_path: Path) -> None:
        """Test Windows junction fallback."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "link"

        # Mock os.symlink to fail
        with patch("os.symlink") as mock_symlink:
            mock_symlink.side_effect = OSError("Permission denied")

            # This should fall back to junction
            symlink(link, target, windows_junction_fallback=True)

        # Verify junction was created (Windows-specific check)
        assert link.exists()
        assert link.is_dir()

    @pytest.mark.skipif(
        platform.system() != "Windows", reason="Windows-specific test"
    )
    def test_symlink_windows_error_1314(self, tmp_path: Path) -> None:
        """Test Windows error 1314 handling."""
        target = tmp_path / "target"
        target.mkdir()

        link = tmp_path / "link"

        # Mock os.symlink to fail with error 1314
        with patch("os.symlink") as mock_symlink:
            error = OSError("Permission denied")
            error.winerror = 1314  # type: ignore[attr-defined,unused-ignore]
            mock_symlink.side_effect = error

            with pytest.raises(OSError) as exc_info:
                symlink(link, target, windows_junction_fallback=False)

            assert "privilege is not held" in str(exc_info.value)

    def test_symlink_to_file(self, tmp_path: Path) -> None:
        """Test symlink to a file."""
        target = tmp_path / "target.txt"
        target.write_text("content")

        link = tmp_path / "link"
        symlink(link, target)

        assert link.is_symlink()
        assert link.read_text() == "content"


class TestGetRootDir:
    """Tests for get_root_dir function."""

    def test_get_root_dir_default(self) -> None:
        """Test get_root_dir with default behavior."""
        with (
            patch("waldiez.storage.utils.is_frozen", return_value=False),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=False
            ),
            patch.dict(os.environ, {"WALDIEZ_TESTING": ""}),
        ):
            root_dir = get_root_dir()
            # Should be relative to the module location
            assert "workspace" in str(root_dir)

    def test_get_root_dir_with_user_id(self) -> None:
        """Test get_root_dir with user_id."""
        with (
            patch("waldiez.storage.utils.is_frozen", return_value=False),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=False
            ),
            patch.dict(os.environ, {"WALDIEZ_TESTING": ""}),
        ):
            root_dir = get_root_dir("test_user")
            assert "test_user" in str(root_dir)

    def test_get_root_dir_frozen(self, tmp_path: Path) -> None:
        """Test get_root_dir when frozen."""
        with (
            patch("waldiez.storage.utils.is_frozen", return_value=True),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=False
            ),
            patch("waldiez.storage.utils.Path.home") as mock_home,
        ):
            mock_home.return_value = tmp_path / "home" / "user"
            root_dir = get_root_dir("test_user")

            expected = (
                tmp_path
                / "home"
                / "user"
                / "waldiez"
                / "workspace"
                / "waldiez_checkpoints"
            )
            assert root_dir == expected

    def test_get_root_dir_installed_package(self, tmp_path: Path) -> None:
        """Test get_root_dir when installed as package."""
        with (
            patch("waldiez.storage.utils.is_frozen", return_value=False),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=True
            ),
            patch("waldiez.storage.utils.Path.home") as mock_home,
        ):
            mock_home.return_value = tmp_path / "home" / "user"
            root_dir = get_root_dir("test_user")

            expected = (
                tmp_path
                / "home"
                / "user"
                / "waldiez"
                / "workspace"
                / "waldiez_checkpoints"
            )
            assert root_dir == expected

    def test_get_root_dir_testing_env(self, tmp_path: Path) -> None:
        """Test get_root_dir with WALDIEZ_TESTING environment."""
        test_root = tmp_path / "test_get_root_dir_testing_env"

        with (
            patch("waldiez.storage.utils.is_frozen", return_value=False),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=False
            ),
            patch.dict(
                os.environ,
                {"WALDIEZ_TESTING": "true", "WALDIEZ_ROOT_DIR": str(test_root)},
            ),
        ):
            root_dir = get_root_dir("test_user")
            assert root_dir == test_root / "test_user"

    def test_get_root_dir_default_user(self) -> None:
        """Test get_root_dir with no user_id."""
        with (
            patch("waldiez.storage.utils.is_frozen", return_value=False),
            patch(
                "waldiez.storage.utils.is_installed_package", return_value=False
            ),
            patch(
                "waldiez.storage.utils.getpass",
            ) as mock_getpass,
            patch.dict(os.environ, {"WALDIEZ_TESTING": ""}),
        ):
            mock_getpass.getuser.return_value = "current_user"
            root_dir = get_root_dir()
            assert "current_user" in str(root_dir)


class TestIsFrozen:
    """Tests for is_frozen function."""

    def test_is_frozen_sys_frozen(self) -> None:
        """Test is_frozen with sys.frozen."""
        with patch.object(sys, "frozen", True, create=True):
            assert is_frozen()

    def test_is_frozen_meipass(self) -> None:
        """Test is_frozen with _MEIPASS."""
        with patch.object(sys, "_MEIPASS", "/path", create=True):
            assert is_frozen()

    def test_is_frozen_compiled(self) -> None:
        """Test is_frozen with __compiled__."""
        with patch.object(builtins, "__compiled__", True, create=True):
            assert is_frozen()

    def test_is_not_frozen(self) -> None:
        """Test is_frozen when not frozen."""
        # Clear cache
        is_frozen.cache_clear()

        # Remove any frozen indicators
        if hasattr(sys, "frozen"):
            delattr(sys, "frozen")
        if hasattr(sys, "_MEIPASS"):
            delattr(sys, "_MEIPASS")

        assert not is_frozen()


class TestIsInstalledPackage:
    """Tests for is_installed_package function."""

    def test_is_installed_package_true(self) -> None:
        """Test when running from site-packages."""
        with (
            patch("waldiez.storage.utils.Path.resolve") as mock_resolve,
            patch.object(sys, "path", ["/usr/lib/python3.9/site-packages"]),
        ):
            mock_resolve.return_value = Path(
                "/usr/lib/python3.9/site-packages/waldiez/utils.py"
            )
            assert is_installed_package()

    def test_is_installed_package_false(self) -> None:
        """Test when not running from site-packages."""
        with (
            patch("waldiez.storage.utils.Path.resolve") as mock_resolve,
            patch.object(sys, "path", ["/home/user/project"]),
        ):
            mock_resolve.return_value = Path(
                "/home/user/project/waldiez/utils.py"
            )
            assert not is_installed_package()

    def test_is_installed_package_exception(self) -> None:
        """Test when exception occurs."""
        with patch("waldiez.storage.utils.Path.resolve") as mock_resolve:
            mock_resolve.side_effect = Exception("Test error")
            assert not is_installed_package()


class TestCopyResults:
    """Tests for copy_results function."""

    def test_copy_results_basic(self, tmp_path: Path) -> None:
        """Test basic copy_results functionality."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        (temp_dir / "file1.txt").write_text("content1")
        (temp_dir / "file2.txt").write_text("content2")

        subdir = temp_dir / "subdir"
        subdir.mkdir()
        (subdir / "file3.txt").write_text("content3")

        output_file = tmp_path / "output.py"
        output_file.write_text("print('test')")

        destination_dir = tmp_path / "dest"

        # Execute
        copy_results(temp_dir, output_file, destination_dir)

        # Verify
        assert (destination_dir / "file1.txt").read_text() == "content1"
        assert (destination_dir / "file2.txt").read_text() == "content2"
        assert (
            destination_dir / "subdir" / "file3.txt"
        ).read_text() == "content3"

    def test_copy_results_promote_files(self, tmp_path: Path) -> None:
        """Test promoting specific files to output directory."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        (temp_dir / "tree_of_thoughts.png").write_bytes(b"image")
        (temp_dir / "reasoning_tree.json").write_text("{}")
        (temp_dir / "other.txt").write_text("other")

        output_dir = tmp_path / "output"
        output_dir.mkdir()
        output_file = output_dir / "script.py"
        output_file.write_text("print('test')")

        destination_dir = tmp_path / "dest"

        # Execute
        copy_results(temp_dir, output_file, destination_dir)

        # Verify promoted files
        assert (output_dir / "tree_of_thoughts.png").exists()
        assert (output_dir / "reasoning_tree.json").exists()
        assert not (output_dir / "other.txt").exists()

    def test_copy_results_ignore_names(self, tmp_path: Path) -> None:
        """Test ignoring specific files/directories."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        (temp_dir / "keep.txt").write_text("keep")
        (temp_dir / ".cache").mkdir()
        (temp_dir / ".cache" / "data").write_text("cache")
        (temp_dir / ".env").write_text("SECRET=value")
        (temp_dir / "__pycache__").mkdir()
        (temp_dir / "file.pyc").write_bytes(b"pyc")

        output_file = tmp_path / "output.py"
        destination_dir = tmp_path / "dest"

        # Execute
        copy_results(temp_dir, output_file, destination_dir)

        # Verify
        assert (destination_dir / "keep.txt").exists()
        assert not (destination_dir / ".cache").exists()
        assert not (destination_dir / ".env").exists()
        assert not (destination_dir / "__pycache__").exists()
        assert not (destination_dir / "file.pyc").exists()

    def test_copy_results_waldiez_file(self, tmp_path: Path) -> None:
        """Test handling of .waldiez files."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()

        output_dir = tmp_path / "output"
        output_dir.mkdir()
        output_file = output_dir / "flow.waldiez"
        output_file.write_text("waldiez content")

        # Create generated .py file in temp
        generated_py = temp_dir / "flow.py"
        generated_py.write_text("print('generated')")

        destination_dir = tmp_path / "dest"

        # Execute
        copy_results(temp_dir, output_file, destination_dir)

        # Verify .py file was copied to output dir
        assert (output_dir / "flow.py").exists()
        assert (output_dir / "flow.py").read_text() == "print('generated')"

    def test_copy_results_custom_promote_ignore(self, tmp_path: Path) -> None:
        """Test custom promote and ignore lists."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        (temp_dir / "custom_promote.txt").write_text("promote me")
        (temp_dir / "custom_ignore.txt").write_text("ignore me")
        (temp_dir / "normal.txt").write_text("normal")

        output_dir = tmp_path / "output"
        output_dir.mkdir()
        output_file = output_dir / "script.py"

        destination_dir = tmp_path / "dest"

        # Execute
        copy_results(
            temp_dir,
            output_file,
            destination_dir,
            promote_to_output=["custom_promote.txt"],
            ignore_names=["custom_ignore.txt"],
        )

        # Verify
        assert (output_dir / "custom_promote.txt").exists()
        assert not (destination_dir / "custom_ignore.txt").exists()
        assert (destination_dir / "normal.txt").exists()

    def test_copy_results_exception_handling(self, tmp_path: Path) -> None:
        """Test that copy_results handles exceptions gracefully."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        (temp_dir / "file.txt").write_text("content")

        output_file = tmp_path / "output.py"
        destination_dir = tmp_path / "dest"
        destination_dir.mkdir()

        # Make destination read-only to cause error
        destination_dir.chmod(0o444)

        # Execute - should not raise
        try:
            copy_results(temp_dir, output_file, destination_dir)
        finally:
            # Clean up permissions
            destination_dir.chmod(0o755)

    def test_copy_results_merge_safe(self, tmp_path: Path) -> None:
        """Test that copy_results is merge-safe (dirs_exist_ok)."""
        # Setup
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()

        subdir = temp_dir / "subdir"
        subdir.mkdir()
        (subdir / "file1.txt").write_text("new content")

        output_file = tmp_path / "output.py"

        destination_dir = tmp_path / "dest"
        destination_dir.mkdir()

        # Pre-existing content
        existing_subdir = destination_dir / "subdir"
        existing_subdir.mkdir()
        (existing_subdir / "file2.txt").write_text("existing")

        # Execute
        copy_results(temp_dir, output_file, destination_dir)

        # Verify merge
        assert (
            destination_dir / "subdir" / "file1.txt"
        ).read_text() == "new content"
        assert (
            destination_dir / "subdir" / "file2.txt"
        ).read_text() == "existing"


# pylint: disable=too-few-public-methods
class TestSafeName:
    """Tests for safe_name function."""

    def test_safe_name(self) -> None:
        """Test _safe_name method."""
        # Basic test
        assert safe_name("test_flow") == "test_flow"

        # Special characters
        assert safe_name("test/flow@123!") == "test_flow_123"

        # Multiple underscores
        assert safe_name("test___flow") == "test_flow"

        # Leading/trailing underscores
        assert safe_name("_test_flow_") == "test_flow"

        # Empty string
        assert safe_name("") == "invalid_name"

        # Only special characters
        assert safe_name("@#$%^&*") == "invalid_name"

        # Max length
        long_name = "a" * 300
        assert len(safe_name(long_name)) == 255

        # Custom max length
        assert len(safe_name("test_flow", max_length=5)) == 4
        assert len(safe_name("testing_flow", max_length=5)) == 5

        # Custom fallback
        assert safe_name("", fallback="custom") == "custom"
