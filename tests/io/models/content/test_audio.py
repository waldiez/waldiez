# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc
"""Tests for waldiez.io.models.content.audio.*."""

from pathlib import Path
from typing import Any

import pytest

from waldiez.io.models.content.audio import AudioMediaContent
from waldiez.io.models.content.base import AudioContent


class TestAudioMediaContent:
    """Test suite for AudioMediaContent class."""

    def test_audio_media_content_creation(self) -> None:
        """Test creating an AudioMediaContent instance."""
        audio_content = AudioContent(url="https://example.com/audio.mp3")
        content = AudioMediaContent(audio=audio_content)

        assert content.type == "audio"
        assert content.audio == audio_content

    def test_audio_media_content_type_literal(self) -> None:
        """Test that type is fixed to 'audio'."""
        audio_content = AudioContent(file="audio_data")
        content = AudioMediaContent(audio=audio_content)

        assert content.type == "audio"

    def test_audio_media_content_required_field(self) -> None:
        """Test that audio field is required."""
        with pytest.raises(ValueError):
            AudioMediaContent()  # type: ignore

    def test_audio_media_content_to_string_with_url(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with audio URL."""
        audio_content = AudioContent(url="https://example.com/audio.mp3")
        content = AudioMediaContent(audio=audio_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<audio src='https://example.com/audio.mp3'></audio>"

    def test_audio_media_content_to_string_with_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with audio file data."""
        audio_content = AudioContent(file="audio_file_data")
        content = AudioMediaContent(audio=audio_content)

        result = content.to_string(uploads_root=tmp_path, base_name="test")

        assert result == "<audio src='audio_file_data'></audio>"

    def test_audio_media_content_to_string_no_url_no_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string when neither URL nor file is present."""
        audio_content = AudioContent()  # No URL or file
        content = AudioMediaContent(audio=audio_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "None"  # str(None)

    def test_audio_media_content_to_string_url_priority(
        self, tmp_path: Path
    ) -> None:
        """Test that URL takes priority over file when both present."""
        audio_content = AudioContent(
            url="https://example.com/audio.mp3", file="audio_data"
        )
        content = AudioMediaContent(audio=audio_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<audio src='https://example.com/audio.mp3'></audio>"

    def test_audio_media_content_to_string_ignores_uploads_params(self) -> None:
        """Test that to_string ignores uploads_root and base_name for audio."""
        audio_content = AudioContent(url="https://example.com/audio.mp3")
        content = AudioMediaContent(audio=audio_content)

        result1 = content.to_string(None)
        result2 = content.to_string(
            uploads_root=Path("/custom"), base_name="custom"
        )

        assert result1 == result2
        assert result1 == "<audio src='https://example.com/audio.mp3'></audio>"

    def test_audio_media_content_with_additional_properties(self) -> None:
        """Test AudioMediaContent with additional audio properties."""
        audio_content = AudioContent(
            url="https://example.com/audio.mp3",
            duration=240,
            transcript="This is the audio transcript",
        )
        content = AudioMediaContent(audio=audio_content)

        # to_string should still only use URL/file for output
        result = content.to_string(None)
        assert result == "<audio src='https://example.com/audio.mp3'></audio>"

        # But properties should be preserved
        assert content.audio.duration == 240
        assert content.audio.transcript == "This is the audio transcript"

    def test_audio_media_content_model_dump(self) -> None:
        """Test model serialization."""
        audio_content = AudioContent(url="https://example.com/audio.mp3")
        content = AudioMediaContent(audio=audio_content)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "audio"
        assert "audio" in dumped
        assert dumped["audio"]["url"] == "https://example.com/audio.mp3"

    def test_audio_media_content_from_dict(self) -> None:
        """Test creating AudioMediaContent from dictionary."""
        data: dict[str, Any] = {
            "type": "audio",
            "audio": {
                "url": "https://example.com/test.mp3",
                "duration": 300,
                "transcript": "Test transcript",
            },
        }
        content = AudioMediaContent(**data)

        assert content.type == "audio"
        assert content.audio.url == "https://example.com/test.mp3"
        assert content.audio.duration == 300
        assert content.audio.transcript == "Test transcript"

    def test_audio_media_content_equality(self) -> None:
        """Test equality comparison between AudioMediaContent instances."""
        audio_content1 = AudioContent(url="https://example.com/same.mp3")
        audio_content2 = AudioContent(url="https://example.com/same.mp3")
        audio_content3 = AudioContent(url="https://example.com/different.mp3")

        content1 = AudioMediaContent(audio=audio_content1)
        content2 = AudioMediaContent(audio=audio_content2)
        content3 = AudioMediaContent(audio=audio_content3)

        assert content1 == content2
        assert content1 != content3

    def test_audio_media_content_with_empty_transcript(self) -> None:
        """Test AudioMediaContent with empty transcript."""
        audio_content = AudioContent(
            url="https://example.com/audio.mp3", transcript=""
        )
        content = AudioMediaContent(audio=audio_content)

        assert content.audio.transcript == ""

    def test_audio_media_content_with_multiline_transcript(self) -> None:
        """Test AudioMediaContent with multiline transcript."""
        transcript = "Line 1 of transcript\nLine 2 of transcript\nLine 3"
        audio_content = AudioContent(
            url="https://example.com/audio.mp3", transcript=transcript
        )
        content = AudioMediaContent(audio=audio_content)

        assert content.audio.transcript == transcript
        assert "\n" in content.audio.transcript
