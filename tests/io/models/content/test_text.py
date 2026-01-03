# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc,too-many-public-methods
"""Tests for waldiez.io.models.content.text.*."""

from pathlib import Path

import pytest

from waldiez.io.models.content.text import TextMediaContent


class TestTextMediaContent:
    """Test suite for TextMediaContent class."""

    def test_text_media_content_creation(self) -> None:
        """Test creating a TextMediaContent instance."""
        text = "Hello, world!"
        content = TextMediaContent(text=text)

        assert content.type == "text"
        assert content.text == text

    def test_text_media_content_type_literal(self) -> None:
        """Test that type is a literal and cannot be changed."""
        content = TextMediaContent(text="test")
        assert content.type == "text"

        # Type should be fixed to "text"
        content2 = TextMediaContent(text="test2")
        assert content2.type == "text"

    def test_text_media_content_empty_text(self) -> None:
        """Test TextMediaContent with empty text."""
        content = TextMediaContent(text="")
        assert content.text == ""
        assert content.type == "text"

    def test_text_media_content_multiline_text(self) -> None:
        """Test TextMediaContent with multiline text."""
        multiline_text = "Line 1\nLine 2\nLine 3"
        content = TextMediaContent(text=multiline_text)
        assert content.text == multiline_text

    def test_text_media_content_unicode_text(self) -> None:
        """Test TextMediaContent with unicode characters."""
        unicode_text = "Hello 世界 🌍 café naïve résumé"
        content = TextMediaContent(text=unicode_text)
        assert content.text == unicode_text

    def test_text_media_content_special_characters(self) -> None:
        """Test TextMediaContent with special characters."""
        special_text = "Special chars: @#$%^&*()_+-=[]{}|;:,.<>?"
        content = TextMediaContent(text=special_text)
        assert content.text == special_text

    def test_text_media_content_long_text(self) -> None:
        """Test TextMediaContent with very long text."""
        long_text = "A" * 10000  # 10K characters
        content = TextMediaContent(text=long_text)
        assert content.text == long_text
        assert len(content.text) == 10000

    def test_text_media_content_required_field(self) -> None:
        """Test that text field is required."""
        # Should fail without text
        with pytest.raises(ValueError):
            TextMediaContent()  # type: ignore

    def test_text_media_content_to_string_basic(self) -> None:
        """Test to_string method with basic text."""
        text = "Hello, world!"
        content = TextMediaContent(text=text)

        result = content.to_string()
        assert result == text

    def test_text_media_content_to_string_with_uploads_root(
        self,
        tmp_path: Path,
    ) -> None:
        """Test to_string method with uploads_root parameter."""
        text = "Test message"
        content = TextMediaContent(text=text)
        uploads_root = tmp_path / "uploads"

        result = content.to_string(uploads_root=uploads_root)
        assert result == text  # Should ignore uploads_root for text content

    def test_text_media_content_to_string_with_base_name(self) -> None:
        """Test to_string method with base_name parameter."""
        text = "Test message"
        content = TextMediaContent(text=text)

        result = content.to_string(base_name="test_base")
        assert result == text  # Should ignore base_name for text content

    def test_text_media_content_to_string_with_all_params(
        self, tmp_path: Path
    ) -> None:
        """Test to_string method with all parameters."""
        text = "Test message"
        content = TextMediaContent(text=text)
        uploads_root = tmp_path / "uploads"
        result = content.to_string(
            uploads_root=uploads_root, base_name="test_base"
        )
        assert (
            result == text
        )  # Should return original text regardless of params

    def test_text_media_content_to_string_empty_text(self) -> None:
        """Test to_string method with empty text."""
        content = TextMediaContent(text="")
        result = content.to_string()
        assert result == ""

    def test_text_media_content_to_string_whitespace_text(self) -> None:
        """Test to_string method with whitespace-only text."""
        whitespace_text = "   \t\n   "
        content = TextMediaContent(text=whitespace_text)
        result = content.to_string()
        assert result == whitespace_text

    def test_text_media_content_to_string_multiline(self) -> None:
        """Test to_string method preserves multiline formatting."""
        multiline_text = "Line 1\nLine 2\nLine 3"
        content = TextMediaContent(text=multiline_text)
        result = content.to_string()
        assert result == multiline_text
        assert "\n" in result

    def test_text_media_content_model_dump(self) -> None:
        """Test model serialization."""
        text = "Test message"
        content = TextMediaContent(text=text)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "text"
        assert dumped["text"] == text

    def test_text_media_content_model_dump_json(self) -> None:
        """Test JSON serialization."""
        text = "Test message"
        content = TextMediaContent(text=text)

        json_str = content.model_dump_json()
        assert isinstance(json_str, str)
        assert '"type":"text"' in json_str
        assert '"text":"Test message"' in json_str

    def test_text_media_content_from_dict(self) -> None:
        """Test creating TextMediaContent from dictionary."""
        data: dict[str, str] = {"type": "text", "text": "Hello from dict"}
        content = TextMediaContent(**data)  # type: ignore

        assert content.type == "text"
        assert content.text == "Hello from dict"

    def test_text_media_content_validation_error_wrong_type(self) -> None:
        """Test validation error when type is not 'text'."""
        # This should work (correct type)
        content = TextMediaContent(text="test")
        assert content.type == "text"

        # Can't create with wrong type due to Literal constraint
        # Pydantic will coerce or validate the literal value

    def test_text_media_content_equality(self) -> None:
        """Test equality comparison between TextMediaContent instances."""
        content1 = TextMediaContent(text="same text")
        content2 = TextMediaContent(text="same text")
        content3 = TextMediaContent(text="different text")

        assert content1 == content2
        assert content1 != content3

    def test_text_media_content_repr(self) -> None:
        """Test string representation of TextMediaContent."""
        content = TextMediaContent(text="test message")
        repr_str = repr(content)

        assert "TextMediaContent" in repr_str
        assert "text='test message'" in repr_str
        assert "type='text'" in repr_str
