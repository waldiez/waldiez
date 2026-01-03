# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use
"""Tests for waldiez.io.models.content.base.*."""

import pytest

from waldiez.io.models.content.base import (
    AudioContent,
    FileContent,
    ImageContent,
    VideoContent,
)


class TestImageContent:
    """Test suite for ImageContent class."""

    def test_image_content_empty(self) -> None:
        """Test creating empty ImageContent."""
        content = ImageContent()

        assert content.url is None
        assert content.file is None
        assert content.alt is None

    def test_image_content_with_url(self) -> None:
        """Test creating ImageContent with URL."""
        url = "https://example.com/image.jpg"
        content = ImageContent(url=url)

        assert content.url == url
        assert content.file is None
        assert content.alt is None

    def test_image_content_with_file(self) -> None:
        """Test creating ImageContent with file data."""
        file_data = "base64_encoded_image_data"
        content = ImageContent(file=file_data)

        assert content.url is None
        assert content.file == file_data
        assert content.alt is None

    def test_image_content_with_alt(self) -> None:
        """Test creating ImageContent with alt text."""
        alt_text = "A beautiful landscape"
        content = ImageContent(alt=alt_text)

        assert content.url is None
        assert content.file is None
        assert content.alt == alt_text

    def test_image_content_all_fields(self) -> None:
        """Test creating ImageContent with all fields."""
        url = "https://example.com/image.jpg"
        file_data = "base64_data"
        alt_text = "Test image"

        content = ImageContent(url=url, file=file_data, alt=alt_text)

        assert content.url == url
        assert content.file == file_data
        assert content.alt == alt_text

    def test_image_content_arbitrary_file_type(self) -> None:
        """Test ImageContent accepts arbitrary file types."""
        # Should accept any type for file field
        content = ImageContent(file=123)
        assert content.file == 123

        content = ImageContent(file={"data": "test"})
        assert content.file == {"data": "test"}


class TestVideoContent:
    """Test suite for VideoContent class."""

    def test_video_content_empty(self) -> None:
        """Test creating empty VideoContent."""
        content = VideoContent()

        assert content.url is None
        assert content.file is None
        assert content.duration is None
        assert content.thumbnailUrl is None
        assert content.mimeType is None

    def test_video_content_with_url(self) -> None:
        """Test creating VideoContent with URL."""
        url = "https://example.com/video.mp4"
        content = VideoContent(url=url)

        assert content.url == url
        assert content.file is None

    def test_video_content_with_file(self) -> None:
        """Test creating VideoContent with file data."""
        file_data = "video_file_data"
        content = VideoContent(file=file_data)

        assert content.url is None
        assert content.file == file_data

    def test_video_content_with_duration(self) -> None:
        """Test creating VideoContent with duration."""
        duration = 120  # 2 minutes
        content = VideoContent(duration=duration)

        assert content.duration == duration

    def test_video_content_with_thumbnail(self) -> None:
        """Test creating VideoContent with thumbnail URL."""
        thumbnail_url = "https://example.com/thumbnail.jpg"
        content = VideoContent(thumbnailUrl=thumbnail_url)

        assert content.thumbnailUrl == thumbnail_url

    def test_video_content_with_mime_type(self) -> None:
        """Test creating VideoContent with MIME type."""
        mime_type = "video/mp4"
        content = VideoContent(mimeType=mime_type)

        assert content.mimeType == mime_type

    def test_video_content_all_fields(self) -> None:
        """Test creating VideoContent with all fields."""
        content = VideoContent(
            url="https://example.com/video.mp4",
            file="video_data",
            duration=180,
            thumbnailUrl="https://example.com/thumb.jpg",
            mimeType="video/mp4",
        )

        assert content.url == "https://example.com/video.mp4"
        assert content.file == "video_data"
        assert content.duration == 180
        assert content.thumbnailUrl == "https://example.com/thumb.jpg"
        assert content.mimeType == "video/mp4"

    def test_video_content_duration_validation(self) -> None:
        """Test VideoContent duration field accepts integers."""
        # Positive duration
        content = VideoContent(duration=300)
        assert content.duration == 300

        # Zero duration
        content = VideoContent(duration=0)
        assert content.duration == 0

        # Negative duration (should be allowed by model)
        content = VideoContent(duration=-1)
        assert content.duration == -1


