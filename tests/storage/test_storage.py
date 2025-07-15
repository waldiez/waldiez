# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc,no-self-use,line-too-long
# flake8: noqa: F401, E501
"""Test waldiez.storage module."""

import tempfile
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

import waldiez.storage as storage_module
from waldiez.storage import (
    WaldiezLocalStorage,
    WaldiezStorage,
    get_waldiez_storage,
)


class TestStorageModule:
    """Test the storage module's public interface."""

    def test_imports_available(self) -> None:
        """Test that all expected exports are available."""
        # Test that all expected classes and functions are importable
        assert WaldiezLocalStorage is not None
        assert WaldiezStorage is not None
        assert get_waldiez_storage is not None

    def test_get_waldiez_storage_returns_local_storage(self) -> None:
        """Test that get_waldiez_storage returns a WaldiezLocalStorage instance."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                assert isinstance(storage, WaldiezLocalStorage)
                assert isinstance(storage, WaldiezStorage)

    def test_get_waldiez_storage_creates_working_storage(self) -> None:
        """Test that get_waldiez_storage returns a fully functional storage instance."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test that the storage instance works
                assert storage.get_root_dir() == Path(temp_dir) / "local"
                assert (
                    storage.get_uploads_dir()
                    == Path(temp_dir) / "local" / "uploads"
                )

                # Test basic file operations
                test_data = b"test content"
                saved_path = storage.save_file(test_data, "uploads", "test.txt")
                assert saved_path.exists()
                assert storage.read_file("uploads", "test.txt") == test_data

    def test_get_waldiez_storage_multiple_calls(self) -> None:
        """Test that multiple calls to get_waldiez_storage return separate instances."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage1 = get_waldiez_storage()
                storage2 = get_waldiez_storage()

                # Should be separate instances but same type
                assert storage1 is not storage2
                # pylint: disable=unidiomatic-typecheck
                assert type(storage1) == type(storage2)  # noqa: C0123, E721
                assert isinstance(storage1, WaldiezLocalStorage)
                assert isinstance(storage2, WaldiezLocalStorage)

    def test_storage_protocol_compliance(self) -> None:
        """Test that WaldiezLocalStorage properly implements the WaldiezStorage protocol."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = WaldiezLocalStorage()

                # Test that it's recognized as implementing the protocol
                assert isinstance(storage, WaldiezStorage)

                # Test that all protocol methods are callable
                protocol_methods = [
                    "get_root_dir",
                    "get_uploads_dir",
                    "get_docs_dir",
                    "get_parsed_docs_dir",
                    "get_embeddings_dir",
                    "get_chroma_db_dir",
                    "save_file",
                    "list_files",
                    "delete_file",
                    "read_file",
                    "file_exists",
                    "get_file_path",
                    "save_json",
                    "read_json",
                ]

                for method_name in protocol_methods:
                    assert hasattr(storage, method_name)
                    assert callable(getattr(storage, method_name))

    def test_storage_async_methods(self) -> None:
        """Test that async methods are available on the storage instance."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test that async methods are available
                async_methods = [
                    "a_save_json",
                    "a_read_json",
                    "a_read_file",
                    "a_write_file",
                ]

                for method_name in async_methods:
                    assert hasattr(storage, method_name)
                    assert callable(getattr(storage, method_name))

    def test_module_all_exports(self) -> None:
        """Test that __all__ exports match what's actually available."""
        # Check that __all__ is defined
        assert hasattr(storage_module, "__all__")

        expected_exports = [
            "WaldiezLocalStorage",
            "WaldiezStorage",
            "get_waldiez_storage",
        ]

        # Check that all expected exports are in __all__
        for export in expected_exports:
            assert export in storage_module.__all__

        # Check that all __all__ exports are actually available
        for export in storage_module.__all__:
            assert hasattr(storage_module, export)


