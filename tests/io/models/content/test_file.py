# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc
"""Tests for waldiez.io.models.content.file.*."""

from pathlib import Path
from typing import Any

import pytest

from waldiez.io.models.content.base import FileContent
from waldiez.io.models.content.file import FileMediaContent


class TestFileMediaContent:
    """Test suite for FileMediaContent class."""

    def test_file_media_content_creation_file_type(self) -> None:
        """Test creating FileMediaContent with 'file' type."""
        file_content = FileContent(name="document.pdf")
        content = FileMediaContent(type="file", file=file_content)

        assert content.type == "file"
        assert content.file == file_content

    def test_file_media_content_invalid_type(self) -> None:
        """Test that invalid type values are rejected."""
        file_content = FileContent(name="test.txt")

        # Valid types should work
        FileMediaContent(type="file", file=file_content)

        # Invalid type should fail
        with pytest.raises(ValueError):
            FileMediaContent(type="invalid", file=file_content)  # type: ignore

    def test_file_media_content_to_string_with_url(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with file URL."""
        file_content = FileContent(
            name="document.pdf", url="https://example.com/document.pdf"
        )
        content = FileMediaContent(type="file", file=file_content)

        result = content.to_string(uploads_root=tmp_path)

        assert (
            result
            == "<a href='https://example.com/document.pdf'>document.pdf</a>"
        )

    def test_file_media_content_to_string_with_file_data(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with file data."""
        file_content = FileContent(name="data.bin", file="binary_file_data")
        content = FileMediaContent(type="file", file=file_content)

        result = content.to_string(uploads_root=tmp_path, base_name="test")

        assert result == "<a href='binary_file_data'>data.bin</a>"

    def test_file_media_content_to_string_no_url_no_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string when neither URL nor file data is present."""
        file_content = FileContent(name="empty.txt")  # No URL or file data
        content = FileMediaContent(type="file", file=file_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "None"  # str(None)

    def test_file_media_content_to_string_url_priority(
        self, tmp_path: Path
    ) -> None:
        """Test that URL takes priority over file data when both present."""
        file_content = FileContent(
            name="p_test.pdf",
            url="https://example.com/document.pdf",
            file="binary_data",
        )
        content = FileMediaContent(type="file", file=file_content)

        result = content.to_string(uploads_root=tmp_path)

        assert (
            result
            == "<a href='https://example.com/document.pdf'>p_test.pdf</a>"
        )

    def test_file_media_content_to_string_ignores_uploads_params(self) -> None:
        """Test that to_string ignores uploads_root and base_name for files."""
        file_content = FileContent(
            name="test.pdf", url="https://example.com/test.pdf"
        )
        content = FileMediaContent(type="file", file=file_content)

        result1 = content.to_string(None)
        result2 = content.to_string(
            uploads_root=Path("/custom"), base_name="custom"
        )

        assert result1 == result2
        assert result1 == "<a href='https://example.com/test.pdf'>test.pdf</a>"

    def test_file_media_content_with_special_characters_in_name(self) -> None:
        """Test FileMediaContent with special characters in filename."""
        special_names = [
            "file with spaces.pdf",
            "file-with-dashes.txt",
            "file_with_underscores.docx",
            "file.with.dots.tar.gz",
            "файл.txt",  # Cyrillic
            "文件.pdf",  # Chinese
        ]

        for name in special_names:
            file_content = FileContent(
                name=name, url="https://example.com/test"
            )
            content = FileMediaContent(type="file", file=file_content)

            result = content.to_string(None)
            assert f">{name}</a>" in result
            assert f"<a href='https://example.com/test'>{name}</a>" == result

    def test_file_media_content_with_additional_properties(self) -> None:
        """Test FileMediaContent with additional file properties."""
        file_content = FileContent(
            name="document.pdf",
            url="https://example.com/document.pdf",
            size=2048,
            type="application/pdf",
            previewUrl="https://example.com/preview.jpg",
        )
        content = FileMediaContent(type="file", file=file_content)

        # to_string should still only use URL/file and name for output
        result = content.to_string(None)
        assert (
            result
            == "<a href='https://example.com/document.pdf'>document.pdf</a>"
        )

        # But properties should be preserved
        assert content.file.size == 2048
        assert content.file.type == "application/pdf"
        assert content.file.previewUrl == "https://example.com/preview.jpg"

    def test_file_media_content_model_dump(self) -> None:
        """Test model serialization."""
        file_content = FileContent(
            name="test.pdf", url="https://example.com/test.pdf"
        )
        content = FileMediaContent(type="file", file=file_content)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "file"
        assert "file" in dumped
        assert dumped["file"]["name"] == "test.pdf"
        assert dumped["file"]["url"] == "https://example.com/test.pdf"

    def test_file_media_content_from_dict(self) -> None:
        """Test creating FileMediaContent from dictionary."""
        file_type = (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        )
        data: dict[str, Any] = {
            "type": "file",
            "file": {
                "name": "report.docx",
                "url": "https://example.com/report.docx",
                "size": 4096,
                "type": file_type,
            },
        }
        content = FileMediaContent(**data)

        assert content.type == "file"
        assert content.file.name == "report.docx"
        assert content.file.url == "https://example.com/report.docx"
        assert content.file.size == 4096
        assert content.file.type == file_type