class TestAudioContent:
    """Test suite for AudioContent class."""

    def test_audio_content_empty(self) -> None:
        """Test creating empty AudioContent."""
        content = AudioContent()

        assert content.url is None
        assert content.file is None
        assert content.duration is None
        assert content.transcript is None

    def test_audio_content_with_url(self) -> None:
        """Test creating AudioContent with URL."""
        url = "https://example.com/audio.mp3"
        content = AudioContent(url=url)

        assert content.url == url
        assert content.file is None

    def test_audio_content_with_file(self) -> None:
        """Test creating AudioContent with file data."""
        file_data = "audio_file_data"
        content = AudioContent(file=file_data)

        assert content.url is None
        assert content.file == file_data

    def test_audio_content_with_duration(self) -> None:
        """Test creating AudioContent with duration."""
        duration = 240  # 4 minutes
        content = AudioContent(duration=duration)

        assert content.duration == duration

    def test_audio_content_with_transcript(self) -> None:
        """Test creating AudioContent with transcript."""
        transcript = "Hello, this is a test transcript."
        content = AudioContent(transcript=transcript)

        assert content.transcript == transcript

    def test_audio_content_all_fields(self) -> None:
        """Test creating AudioContent with all fields."""
        content = AudioContent(
            url="https://example.com/audio.mp3",
            file="audio_data",
            duration=150,
            transcript="Test transcript content",
        )

        assert content.url == "https://example.com/audio.mp3"
        assert content.file == "audio_data"
        assert content.duration == 150
        assert content.transcript == "Test transcript content"

    def test_audio_content_empty_transcript(self) -> None:
        """Test AudioContent with empty transcript."""
        content = AudioContent(transcript="")
        assert content.transcript == ""

    def test_audio_content_multiline_transcript(self) -> None:
        """Test AudioContent with multiline transcript."""
        transcript = "Line 1\nLine 2\nLine 3"
        content = AudioContent(transcript=transcript)
        assert content.transcript == transcript


class TestFileContent:
    """Test suite for FileContent class."""

    def test_file_content_required_name(self) -> None:
        """Test that FileContent requires a name field."""
        # Should work with required name
        content = FileContent(name="test.txt")
        assert content.name == "test.txt"

        # Should fail without name
        with pytest.raises(ValueError):
            FileContent()  # type: ignore

    def test_file_content_with_url(self) -> None:
        """Test creating FileContent with URL."""
        url = "https://example.com/document.pdf"
        name = "document.pdf"
        content = FileContent(url=url, name=name)

        assert content.url == url
        assert content.name == name
        assert content.file is None

    def test_file_content_with_file(self) -> None:
        """Test creating FileContent with file data."""
        file_data = "file_binary_data"
        name = "data.bin"
        content = FileContent(file=file_data, name=name)

        assert content.url is None
        assert content.file == file_data
        assert content.name == name

    def test_file_content_with_size(self) -> None:
        """Test creating FileContent with size."""
        size = 1024  # 1KB
        content = FileContent(name="test.txt", size=size)

        assert content.size == size

    def test_file_content_with_type(self) -> None:
        """Test creating FileContent with type."""
        file_type = "text/plain"
        content = FileContent(name="test.txt", type=file_type)

        assert content.type == file_type

    def test_file_content_with_preview_url(self) -> None:
        """Test creating FileContent with preview URL."""
        preview_url = "https://example.com/preview.jpg"
        content = FileContent(name="document.pdf", previewUrl=preview_url)

        assert content.previewUrl == preview_url

    def test_file_content_all_fields(self) -> None:
        """Test creating FileContent with all fields."""
        content = FileContent(
            url="https://example.com/file.pdf",
            file="binary_data",
            name="important_document.pdf",
            size=2048,
            type="application/pdf",
            previewUrl="https://example.com/preview.jpg",
        )

        assert content.url == "https://example.com/file.pdf"
        assert content.file == "binary_data"
        assert content.name == "important_document.pdf"
        assert content.size == 2048
        assert content.type == "application/pdf"
        assert content.previewUrl == "https://example.com/preview.jpg"

    def test_file_content_name_variations(self) -> None:
        """Test FileContent with various name formats."""
        test_names = [
            "simple.txt",
            "document with spaces.pdf",
            "file-with-dashes.doc",
            "file_with_underscores.xlsx",
            "UPPERCASE.TXT",
            "file.with.multiple.dots.tar.gz",
            "filenoextension",
            ".hiddenfile",
        ]

        for name in test_names:
            content = FileContent(name=name)
            assert content.name == name

    def test_file_content_size_edge_cases(self) -> None:
        """Test FileContent with edge case sizes."""
        # Zero size
        content = FileContent(name="empty.txt", size=0)
        assert content.size == 0

        # Large size
        large_size = 1024 * 1024 * 1024  # 1GB
        content = FileContent(name="large.bin", size=large_size)
        assert content.size == large_size