class TestStorageIntegration:
    """Test integration between storage components."""

    def test_storage_directory_consistency(self) -> None:
        """Test that all storage directory methods return consistent paths."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                root_dir = storage.get_root_dir()

                # All directory methods should return paths under the root
                assert storage.get_uploads_dir() == root_dir / "uploads"
                assert storage.get_docs_dir() == root_dir / "docs"
                assert storage.get_parsed_docs_dir() == root_dir / "parsed_docs"
                assert storage.get_embeddings_dir() == root_dir / "embeddings"
                assert storage.get_chroma_db_dir() == root_dir / "chroma"

                # All directories should exist
                assert storage.get_uploads_dir().exists()
                assert storage.get_docs_dir().exists()
                assert storage.get_parsed_docs_dir().exists()
                assert storage.get_embeddings_dir().exists()
                assert storage.get_chroma_db_dir().exists()

    def test_storage_file_operations_across_directories(self) -> None:
        """Test file operations work across all supported directories."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test operations across all directories
                directories = [
                    "uploads",
                    "docs",
                    "parsed_docs",
                    "embeddings",
                    "chroma",
                ]

                for directory in directories:
                    # Test saving a file
                    content = f"test content for {directory}".encode()
                    filename = f"test_{directory}.txt"

                    saved_path = storage.save_file(content, directory, filename)
                    assert saved_path.exists()

                    # Test file exists
                    assert storage.file_exists(directory, filename)

                    # Test reading the file
                    read_content = storage.read_file(directory, filename)
                    assert read_content == content

                    # Test getting file path
                    file_path = storage.get_file_path(directory, filename)
                    assert file_path == saved_path

                    # Test listing files
                    files = storage.list_files(directory)
                    assert any(f.name == filename for f in files)

                    # Test deleting the file
                    assert storage.delete_file(directory, filename)
                    assert not storage.file_exists(directory, filename)

    def test_storage_json_operations_across_directories(self) -> None:
        """Test JSON operations work across all supported directories."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test JSON operations across all directories
                directories = [
                    "uploads",
                    "docs",
                    "parsed_docs",
                    "embeddings",
                    "chroma",
                ]

                for directory in directories:
                    data: dict[str, Any] = {
                        "directory": directory,
                        "test": True,
                        "number": 42,
                    }
                    filename = f"test_{directory}.json"

                    # Test saving JSON
                    saved_path = storage.save_json(data, directory, filename)
                    assert saved_path.exists()

                    # Test reading JSON
                    read_data = storage.read_json(directory, filename)
                    assert read_data == data

                    # Cleanup
                    storage.delete_file(directory, filename)

    @pytest.mark.asyncio
    async def test_storage_async_operations_integration(self) -> None:
        """Test async operations integration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test async JSON operations
                json_data: dict[str, Any] = {"async": True, "test": "data"}
                json_path = await storage.a_save_json(
                    json_data, "docs", "async_test.json"
                )
                assert json_path.exists()

                read_data = await storage.a_read_json("docs", "async_test.json")
                assert read_data == json_data

                # Test async file operations
                file_content = b"async file content"
                file_path = await storage.a_write_file(
                    file_content, "uploads", "async_test.bin"
                )
                assert file_path.exists()

                read_content = await storage.a_read_file(
                    "uploads", "async_test.bin"
                )
                assert read_content == file_content

    def test_storage_error_handling_consistency(self) -> None:
        """Test that error handling is consistent across storage operations."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test invalid directory handling
                invalid_dir = "invalid_directory"

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    storage.save_file(b"content", invalid_dir, "test.txt")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    storage.read_file(invalid_dir, "test.txt")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    storage.save_json({}, invalid_dir, "test.json")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    storage.read_json(invalid_dir, "test.json")

                # Test file not found handling
                with pytest.raises(FileNotFoundError):
                    storage.read_file("uploads", "nonexistent.txt")

                with pytest.raises(FileNotFoundError):
                    storage.read_json("docs", "nonexistent.json")

    @pytest.mark.asyncio
    async def test_storage_async_error_handling(self) -> None:
        """Test async error handling consistency."""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch(
                "waldiez.storage._local.user_data_dir", return_value=temp_dir
            ):
                storage = get_waldiez_storage()

                # Test invalid directory handling for async methods
                invalid_dir = "invalid_directory"

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    await storage.a_save_json({}, invalid_dir, "test.json")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    await storage.a_read_json(invalid_dir, "test.json")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    await storage.a_read_file(invalid_dir, "test.txt")

                with pytest.raises(
                    ValueError, match="Invalid target directory"
                ):
                    await storage.a_write_file(
                        b"content", invalid_dir, "test.txt"
                    )

                # Test file not found handling for async methods
                with pytest.raises(FileNotFoundError):
                    await storage.a_read_file("uploads", "nonexistent.txt")

                with pytest.raises(FileNotFoundError):
                    await storage.a_read_json("docs", "nonexistent.json")
