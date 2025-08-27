# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=no-self-use,too-few-public-methods
"""Tests for waldiez.io.models.constants.*."""

from waldiez.io.models.constants import (
    CONTENT_MAPPING,
)
from waldiez.io.models.content.audio import AudioMediaContent
from waldiez.io.models.content.file import FileMediaContent
from waldiez.io.models.content.image import (
    ImageMediaContent,
    ImageUrlMediaContent,
)
from waldiez.io.models.content.text import TextMediaContent
from waldiez.io.models.content.video import VideoMediaContent


class TestMediaContent:
    """Test suite for MediaContent union type."""

    def test_media_content_union_includes_all_types(self) -> None:
        """Test that MediaContent union includes all expected types."""
        # Test that all content types are part of the union
        text_content = TextMediaContent(text="test")
        image_content = ImageMediaContent(
            image={"url": "test.jpg"},  # type: ignore
        )

        # These should be valid MediaContent instances
        assert isinstance(
            text_content,
            (
                TextMediaContent,
                ImageMediaContent,
                ImageUrlMediaContent,
                VideoMediaContent,
                AudioMediaContent,
                FileMediaContent,
            ),
        )
        assert isinstance(
            image_content,
            (
                TextMediaContent,
                ImageMediaContent,
                ImageUrlMediaContent,
                VideoMediaContent,
                AudioMediaContent,
                FileMediaContent,
            ),
        )


class TestContentTypeKey:
    """Test suite for ContentTypeKey literal type."""

    def test_content_type_key_values(self) -> None:
        """Test that ContentTypeKey includes all expected literal values."""
        expected_keys = {
            "text",
            "image",
            "image_url",
            "video",
            "audio",
            "file",
        }

        # Verify all expected keys are in CONTENT_MAPPING
        assert set(CONTENT_MAPPING.keys()) == expected_keys


class TestContentMappingEntry:
    """Test suite for ContentMappingEntry TypedDict."""

    def test_content_mapping_entry_structure(self) -> None:
        """Test ContentMappingEntry has correct structure."""
        # Get a sample entry
        text_entry = CONTENT_MAPPING["text"]

        # Should have all required keys
        assert "fields" in text_entry
        assert "cls" in text_entry
        assert "required_field" in text_entry

        # Check types
        assert isinstance(text_entry["fields"], list)
        assert isinstance(text_entry["required_field"], str)
        assert hasattr(text_entry["cls"], "__name__")  # Should be a class


