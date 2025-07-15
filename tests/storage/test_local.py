# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access,line-too-long
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
# pyright: reportPrivateUsage=false
# flake8: noqa: F401, E501
"""Test waldiez.storage._local.*."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.storage._local import WaldiezLocalStorage


class TestWaldiezLocalStorageInit:
    """Test WaldiezLocalStorage initialization."""

    @patch("waldiez.storage._local.user_data_dir")
    def test_init_creates_directories(
        self, mock_user_data_dir: MagicMock, tmp_path: Path
    ) -> None:
        """Test that initialization creates all required directories."""
        mock_user_data_dir.return_value = str(tmp_path)

        WaldiezLocalStorage()

        # Check that directories are created
        base_path = tmp_path / "local"
        assert base_path.exists()

        expected_dirs = [
            "uploads",
            "docs",
            "parsed_docs",
            "embeddings",
            "chroma",
        ]
        for dir_name in expected_dirs:
            assert (base_path / dir_name).exists()
            assert (base_path / dir_name).is_dir()

    @patch("waldiez.storage._local.user_data_dir")
    def test_init_sets_correct_paths(
        self,
        mock_user_data_dir: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Test that initialization sets correct internal paths."""
        test_path = str(tmp_path / "test_init_sets_correct_paths")
        mock_user_data_dir.return_value = test_path

        storage = WaldiezLocalStorage()

        expected_base = Path(test_path)
        expected_root = expected_base / "local"

        assert storage._base_dir == expected_base
        assert storage._local_root == expected_root
        assert storage._dirs["uploads"] == expected_root / "uploads"
        assert storage._dirs["docs"] == expected_root / "docs"
        assert storage._dirs["parsed_docs"] == expected_root / "parsed_docs"
        assert storage._dirs["embeddings"] == expected_root / "embeddings"
        assert storage._dirs["chroma"] == expected_root / "chroma"


class TestWaldiezLocalStorageDirectoryMethods:
    """Test WaldiezLocalStorage directory accessor methods."""

    def test_get_root_dir(self, tmp_path: Path) -> None:
        """Test get_root_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_root_dir()
            expected = tmp_path / "local"
            assert result == expected

    def test_get_uploads_dir(self, tmp_path: Path) -> None:
        """Test get_uploads_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_uploads_dir()
            expected = tmp_path / "local" / "uploads"
            assert result == expected

    def test_get_docs_dir(self, tmp_path: Path) -> None:
        """Test get_docs_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_docs_dir()
            expected = tmp_path / "local" / "docs"
            assert result == expected

    def test_get_parsed_docs_dir(self, tmp_path: Path) -> None:
        """Test get_parsed_docs_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_parsed_docs_dir()
            expected = tmp_path / "local" / "parsed_docs"
            assert result == expected

    def test_get_embeddings_dir(self, tmp_path: Path) -> None:
        """Test get_embeddings_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_embeddings_dir()
            expected = tmp_path / "local" / "embeddings"
            assert result == expected

    def test_get_chroma_db_dir(self, tmp_path: Path) -> None:
        """Test get_chroma_db_dir returns correct path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            result = storage.get_chroma_db_dir()
            expected = tmp_path / "local" / "chroma"
            assert result == expected


class TestWaldiezLocalStorageResolveDir:
    """Test WaldiezLocalStorage directory resolution."""

    def test_resolve_dir_valid_directories(self, tmp_path: Path) -> None:
        """Test _resolve_dir with valid directory names."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            valid_dirs = [
                "uploads",
                "docs",
                "parsed_docs",
                "embeddings",
                "chroma",
            ]
            for dir_name in valid_dirs:
                result = storage._resolve_dir(dir_name)
                expected = tmp_path / "local" / dir_name
                assert result == expected

    def test_resolve_dir_invalid_directory(self, tmp_path: Path) -> None:
        """Test _resolve_dir with invalid directory name."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid_dir"
            ):
                storage._resolve_dir("invalid_dir")


