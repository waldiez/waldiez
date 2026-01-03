# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc
"""Tests for waldiez.io.models.content.image.*."""

from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.io.models.content.base import ImageContent
from waldiez.io.models.content.image import (
    ImageMediaContent,
    ImageUrlMediaContent,
)


class TestImageMediaContent:
    """Test suite for ImageMediaContent class."""

    def test_image_media_content_creation(self) -> None:
        """Test creating an ImageMediaContent instance."""
        image_content = ImageContent(url="https://example.com/image.jpg")
        content = ImageMediaContent(image=image_content)

        assert content.type == "image"
        assert content.image == image_content

    def test_image_media_content_type_literal(self) -> None:
        """Test that type is fixed to 'image'."""
        image_content = ImageContent(file="base64_data")
        content = ImageMediaContent(image=image_content)

        assert content.type == "image"

    def test_image_media_content_required_field(self) -> None:
        """Test that image field is required."""
        with pytest.raises(ValueError):
            ImageMediaContent()  # type: ignore

    @patch("waldiez.io.models.content.image.get_image")
    def test_image_media_content_to_string_with_url(
        self, mock_get_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test to_string with image URL."""
        mock_get_image.return_value = "processed_image_path.jpg"

        image_content = ImageContent(url="https://example.com/image.jpg")
        content = ImageMediaContent(image=image_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<img processed_image_path.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=tmp_path,
            image_data="https://example.com/image.jpg",
            base_name=None,
        )

    @patch("waldiez.io.models.content.image.get_image")
    def test_image_media_content_to_string_with_file(
        self, mock_get_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test to_string with image file data."""
        mock_get_image.return_value = "processed_file_path.jpg"

        image_content = ImageContent(file="base64_encoded_data")
        content = ImageMediaContent(image=image_content)

        result = content.to_string(uploads_root=tmp_path, base_name="test")

        assert result == "<img processed_file_path.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=tmp_path,
            image_data="base64_encoded_data",
            base_name="test",
        )

    def test_image_media_content_to_string_no_url_no_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string when neither URL nor file is present."""
        image_content = ImageContent()  # No URL or file
        content = ImageMediaContent(image=image_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "None"  # str(None)

    def test_image_media_content_to_string_url_priority(
        self, tmp_path: Path
    ) -> None:
        """Test that URL takes priority over file when both present."""
        with patch(
            "waldiez.io.models.content.image.get_image"
        ) as mock_get_image:
            mock_get_image.return_value = "url_processed.jpg"

            image_content = ImageContent(
                url="https://example.com/image.jpg", file="base64_data"
            )
            content = ImageMediaContent(image=image_content)

            result = content.to_string(uploads_root=tmp_path)

            assert result == "<img url_processed.jpg>"
            # Should call get_image with URL, not file data
            mock_get_image.assert_called_once_with(
                uploads_root=tmp_path,
                image_data="https://example.com/image.jpg",
                base_name=None,
            )

    def test_image_media_content_model_dump(self) -> None:
        """Test model serialization."""
        image_content = ImageContent(url="https://example.com/test.jpg")
        content = ImageMediaContent(image=image_content)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "image"
        assert "image" in dumped
        assert dumped["image"]["url"] == "https://example.com/test.jpg"


class TestImageUrlMediaContent:
    """Test suite for ImageUrlMediaContent class."""

    def test_image_url_media_content_creation(self) -> None:
        """Test creating an ImageUrlMediaContent instance."""
        image_content = ImageContent(url="https://example.com/image.jpg")
        content = ImageUrlMediaContent(image_url=image_content)

        assert content.type == "image_url"
        assert content.image_url == image_content

    def test_image_url_media_content_type_literal(self) -> None:
        """Test that type is fixed to 'image_url'."""
        image_content = ImageContent(url="https://example.com/image.jpg")
        content = ImageUrlMediaContent(image_url=image_content)

        assert content.type == "image_url"

    def test_image_url_media_content_required_field(self) -> None:
        """Test that image_url field is required."""
        with pytest.raises(ValueError):
            ImageUrlMediaContent()  # type: ignore

    @patch("waldiez.io.models.content.image.get_image")
    def test_image_url_media_content_to_string_with_url(
        self, mock_get_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test to_string with image URL."""
        mock_get_image.return_value = "processed_image_url.jpg"

        image_content = ImageContent(url="https://example.com/image.jpg")
        content = ImageUrlMediaContent(image_url=image_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<img processed_image_url.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=tmp_path,
            image_data="https://example.com/image.jpg",
            base_name=None,
        )

    @patch("waldiez.io.models.content.image.get_image")
    def test_image_url_media_content_to_string_with_file(
        self, mock_get_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test to_string with image file data."""
        mock_get_image.return_value = "processed_file_url.jpg"

        image_content = ImageContent(file="base64_encoded_data")
        content = ImageUrlMediaContent(image_url=image_content)

        result = content.to_string(uploads_root=tmp_path, base_name="test")

        assert result == "<img processed_file_url.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=tmp_path,
            image_data="base64_encoded_data",
            base_name="test",
        )

    def test_image_url_media_content_to_string_no_url_no_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string when neither URL nor file is present."""
        image_content = ImageContent()  # No URL or file
        content = ImageUrlMediaContent(image_url=image_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "None"  # str(None)

    def test_image_url_media_content_to_string_url_priority(
        self, tmp_path: Path
    ) -> None:
        """Test that URL takes priority over file when both present."""
        with patch(
            "waldiez.io.models.content.image.get_image"
        ) as mock_get_image:
            mock_get_image.return_value = "url_priority.jpg"

            image_content = ImageContent(
                url="https://example.com/image.jpg", file="base64_data"
            )
            content = ImageUrlMediaContent(image_url=image_content)

            result = content.to_string(uploads_root=tmp_path)

            assert result == "<img url_priority.jpg>"
            # Should call get_image with URL, not file data
            mock_get_image.assert_called_once_with(
                uploads_root=tmp_path,
                image_data="https://example.com/image.jpg",
                base_name=None,
            )

    def test_image_url_media_content_to_string_none_uploads_root(self) -> None:
        """Test to_string with None uploads_root."""
        with patch(
            "waldiez.io.models.content.image.get_image"
        ) as mock_get_image:
            mock_get_image.return_value = "no_uploads_root.jpg"

            image_content = ImageContent(url="https://example.com/image.jpg")
            content = ImageUrlMediaContent(image_url=image_content)

            result = content.to_string(uploads_root=None)

            assert result == "<img no_uploads_root.jpg>"
            mock_get_image.assert_called_once_with(
                uploads_root=None,
                image_data="https://example.com/image.jpg",
                base_name=None,
            )

    def test_image_url_media_content_model_dump(self) -> None:
        """Test model serialization."""
        image_content = ImageContent(url="https://example.com/test.jpg")
        content = ImageUrlMediaContent(image_url=image_content)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "image_url"
        assert "image_url" in dumped
        assert dumped["image_url"]["url"] == "https://example.com/test.jpg"

    def test_image_url_media_content_from_dict(self) -> None:
        """Test creating ImageUrlMediaContent from dictionary."""
        data: dict[str, Any] = {
            "type": "image_url",
            "image_url": {
                "url": "https://example.com/test.jpg",
                "alt": "Test image",
            },
        }
        content = ImageUrlMediaContent(**data)

        assert content.type == "image_url"
        assert content.image_url.url == "https://example.com/test.jpg"
        assert content.image_url.alt == "Test image"

    def test_image_url_media_content_with_alt_text(self) -> None:
        """Test ImageUrlMediaContent with alt text."""
        image_content = ImageContent(
            url="https://example.com/image.jpg", alt="A beautiful landscape"
        )
        content = ImageUrlMediaContent(image_url=image_content)

        assert content.image_url.alt == "A beautiful landscape"

    @patch("waldiez.io.models.content.image.get_image")
    def test_image_url_media_content_get_image_called_correctly(
        self, mock_get_image: MagicMock
    ) -> None:
        """Test that get_image is called with correct parameters."""
        mock_get_image.return_value = "result.jpg"

        image_content = ImageContent(url="https://example.com/test.jpg")
        content = ImageUrlMediaContent(image_url=image_content)

        uploads_root = Path("/custom/uploads")
        base_name = "custom_base"

        result = content.to_string(
            uploads_root=uploads_root, base_name=base_name
        )

        assert result == "<img result.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=uploads_root,
            image_data="https://example.com/test.jpg",
            base_name=base_name,
        )

    def test_image_url_media_content_equality(self) -> None:
        """Test equality comparison between ImageUrlMediaContent instances."""
        image_content1 = ImageContent(url="https://example.com/same.jpg")
        image_content2 = ImageContent(url="https://example.com/same.jpg")
        image_content3 = ImageContent(url="https://example.com/different.jpg")

        content1 = ImageUrlMediaContent(image_url=image_content1)
        content2 = ImageUrlMediaContent(image_url=image_content2)
        content3 = ImageUrlMediaContent(image_url=image_content3)

        assert content1 == content2
        assert content1 != content3
