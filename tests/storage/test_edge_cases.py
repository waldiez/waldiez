# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
# pyright: reportPrivateUsage=false
"""Test waldiez.storage constants and edge cases."""

import tempfile
from pathlib import Path
from typing import Any
from unittest.mock import patch

from waldiez.storage._local import APP_AUTHOR, APP_NAME, WaldiezLocalStorage


class TestStorageConstants:
    """Test storage module constants."""

    def test_app_constants_defined(self) -> None:
        """Test that APP_NAME and APP_AUTHOR are properly defined."""
        assert APP_NAME == "waldiez"
        assert APP_AUTHOR == "Waldiez"
        assert isinstance(APP_NAME, str)
        assert isinstance(APP_AUTHOR, str)

    def test_app_constants_used_in_storage(self) -> None:
        """Test that app constants are used in storage initialization."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir"
            ) as mock_user_data_dir:
                mock_user_data_dir.return_value = temp_dir

                storage = WaldiezLocalStorage()

                # Verify that user_data_dir was called with the
                # correct constants
                mock_user_data_dir.assert_called_once_with(APP_NAME, APP_AUTHOR)

                # Verify the storage paths are based on the returned directory
                expected_base = Path(temp_dir)
                assert storage._base_dir == expected_base


class TestStorageEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_directory_creation_with_existing_directories(self) -> None:
        """Test that storage works when directories already exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                # Create some directories manually first
                local_dir = Path(temp_dir) / "local"
                local_dir.mkdir()
                (local_dir / "uploads").mkdir()
                (local_dir / "docs").mkdir()

                # Storage should still work
                storage = WaldiezLocalStorage()
                assert storage.get_uploads_dir().exists()
                assert storage.get_docs_dir().exists()
                assert (
                    storage.get_parsed_docs_dir().exists()
                )  # Should be created
                assert (
                    storage.get_embeddings_dir().exists()
                )  # Should be created
                assert storage.get_chroma_db_dir().exists()  # Should be created

    def test_file_operations_with_unicode_filenames(self) -> None:
        """Test file operations with Unicode filenames."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Test with various Unicode characters
                unicode_files = [
                    "test_файл.txt",  # Cyrillic
                    "test_文件.txt",  # Chinese
                    "test_🚀.txt",  # Emoji
                    "test_café.txt",  # Latin with accents
                ]

                for filename in unicode_files:
                    content = f"Content for {filename}".encode("utf-8")

                    # Save file
                    saved_path = storage.save_file(content, "uploads", filename)
                    assert saved_path.exists()

                    # Read file
                    read_content = storage.read_file("uploads", filename)
                    assert read_content == content

                    # File exists
                    assert storage.file_exists("uploads", filename)

                    # Get file path
                    file_path = storage.get_file_path("uploads", filename)
                    assert file_path == saved_path

                    # Clean up
                    assert storage.delete_file("uploads", filename)

    def test_json_operations_with_complex_data(self) -> None:
        """Test JSON operations with complex data structures."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Complex data structure
                complex_data: dict[str, Any] = {
                    "nested": {
                        "array": [1, 2, 3, {"inner": "value"}],
                        "unicode": "测试数据",
                        "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?",
                    },
                    "boolean": True,
                    "null_value": None,
                    "float": 3.14159,
                    "large_number": 1234567890123456789,
                    "empty_structures": {
                        "empty_dict": {},
                        "empty_list": [],
                        "empty_string": "",
                    },
                }

                # Save complex data
                saved_path = storage.save_json(
                    complex_data, "docs", "complex.json"
                )
                assert saved_path.exists()

                # Read and verify
                read_data = storage.read_json("docs", "complex.json")
                assert read_data == complex_data

    def test_file_operations_with_large_content(self) -> None:
        """Test file operations with large content."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Generate large content (1MB)
                large_content = b"x" * (1024 * 1024)

                # Save large file
                saved_path = storage.save_file(
                    large_content, "uploads", "large_file.bin"
                )
                assert saved_path.exists()
                assert saved_path.stat().st_size == len(large_content)

                # Read large file
                read_content = storage.read_file("uploads", "large_file.bin")
                assert read_content == large_content

                # Clean up
                assert storage.delete_file("uploads", "large_file.bin")

    def test_file_operations_with_empty_content(self) -> None:
        """Test file operations with empty content."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Test empty bytes
                empty_content = b""
                saved_path = storage.save_file(
                    empty_content, "uploads", "empty.bin"
                )
                assert saved_path.exists()
                assert saved_path.stat().st_size == 0

                read_content = storage.read_file("uploads", "empty.bin")
                assert read_content == empty_content

                # Test empty JSON
                empty_json: dict[str, Any] = {}
                json_path = storage.save_json(empty_json, "docs", "empty.json")
                assert json_path.exists()

                read_json = storage.read_json("docs", "empty.json")
                assert read_json == empty_json

    def test_list_files_with_mixed_content(self) -> None:
        """Test list_files with mixed files and directories."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Create mixed content
                uploads_dir = storage.get_uploads_dir()

                # Create files
                (uploads_dir / "file1.txt").write_text("content1")
                (uploads_dir / "file2.json").write_text('{"key": "value"}')

                # Create directories
                (uploads_dir / "subdir1").mkdir()
                (uploads_dir / "subdir2").mkdir()

                # Create file in subdirectory
                (uploads_dir / "subdir1" / "nested.txt").write_text(
                    "nested content"
                )

                # List files
                files = storage.list_files("uploads")
                file_names = [f.name for f in files]

                # Should include files and directories at root level
                assert "file1.txt" in file_names
                assert "file2.json" in file_names
                assert "subdir1" in file_names
                assert "subdir2" in file_names

                # Should not include nested files
                assert "nested.txt" not in file_names

                # Verify file/directory types
                files_dict = {f.name: f for f in files}
                assert files_dict["file1.txt"].is_file()
                assert files_dict["file2.json"].is_file()
                assert files_dict["subdir1"].is_dir()
                assert files_dict["subdir2"].is_dir()

    def test_file_path_edge_cases(self) -> None:
        """Test get_file_path with various edge cases."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Test with non-existent file
                assert (
                    storage.get_file_path("uploads", "nonexistent.txt") is None
                )

                # Test with directory instead of file
                uploads_dir = storage.get_uploads_dir()
                (uploads_dir / "testdir").mkdir()

                dir_path = storage.get_file_path("uploads", "testdir")
                assert dir_path is not None
                assert dir_path.is_dir()

                # Test with existing file
                (uploads_dir / "testfile.txt").write_text("content")
                file_path = storage.get_file_path("uploads", "testfile.txt")
                assert file_path is not None
                assert file_path.is_file()

    def test_storage_persistence_across_instances(self) -> None:
        """Test that storage persists across different instances."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                # Create first storage instance and save data
                storage1 = WaldiezLocalStorage()
                test_data = {"test": "persistence"}
                storage1.save_json(test_data, "docs", "persistent.json")
                storage1.save_file(b"binary data", "uploads", "persistent.bin")

                # Create second storage instance
                storage2 = WaldiezLocalStorage()

                # Data should be accessible from second instance
                assert storage2.file_exists("docs", "persistent.json")
                assert storage2.file_exists("uploads", "persistent.bin")

                read_json = storage2.read_json("docs", "persistent.json")
                assert read_json == test_data

                read_binary = storage2.read_file("uploads", "persistent.bin")
                assert read_binary == b"binary data"