class TestWaldiezLocalStorageFileOperations:
    """Test WaldiezLocalStorage file operations."""

    def test_save_file_from_path(self, tmp_path: Path) -> None:
        """Test saving a file from a path."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a source file
            source_file = tmp_path / "source.txt"
            source_file.write_text("test content")

            # Save the file
            result = storage.save_file(source_file, "uploads", "target.txt")

            expected_path = tmp_path / "local" / "uploads" / "target.txt"
            assert result == expected_path
            assert expected_path.exists()
            assert expected_path.read_text() == "test content"

    def test_save_file_from_path_without_filename(self, tmp_path: Path) -> None:
        """Test saving a file from a path without specifying filename."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a source file
            source_file = tmp_path / "source.txt"
            source_file.write_text("test content")

            # Save the file without filename
            result = storage.save_file(source_file, "uploads")

            expected_path = tmp_path / "local" / "uploads" / "source.txt"
            assert result == expected_path
            assert expected_path.exists()
            assert expected_path.read_text() == "test content"

    def test_save_file_from_bytes(self, tmp_path: Path) -> None:
        """Test saving a file from bytes."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            content = b"binary test content"
            result = storage.save_file(content, "uploads", "test.bin")

            expected_path = tmp_path / "local" / "uploads" / "test.bin"
            assert result == expected_path
            assert expected_path.exists()
            assert expected_path.read_bytes() == content

    def test_save_file_from_bytes_without_filename(
        self, tmp_path: Path
    ) -> None:
        """Test saving bytes without filename raises ValueError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            content = b"binary test content"
            with pytest.raises(
                ValueError,
                match="Filename must be provided when saving bytes",
            ):
                storage.save_file(content, "uploads")

    def test_save_file_unsupported_type(self, tmp_path: Path) -> None:
        """Test saving unsupported file type raises TypeError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(TypeError, match="Unsupported file type"):
                storage.save_file(
                    123,  # type: ignore
                    "uploads",
                    "test.txt",
                )

    def test_save_file_with_content_parameter(self, tmp_path: Path) -> None:
        """Test saving file with content parameter overwrites file content."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a source file
            source_file = tmp_path / "source.txt"
            source_file.write_text("original content")

            # Save with different content
            new_content = b"new content"
            result = storage.save_file(
                source_file, "uploads", "test.txt", content=new_content
            )

            expected_path = tmp_path / "local" / "uploads" / "test.txt"
            assert result == expected_path
            assert expected_path.read_bytes() == new_content

    def test_list_files(self, tmp_path: Path) -> None:
        """Test listing files in a directory."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create some test files
            uploads_dir = tmp_path / "local" / "uploads"
            (uploads_dir / "file1.txt").write_text("content1")
            (uploads_dir / "file2.txt").write_text("content2")
            (uploads_dir / "subdir").mkdir()

            result = storage.list_files("uploads")

            # Check that all files and directories are listed
            file_names = [p.name for p in result]
            assert "file1.txt" in file_names
            assert "file2.txt" in file_names
            assert "subdir" in file_names
            assert len(result) == 3

    def test_delete_file_existing(self, tmp_path: Path) -> None:
        """Test deleting an existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a test file
            uploads_dir = tmp_path / "local" / "uploads"
            test_file = uploads_dir / "test.txt"
            test_file.write_text("test content")

            assert test_file.exists()
            result = storage.delete_file("uploads", "test.txt")

            assert result is True
            assert not test_file.exists()

    def test_delete_file_nonexistent(self, tmp_path: Path) -> None:
        """Test deleting a non-existent file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            result = storage.delete_file("uploads", "nonexistent.txt")
            assert result is False

    def test_read_file_existing(self, tmp_path: Path) -> None:
        """Test reading an existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a test file
            uploads_dir = tmp_path / "local" / "uploads"
            test_file = uploads_dir / "test.txt"
            content = b"test binary content"
            test_file.write_bytes(content)

            result = storage.read_file("uploads", "test.txt")
            assert result == content

    def test_read_file_nonexistent(self, tmp_path: Path) -> None:
        """Test reading a non-existent file raises FileNotFoundError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                FileNotFoundError,
                match="File nonexistent.txt not found in uploads",
            ):
                storage.read_file("uploads", "nonexistent.txt")

    def test_read_file_directory(self, tmp_path: Path) -> None:
        """Test reading a directory raises ValueError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a subdirectory
            uploads_dir = tmp_path / "local" / "uploads"
            (uploads_dir / "subdir").mkdir()

            with pytest.raises(ValueError, match="subdir is not a file"):
                storage.read_file("uploads", "subdir")

    def test_file_exists_true(self, tmp_path: Path) -> None:
        """Test file_exists returns True for existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a test file
            uploads_dir = tmp_path / "local" / "uploads"
            uploads_dir.mkdir(parents=True, exist_ok=True)
            (uploads_dir / "test.txt").write_text("content")

            assert storage.file_exists("uploads", "test.txt") is True

    def test_file_exists_false(self, tmp_path: Path) -> None:
        """Test file_exists returns False for non-existent file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            assert storage.file_exists("uploads", "nonexistent.txt") is False

    def test_get_file_path_existing(self, tmp_path: Path) -> None:
        """Test get_file_path returns path for existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a test file
            uploads_dir = tmp_path / "local" / "uploads"
            test_file = uploads_dir / "test.txt"
            test_file.write_text("content")

            result = storage.get_file_path("uploads", "test.txt")
            assert result == test_file

    def test_get_file_path_nonexistent(self, tmp_path: Path) -> None:
        """Test get_file_path returns None for non-existent file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            result = storage.get_file_path("uploads", "nonexistent.txt")
            assert result is None


