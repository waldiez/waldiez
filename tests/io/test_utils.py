# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
"""Test waldiez.io.utils.*."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.io.utils import (
    detect_media_type,
    get_image,
    is_json_dumped,
)


class TestDetectMediaType:
    """Test suite for detect_media_type function."""

    def test_detect_media_type_with_explicit_type(self) -> None:
        """Test detection with explicit 'type' field."""
        valid_types = [
            "text",
            "image",
            "image_url",
            "video",
            "audio",
            "file",
        ]

        for media_type in valid_types:
            value = {"type": media_type, "data": "some_data"}
            result = detect_media_type(value)
            assert result == media_type

    def test_detect_media_type_with_invalid_explicit_type(self) -> None:
        """Test detection with invalid explicit 'type' field."""
        value = {"type": "invalid_type", "data": "some_data"}

        with pytest.raises(ValueError) as exc_info:
            detect_media_type(value)

        assert "Invalid media type: invalid_type" in str(exc_info.value)

    def test_detect_media_type_by_key_presence_text(self) -> None:
        """Test detection by key presence - text."""
        value = {"text": "some text content"}
        result = detect_media_type(value)
        assert result == "text"

    def test_detect_media_type_by_key_presence_image(self) -> None:
        """Test detection by key presence - image."""
        value = {"image": "base64_image_data"}
        result = detect_media_type(value)
        assert result == "image"

    def test_detect_media_type_by_key_presence_image_url(self) -> None:
        """Test detection by key presence - image_url."""
        value = {"image_url": "http://example.com/image.jpg"}
        result = detect_media_type(value)
        assert result == "image_url"

    def test_detect_media_type_by_key_presence_video(self) -> None:
        """Test detection by key presence - video."""
        value = {"video": "video_data"}
        result = detect_media_type(value)
        assert result == "video"

    def test_detect_media_type_by_key_presence_audio(self) -> None:
        """Test detection by key presence - audio."""
        value = {"audio": "audio_data"}
        result = detect_media_type(value)
        assert result == "audio"

    def test_detect_media_type_by_key_presence_file(self) -> None:
        """Test detection by key presence - file."""
        value = {"file": "file_data"}
        result = detect_media_type(value)
        assert result == "file"

    def test_detect_media_type_multiple_keys_first_match(self) -> None:
        """Test detection with multiple keys - should return first match."""
        # The function checks types in order:
        # text, image, image_url, video, audio, file, document
        value = {
            "image": "image_data",
            "text": "text_data",
            "audio": "audio_data",
        }
        result = detect_media_type(value)
        assert result == "text"  # First in the valid_types order

    def test_detect_media_type_explicit_type_overrides_keys(self) -> None:
        """Test that explicit 'type' field overrides key detection."""
        value = {"type": "video", "text": "text_data", "image": "image_data"}
        result = detect_media_type(value)
        assert result == "video"

    def test_detect_media_type_no_valid_type_found(self) -> None:
        """Test detection when no valid type is found."""
        value = {"invalid_key": "some_data", "another_key": "more_data"}

        with pytest.raises(ValueError) as exc_info:
            detect_media_type(value)

        assert "No type in value:" in str(exc_info.value)
        assert str(value) in str(exc_info.value)

    def test_detect_media_type_empty_dict(self) -> None:
        """Test detection with empty dictionary."""
        value: dict[str, Any] = {}

        with pytest.raises(ValueError) as exc_info:
            detect_media_type(value)

        assert "No type in value:" in str(exc_info.value)

    def test_detect_media_type_type_field_none(self) -> None:
        """Test detection when 'type' field is None."""
        value: dict[str, str | None] = {"type": None, "text": "some_text"}

        with pytest.raises(ValueError) as exc_info:
            detect_media_type(value)

        assert "Invalid media type: None" in str(exc_info.value)

    def test_detect_media_type_type_field_empty_string(self) -> None:
        """Test detection when 'type' field is empty string."""
        value = {"type": "", "text": "some_text"}

        with pytest.raises(ValueError) as exc_info:
            detect_media_type(value)

        assert "Invalid media type:" in str(exc_info.value)


class TestGetImage:
    """Test suite for get_image function."""

    def test_get_image_no_uploads_root(self) -> None:
        """Test get_image when uploads_root is None."""
        image_data = "base64_encoded_image_data"
        result = get_image(None, image_data)
        assert result == image_data

    def test_get_image_no_uploads_root_with_base_name(self) -> None:
        """Test get_image when uploads_root is None with base_name."""
        image_data = "base64_encoded_image_data"
        result = get_image(None, image_data, "test_base")
        assert result == image_data

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_with_uploads_root_success(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image with uploads_root and successful image processing."""
        # Mock PIL Image
        mock_pil_image = MagicMock()
        mock_get_pil_image.return_value = mock_pil_image

        image_data = "base64_encoded_image_data"
        base_name = "test_image"

        result = get_image(tmp_path, image_data, base_name)

        expected_path = tmp_path / "test_image.png"
        assert result == str(expected_path)

        # Verify PIL image processing
        mock_get_pil_image.assert_called_once_with(image_data)
        mock_pil_image.save.assert_called_once_with(expected_path, format="PNG")

    @patch("waldiez.io.utils.get_pil_image")
    @patch("uuid.uuid4")
    def test_get_image_with_uploads_root_no_base_name(
        self,
        mock_uuid: MagicMock,
        mock_get_pil_image: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Test get_image with uploads_root but no base_name."""
        # Mock UUID generation
        mock_uuid.return_value.hex = "generated_uuid"

        # Mock PIL Image
        mock_pil_image = MagicMock()
        mock_get_pil_image.return_value = mock_pil_image

        image_data = "base64_encoded_image_data"

        result = get_image(tmp_path, image_data)

        expected_path = tmp_path / "generated_uuid.png"
        assert result == str(expected_path)

        # Verify UUID was called
        mock_uuid.assert_called_once()

        # Verify PIL image processing
        mock_get_pil_image.assert_called_once_with(image_data)
        mock_pil_image.save.assert_called_once_with(expected_path, format="PNG")

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_with_uploads_root_none_base_name(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image with uploads_root and None base_name."""
        # Mock PIL Image
        mock_pil_image = MagicMock()
        mock_get_pil_image.return_value = mock_pil_image

        image_data = "base64_encoded_image_data"

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = "auto_generated_uuid"

            result = get_image(tmp_path, image_data, None)

            expected_path = tmp_path / "auto_generated_uuid.png"
            assert result == str(expected_path)

            # Verify UUID was called for None base_name
            mock_uuid.assert_called_once()

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_pil_processing_exception(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image when PIL image processing raises an exception."""
        # Mock get_pil_image to raise an exception
        mock_get_pil_image.side_effect = Exception("PIL processing failed")

        image_data = "invalid_image_data"
        base_name = "test_image"

        result = get_image(tmp_path, image_data, base_name)

        # Should return original image_data when PIL processing fails
        assert result == image_data

        # Verify get_pil_image was called
        mock_get_pil_image.assert_called_once_with(image_data)

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_pil_processing_base_exception(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image when PIL image processing raises BaseException."""
        # Mock get_pil_image to raise BaseException (broader than Exception)
        mock_get_pil_image.side_effect = BaseException("System error")

        image_data = "corrupted_image_data"
        base_name = "test_image"

        result = get_image(tmp_path, image_data, base_name)

        # Should return original image_data when any BaseException occurs
        assert result == image_data

        # Verify get_pil_image was called
        mock_get_pil_image.assert_called_once_with(image_data)

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_save_exception_handling(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image when PIL image save operation fails."""
        # Mock PIL Image with save that raises exception
        mock_pil_image = MagicMock()
        mock_pil_image.save.side_effect = OSError("Cannot save file")
        mock_get_pil_image.return_value = mock_pil_image

        image_data = "base64_encoded_image_data"
        base_name = "test_image"

        # This should raise the OSError since it's not caught in the function
        with pytest.raises(OSError):
            get_image(tmp_path, image_data, base_name)

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_file_path_construction(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test get_image file path construction with different base names."""
        # Mock PIL Image
        mock_pil_image = MagicMock()
        mock_get_pil_image.return_value = mock_pil_image

        test_cases = [
            "simple_name",
            "name_with_underscores",
            "name-with-dashes",
            "name123with456numbers",
            "NameWithCamelCase",
        ]

        for base_name in test_cases:
            result = get_image(tmp_path, "image_data", base_name)
            expected_path = tmp_path / f"{base_name}.png"
            assert result == str(expected_path)

    def test_get_image_uploads_root_type_handling(self, tmp_path: Path) -> None:
        """Test get_image with different uploads_root types."""
        image_data = "base64_encoded_image_data"

        # Test with None
        result = get_image(None, image_data)
        assert result == image_data

        # Test with existing Path object
        with patch("waldiez.io.utils.get_pil_image") as mock_get_pil_image:
            mock_pil_image = MagicMock()
            mock_get_pil_image.return_value = mock_pil_image

            result = get_image(tmp_path, image_data, "test")
            expected_path = tmp_path / "test.png"
            assert result == str(expected_path)

    @patch("waldiez.io.utils.get_pil_image")
    def test_get_image_png_format_specified(
        self, mock_get_pil_image: MagicMock, tmp_path: Path
    ) -> None:
        """Test that get_image always saves as PNG format."""
        mock_pil_image = MagicMock()
        mock_get_pil_image.return_value = mock_pil_image

        image_data = "base64_encoded_image_data"
        base_name = "test_image"

        get_image(tmp_path, image_data, base_name)

        # Verify the format parameter is always PNG
        expected_path = tmp_path / "test_image.png"
        mock_pil_image.save.assert_called_once_with(expected_path, format="PNG")

    def test_get_image_edge_cases(self) -> None:
        """Test get_image with edge case inputs."""
        # Empty string image data
        result = get_image(None, "")
        assert result == ""

        # Empty string base name with no uploads_root
        result = get_image(None, "image_data", "")
        assert result == "image_data"

    def test_is_json_dumped(self) -> None:
        """Test if a string is JSON dumped."""
        valid_json = json.dumps({"key": "value"})
        invalid_json = "{invalid: json"

        assert is_json_dumped(valid_json)
        assert not is_json_dumped(invalid_json)