class TestContentMapping:
    """Test suite for CONTENT_MAPPING dictionary."""

    def test_content_mapping_completeness(self) -> None:
        """Test that CONTENT_MAPPING contains all expected entries."""
        expected_keys = {
            "text",
            "image",
            "image_url",
            "video",
            "audio",
            "file",
        }

        assert set(CONTENT_MAPPING.keys()) == expected_keys

    def test_content_mapping_text_entry(self) -> None:
        """Test text content mapping entry."""
        entry = CONTENT_MAPPING["text"]

        assert entry["fields"] == ["text"]
        assert entry["cls"] == TextMediaContent
        assert entry["required_field"] == "text"

    def test_content_mapping_image_entry(self) -> None:
        """Test image content mapping entry."""
        entry = CONTENT_MAPPING["image"]

        assert entry["fields"] == ["image"]
        assert entry["cls"] == ImageMediaContent
        assert entry["required_field"] == "image"

    def test_content_mapping_image_url_entry(self) -> None:
        """Test image_url content mapping entry."""
        entry = CONTENT_MAPPING["image_url"]

        assert entry["fields"] == ["image_url", "url"]
        assert entry["cls"] == ImageUrlMediaContent
        assert entry["required_field"] == "image_url"

    def test_content_mapping_video_entry(self) -> None:
        """Test video content mapping entry."""
        entry = CONTENT_MAPPING["video"]

        assert entry["fields"] == ["video"]
        assert entry["cls"] == VideoMediaContent
        assert entry["required_field"] == "video"

    def test_content_mapping_audio_entry(self) -> None:
        """Test audio content mapping entry."""
        entry = CONTENT_MAPPING["audio"]

        assert entry["fields"] == ["audio"]
        assert entry["cls"] == AudioMediaContent
        assert entry["required_field"] == "audio"

    def test_content_mapping_file_entry(self) -> None:
        """Test file content mapping entry."""
        entry = CONTENT_MAPPING["file"]

        assert entry["fields"] == ["file"]
        assert entry["cls"] == FileMediaContent
        assert entry["required_field"] == "file"

    def test_content_mapping_classes_are_importable(self) -> None:
        """Test that all classes in mapping are properly importable."""
        for _, entry in CONTENT_MAPPING.items():
            cls = entry["cls"]

            # Should be able to access class name
            assert hasattr(cls, "__name__")

            # Should be a proper class
            assert isinstance(cls, type)

            # Class name should be reasonable
            assert cls.__name__.endswith("MediaContent")

    def test_content_mapping_required_fields_valid(self) -> None:
        """Test that required_field values make sense for each class."""
        # Text should require "text"
        assert CONTENT_MAPPING["text"]["required_field"] == "text"

        # Image should require "image"
        assert CONTENT_MAPPING["image"]["required_field"] == "image"

        # Image URL should require "image_url"
        assert CONTENT_MAPPING["image_url"]["required_field"] == "image_url"

        # Video should require "video"
        assert CONTENT_MAPPING["video"]["required_field"] == "video"

        # Audio should require "audio"
        assert CONTENT_MAPPING["audio"]["required_field"] == "audio"

        # File types should require "file"
        assert CONTENT_MAPPING["file"]["required_field"] == "file"

    def test_content_mapping_fields_lists_not_empty(self) -> None:
        """Test that all fields lists are non-empty."""
        for _, entry in CONTENT_MAPPING.items():
            fields = entry["fields"]
            assert isinstance(fields, list)
            assert len(fields) > 0

            # All field names should be strings
            for field in fields:
                assert isinstance(field, str)
                assert len(field) > 0

    def test_content_mapping_fields_contain_required_field(self) -> None:
        """Test that fields list contains the required field.

        (except for special cases)
        """
        for content_type, entry in CONTENT_MAPPING.items():
            fields = entry["fields"]
            required_field = entry["required_field"]

            # For most cases, required_field should be in fields
            # Exception: image_url has "url" in fields but requires "image_url"
            if content_type == "image_url":
                # Special case: can accept "url" but needs to map to "image_url"
                assert "image_url" in fields or "url" in fields
            else:
                # Normal case: required field should be in fields list
                assert required_field in fields

    def test_content_mapping_immutability(self) -> None:
        """Test that CONTENT_MAPPING structure is as expected."""
        # Should be a dictionary
        assert isinstance(CONTENT_MAPPING, dict)

        # Should have exactly 6 entries
        assert len(CONTENT_MAPPING) == 6

        # Each entry should be a dictionary with required keys
        for _, entry in CONTENT_MAPPING.items():
            assert isinstance(entry, dict)
            required_keys = {"fields", "cls", "required_field"}
            assert set(entry.keys()) == required_keys

    def test_content_mapping_can_instantiate_classes(self) -> None:
        """Test that classes in mapping can be instantiated."""
        # Text content
        text_cls = CONTENT_MAPPING["text"]["cls"]
        text_instance = text_cls(text="test")  # type: ignore
        assert text_instance.text == "test"  # type: ignore

        # Image content
        image_cls = CONTENT_MAPPING["image"]["cls"]
        image_instance = image_cls(image={"url": "test.jpg"})  # type: ignore
        assert image_instance.image.url == "test.jpg"  # type: ignore

        # File content
        file_cls = CONTENT_MAPPING["file"]["cls"]
        # noinspection PyArgumentList
        file_instance = file_cls(
            type="file",  # type: ignore
            file={"name": "test.txt"},  # type: ignore
        )
        assert file_instance.file.name == "test.txt"  # type: ignore