class TestWaldiezLocalStorageJsonOperations:
    """Test WaldiezLocalStorage JSON operations."""

    def test_save_json(self, tmp_path: Path) -> None:
        """Test saving JSON data to file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            data: dict[str, Any] = {"key": "value", "number": 42}
            result = storage.save_json(data, "docs", "test.json")

            expected_path = tmp_path / "local" / "docs" / "test.json"
            assert result == expected_path
            assert expected_path.exists()

            # Verify content
            saved_data = json.loads(expected_path.read_text())
            assert saved_data == data

    def test_save_json_with_custom_indent(self, tmp_path: Path) -> None:
        """Test saving JSON with custom indentation."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            data = {"key": "value"}
            result = storage.save_json(data, "docs", "test.json", indent=4)

            content = result.read_text()
            # With indent=4, should have 4 spaces before "key"
            assert '    "key"' in content

    def test_read_json_existing(self, tmp_path: Path) -> None:
        """Test reading existing JSON file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a JSON file
            data: dict[str, Any] = {"test": "data", "number": 123}
            docs_dir = tmp_path / "local" / "docs"
            json_file = docs_dir / "test.json"
            json_file.write_text(json.dumps(data))

            result = storage.read_json("docs", "test.json")
            assert result == data

    def test_read_json_nonexistent(self, tmp_path: Path) -> None:
        """Test reading non-existent JSON file raises FileNotFoundError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                FileNotFoundError,
                match="JSON file nonexistent.json not found in docs",
            ):
                storage.read_json("docs", "nonexistent.json")


class TestWaldiezLocalStorageAsyncOperations:
    """Test WaldiezLocalStorage async operations."""

    @pytest.mark.asyncio
    async def test_a_save_json(self, tmp_path: Path) -> None:
        """Test async JSON saving."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            data: dict[str, Any] = {"async": "test", "number": 42}
            # Create a mock for aiofiles.open
            with patch("aiofiles.open") as mock_open:
                mock_file = AsyncMock()
                mock_open.return_value.__aenter__.return_value = mock_file
                mock_open.return_value.__aexit__ = AsyncMock()
                mock_file.write = AsyncMock()

                result = await storage.a_save_json(
                    data, "docs", "async_test.json"
                )
                expected_path = tmp_path / "local" / "docs" / "async_test.json"
                assert result == expected_path

                # Verify aiofiles.open was called with correct parameters
                mock_open.assert_called_once_with(
                    expected_path, "w", encoding="utf-8", newline="\n"
                )

                # Verify write was called with JSON data
                mock_file.write.assert_called_once()
                written_data = mock_file.write.call_args[0][0]
                assert json.loads(written_data) == data

    @pytest.mark.asyncio
    async def test_a_read_json_existing(self, tmp_path: Path) -> None:
        """Test async JSON reading of existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a JSON file
            data: dict[str, Any] = {"async": "read", "test": True}
            docs_dir = tmp_path / "local" / "docs"
            json_file = docs_dir / "test.json"
            docs_dir.mkdir(parents=True, exist_ok=True)
            json_file.touch()
            json_content = json.dumps(data)

            with patch("aiofiles.open") as mock_open:
                mock_file = AsyncMock()
                mock_file.write = AsyncMock()
                mock_open.return_value.__aenter__ = AsyncMock(
                    return_value=mock_file
                )
                mock_open.return_value.__aexit__ = AsyncMock()
                mock_file.read = AsyncMock(return_value=json_content)

                result = await storage.a_read_json("docs", "test.json")

                assert result == data
                mock_open.assert_called_once_with(
                    json_file, "r", encoding="utf-8"
                )

    @pytest.mark.asyncio
    async def test_a_read_json_nonexistent(self, tmp_path: Path) -> None:
        """Test async JSON reading of non-existent file raises FileNotFoundError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                FileNotFoundError,
                match="JSON file nonexistent.json not found in docs",
            ):
                await storage.a_read_json("docs", "nonexistent.json")

    @pytest.mark.asyncio
    async def test_a_read_file_existing(self, tmp_path: Path) -> None:
        """Test async file reading of existing file."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()
            # Create a test file
            uploads_dir = tmp_path / "local" / "uploads"
            test_file = uploads_dir / "test.bin"
            test_file.write_bytes(b"async file content")

            # Mock aiofiles.open to simulate async file reading
            with patch("aiofiles.open") as mock_open:
                mock_file = AsyncMock()
                mock_open.return_value.__aenter__.return_value = mock_file
                mock_open.return_value.__aexit__ = AsyncMock()
                mock_file.read = AsyncMock(return_value=b"async file content")

                result = await storage.a_read_file("uploads", "test.bin")

                assert result == b"async file content"
                mock_open.assert_called_once_with(test_file, "rb")
                mock_file.read.assert_called_once()

    @pytest.mark.asyncio
    async def test_a_read_file_nonexistent(self, tmp_path: Path) -> None:
        """Test async file reading of non-existent file raises FileNotFoundError."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                FileNotFoundError,
                match="File nonexistent.bin not found in uploads",
            ):
                await storage.a_read_file("uploads", "nonexistent.bin")

    @pytest.mark.asyncio
    async def test_a_write_file(self, tmp_path: Path) -> None:
        """Test async file writing."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            content = b"async write content"
            with patch("aiofiles.open") as mock_open:
                mock_file = AsyncMock()
                mock_open.return_value.__aenter__.return_value = mock_file
                mock_open.return_value.__aexit__ = AsyncMock()
                mock_file.write = AsyncMock()

                result = await storage.a_write_file(
                    content, "uploads", "async_write.bin"
                )

                expected_path = (
                    tmp_path / "local" / "uploads" / "async_write.bin"
                )
                assert result == expected_path

                # Verify aiofiles.open was called with correct parameters
                mock_open.assert_called_once_with(expected_path, "wb")

                # Verify write was called with content
                mock_file.write.assert_called_once_with(content)


