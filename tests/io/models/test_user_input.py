# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportPrivateUsage=false
# pyright: reportAttributeAccessIssue=false,reportUnknownMemberType=false
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=no-self-use,protected-access,too-many-public-methods
"""Tests for waldiez.io.models.user_input.*."""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from waldiez.io.models.content import (
    AudioMediaContent,
    FileMediaContent,
    ImageMediaContent,
    ImageUrlMediaContent,
    TextMediaContent,
    VideoMediaContent,
)
from waldiez.io.models.user_input import UserInputData


class TestUserInputData:
    """Test suite for UserInputData class."""

    def test_user_input_data_creation_with_text_content(self) -> None:
        """Test creating UserInputData with text content."""
        text_content = TextMediaContent(text="Hello, world!")
        user_input = UserInputData(content=text_content)

        assert user_input.content == text_content
        assert user_input.content.text == "Hello, world!"  # type: ignore
        assert str(user_input) == "Hello, world!"
        assert repr(user_input) == "UserInputData(content=Hello, world!)"

    def test_user_input_data_creation_with_list_content(self) -> None:
        """Test creating UserInputData with a list of content."""
        text_content1 = TextMediaContent(text="First message")
        text_content2 = TextMediaContent(text="Second message")
        user_input = UserInputData(content=[text_content1, text_content2])

        assert isinstance(user_input.content, list)
        assert len(user_input.content) == 2
        assert user_input.to_string() == "First message Second message"

    def test_user_input_data_creation_with_string_content(self) -> None:
        """Test creating UserInputData with a string content."""
        user_input = UserInputData(
            content="Just a plain string",  # type: ignore
        )

        assert isinstance(user_input.content, TextMediaContent)
        assert user_input.content.text == "Just a plain string"

    def test_user_input_data_to_string_basic(self) -> None:
        """Test to_string method basic functionality."""
        text_content = TextMediaContent(text="Test message")
        user_input = UserInputData(content=text_content)

        result = user_input.to_string()
        assert result == "Test message"

    def test_user_input_data_to_string_with_params(
        self, tmp_path: Path
    ) -> None:
        """Test to_string method with uploads_root and base_name."""
        text_content = TextMediaContent(text="Test message")
        user_input = UserInputData(content=text_content)

        result = user_input.to_string(
            uploads_root=tmp_path, base_name="test_base"
        )
        assert result == "Test message"

    def test_user_input_data_content_from_string_plain_text(self) -> None:
        """Test _content_from_string with plain text."""
        result = UserInputData.content_from_string(
            "Plain text input",
        )

        assert isinstance(result, TextMediaContent)
        assert result.text == "Plain text input"
        assert result.type == "text"

    def test_user_input_data_content_from_string_invalid_json(self) -> None:
        """Test _content_from_string with invalid JSON."""
        invalid_json = "{invalid: json"
        result = UserInputData.content_from_string(invalid_json)

        assert isinstance(result, TextMediaContent)
        assert result.text == invalid_json
        assert result.type == "text"

    def test_user_input_data_content_from_string_valid_json_string(
        self,
    ) -> None:
        """Test _content_from_string with JSON that parses to string."""
        json_string = json.dumps("Hello from JSON")
        result = UserInputData.content_from_string(json_string)

        assert isinstance(result, TextMediaContent)
        assert (
            result.text == "Hello from JSON"
        )  # Should treat as original string
        assert result.type == "text"

    def test_user_input_data_content_from_string_valid_json_dict(self) -> None:
        """Test _content_from_string with JSON dictionary."""
        json_dict = json.dumps({"text": "Hello from dict"})
        result = UserInputData.content_from_string(json_dict)

        assert isinstance(result, TextMediaContent)
        assert result.text == "Hello from dict"
        assert result.type == "text"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_text_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with text type."""
        mock_detect_media_type.return_value = "text"

        input_dict = {"text": "Hello from dict"}
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, TextMediaContent)
        assert result.text == "Hello from dict"
        assert result.type == "text"
        mock_detect_media_type.assert_called_once_with(input_dict)

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_unsupported_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with unsupported content type."""
        mock_detect_media_type.return_value = "unsupported_type"

        input_dict = {"unsupported": "data"}

        with pytest.raises(ValueError) as exc_info:
            UserInputData.content_from_dict(input_dict)

        assert "Unsupported content type: unsupported_type" in str(
            exc_info.value
        )

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_missing_field(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with missing required field."""
        mock_detect_media_type.return_value = "text"

        input_dict = {"not_text": "Hello"}  # Missing "text" field

        with pytest.raises(ValueError) as exc_info:
            UserInputData.content_from_dict(input_dict)

        assert "Missing required field for content type 'text'" in str(
            exc_info.value
        )

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_image_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with image type."""
        mock_detect_media_type.return_value = "image"

        input_dict = {"image": {"url": "https://example.com/image.jpg"}}
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, ImageMediaContent)
        assert result.type == "image"
        assert result.image.url == "https://example.com/image.jpg"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_file_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with file requiring additional params."""
        mock_detect_media_type.return_value = "file"

        input_dict = {
            "file": {"name": "test.txt", "url": "https://example.com/test.txt"}
        }
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, FileMediaContent)
        assert result.type == "file"
        assert result.file.name == "test.txt"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_video_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with video type."""
        mock_detect_media_type.return_value = "video"

        input_dict = {"type": "video", "video": "https://example.com/video.mp4"}
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, VideoMediaContent)
        assert result.type == "video"
        assert result.video.url == "https://example.com/video.mp4"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_audio_type(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with audio type."""
        mock_detect_media_type.return_value = "audio"

        input_dict = {"type": "audio", "audio": "https://example.com/audio.mp3"}
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, AudioMediaContent)
        assert result.type == "audio"
        assert result.audio.url == "https://example.com/audio.mp3"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_file_content(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with file content."""
        mock_detect_media_type.return_value = "file"

        input_dict = {
            "type": "file",
            "file": "https://example.com/example.txt",
        }
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, FileMediaContent)
        assert result.type == "file"
        assert result.file.name == "example.txt"
        assert result.file.url == "https://example.com/example.txt"

    @patch("waldiez.io.models.user_input.detect_media_type")
    def test_user_input_data_content_from_dict_field_name_conversion(
        self, mock_detect_media_type: MagicMock
    ) -> None:
        """Test _content_from_dict with field name conversion.

        (url -> image_url)
        """
        mock_detect_media_type.return_value = "image_url"
        input_dict = {"url": "https://example.com/image.jpg"}
        result = UserInputData.content_from_dict(input_dict)

        assert isinstance(result, ImageUrlMediaContent)
        assert result.type == "image_url"
        assert result.image_url.url == "https://example.com/image.jpg"

    def test_user_input_data_validate_content_already_valid_content(
        self,
    ) -> None:
        """Test validate_content with already valid MediaContent."""
        text_content = TextMediaContent(text="Already valid")
        result = UserInputData.validate_content(text_content)

        assert result == text_content
        assert isinstance(result, TextMediaContent)

    def test_user_input_data_validate_content_string_input(self) -> None:
        """Test validate_content with string input."""
        result = UserInputData.validate_content("String input")

        assert isinstance(result, TextMediaContent)
        assert result.text == "String input"

    def test_user_input_data_validate_content_dict_input(self) -> None:
        """Test validate_content with dictionary input."""
        input_dict = {"text": "Dict input"}
        result = UserInputData.validate_content(input_dict)

        assert isinstance(result, TextMediaContent)
        assert result.text == "Dict input"

    def test_user_input_data_validate_content_other_types(self) -> None:
        """Test validate_content with other types (fallback to text)."""
        # Number
        result1 = UserInputData.validate_content(42)
        assert isinstance(result1, TextMediaContent)
        assert result1.text == "42"

        # Boolean
        result2 = UserInputData.validate_content(True)
        assert isinstance(result2, TextMediaContent)
        assert result2.text == "True"

        # None
        result3 = UserInputData.validate_content(None)
        assert isinstance(result3, TextMediaContent)
        assert result3.text == "None"

    def test_user_input_data_field_validator_integration(self) -> None:
        """Test that field validator works with dict input."""
        # Dict input
        user_input2 = UserInputData(
            content={"text": "Test dict"},  # type: ignore
        )
        assert user_input2.content.text == "Test dict"  # type: ignore

        # Already valid content
        text_content = TextMediaContent(text="Valid content")
        user_input3 = UserInputData(content=text_content)
        assert user_input3.content == text_content

    def test_user_input_data_model_dump(self) -> None:
        """Test model serialization."""
        text_content = TextMediaContent(text="Test message")
        user_input = UserInputData(content=text_content)

        dumped = user_input.model_dump()
        assert isinstance(dumped, dict)
        assert "content" in dumped
        assert dumped["content"]["type"] == "text"
        assert dumped["content"]["text"] == "Test message"

    def test_user_input_data_model_dump_json(self) -> None:
        """Test JSON serialization."""
        text_content = TextMediaContent(text="Test message")
        user_input = UserInputData(content=text_content)

        json_str = user_input.model_dump_json()
        assert isinstance(json_str, str)

        # Parse back to verify
        parsed = json.loads(json_str)
        assert parsed["content"]["type"] == "text"
        assert parsed["content"]["text"] == "Test message"

    def test_user_input_data_round_trip_serialization(self) -> None:
        """Test round-trip serialization."""
        text_content = TextMediaContent(text="Round trip test")
        original = UserInputData(content=text_content)

        # Serialize and deserialize
        json_data = original.model_dump_json()
        recreated = UserInputData.model_validate_json(json_data)

        assert recreated.content.text == original.content.text  # type: ignore