class TestWaldiezLocalStorageEdgeCases:
    """Test WaldiezLocalStorage edge cases and error conditions."""

    def test_save_file_string_path(self, tmp_path: Path) -> None:
        """Test saving file using string path instead of Path object."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Create a source file
            source_file = str(tmp_path / "source.txt")
            Path(source_file).write_text("test content", encoding="utf-8")

            # Save the file using string path
            result = storage.save_file(source_file, "uploads", "target.txt")

            expected_path = tmp_path / "local" / "uploads" / "target.txt"
            assert result == expected_path
            assert expected_path.exists()
            assert expected_path.read_text() == "test content"

    def test_invalid_target_directory_in_methods(self, tmp_path: Path) -> None:
        """Test that invalid target directories raise ValueError in various methods."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=str(tmp_path)
        ):
            storage = WaldiezLocalStorage()

            # Test various methods with invalid directory
            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.save_file(b"content", "invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.list_files("invalid")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.delete_file("invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.read_file("invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.file_exists("invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.get_file_path("invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.save_json({}, "invalid", "test.json")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                storage.read_json("invalid", "test.json")

    @pytest.mark.asyncio
    async def test_async_methods_invalid_directory(
        self, tmp_path: Path
    ) -> None:
        """Test that async methods also raise ValueError for invalid directories."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=tmp_path
        ):
            storage = WaldiezLocalStorage()

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                await storage.a_save_json({}, "invalid", "test.json")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                await storage.a_read_json("invalid", "test.json")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                await storage.a_read_file("invalid", "test.txt")

            with pytest.raises(
                ValueError, match="Invalid target directory: invalid"
            ):
                await storage.a_write_file(b"content", "invalid", "test.txt")

    def test_save_json_with_default_indent(self, tmp_path: Path) -> None:
        """Test saving JSON with default indentation."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=tmp_path
        ):
            storage = WaldiezLocalStorage()

            data = {"key": "value"}
            result = storage.save_json(data, "docs", "test.json")

            content = result.read_text()
            # With default indent=2, should have 2 spaces before "key"
            assert '  "key"' in content

    @pytest.mark.asyncio
    async def test_a_save_json_with_custom_indent(self, tmp_path: Path) -> None:
        """Test async JSON saving with custom indentation."""
        with patch(
            "waldiez.storage._local.user_data_dir", return_value=tmp_path
        ):
            storage = WaldiezLocalStorage()

            data: dict[str, Any] = {"key": "value"}

            # Create a mock for aiofiles.open
            with patch("aiofiles.open") as mock_open:
                mock_file = AsyncMock()
                mock_open.return_value.__aenter__.return_value = mock_file
                mock_open.return_value.__aexit__ = AsyncMock()
                mock_file.write = AsyncMock()

                result = await storage.a_save_json(
                    data, "docs", "test.json", indent=4
                )

                expected_path = tmp_path / "local" / "docs" / "test.json"
                assert result == expected_path

                # Verify content with custom indent
                written_data = mock_file.write.call_args[0][0]
                assert '    "key"' in written_data
