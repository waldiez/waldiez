# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc
"""Tests for waldiez.io.models.content.video.*."""

from pathlib import Path
from typing import Any

import pytest

from waldiez.io.models.content.base import VideoContent
from waldiez.io.models.content.video import VideoMediaContent


class TestVideoMediaContent:
    """Test suite for VideoMediaContent class."""

    def test_video_media_content_creation(self) -> None:
        """Test creating a VideoMediaContent instance."""
        video_content = VideoContent(url="https://example.com/video.mp4")
        content = VideoMediaContent(video=video_content)

        assert content.type == "video"
        assert content.video == video_content

    def test_video_media_content_type_literal(self) -> None:
        """Test that type is fixed to 'video'."""
        video_content = VideoContent(file="video_data")
        content = VideoMediaContent(video=video_content)

        assert content.type == "video"

    def test_video_media_content_required_field(self) -> None:
        """Test that video field is required."""
        with pytest.raises(ValueError):
            VideoMediaContent()  # type: ignore

    def test_video_media_content_to_string_with_url(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with video URL."""
        video_content = VideoContent(url="https://example.com/video.mp4")
        content = VideoMediaContent(video=video_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<video src='https://example.com/video.mp4'></video>"

    def test_video_media_content_to_string_with_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string with video file data."""
        video_content = VideoContent(file="video_file_data")
        content = VideoMediaContent(video=video_content)

        result = content.to_string(uploads_root=tmp_path, base_name="test")

        assert result == "<video src='video_file_data'></video>"

    def test_video_media_content_to_string_no_url_no_file(
        self, tmp_path: Path
    ) -> None:
        """Test to_string when neither URL nor file is present."""
        video_content = VideoContent()  # No URL or file
        content = VideoMediaContent(video=video_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "None"  # str(None)

    def test_video_media_content_to_string_url_priority(
        self, tmp_path: Path
    ) -> None:
        """Test that URL takes priority over file when both present."""
        video_content = VideoContent(
            url="https://example.com/video.mp4", file="video_data"
        )
        content = VideoMediaContent(video=video_content)

        result = content.to_string(uploads_root=tmp_path)

        assert result == "<video src='https://example.com/video.mp4'></video>"

    def test_video_media_content_to_string_ignores_uploads_params(self) -> None:
        """Test that to_string ignores uploads_root and base_name for videos."""
        video_content = VideoContent(url="https://example.com/video.mp4")
        content = VideoMediaContent(video=video_content)

        result1 = content.to_string(None)
        result2 = content.to_string(
            uploads_root=Path("/custom"), base_name="custom"
        )

        assert result1 == result2
        assert result1 == "<video src='https://example.com/video.mp4'></video>"

    def test_video_media_content_with_additional_properties(self) -> None:
        """Test VideoMediaContent with additional video properties."""
        video_content = VideoContent(
            url="https://example.com/video.mp4",
            duration=120,
            thumbnailUrl="https://example.com/thumb.jpg",
            mimeType="video/mp4",
        )
        content = VideoMediaContent(video=video_content)

        # to_string should still only use URL/file for output
        result = content.to_string(None)
        assert result == "<video src='https://example.com/video.mp4'></video>"

        # But properties should be preserved
        assert content.video.duration == 120
        assert content.video.thumbnailUrl == "https://example.com/thumb.jpg"
        assert content.video.mimeType == "video/mp4"

    def test_video_media_content_model_dump(self) -> None:
        """Test model serialization."""
        video_content = VideoContent(url="https://example.com/video.mp4")
        content = VideoMediaContent(video=video_content)

        dumped = content.model_dump()
        assert isinstance(dumped, dict)
        assert dumped["type"] == "video"
        assert "video" in dumped
        assert dumped["video"]["url"] == "https://example.com/video.mp4"

    def test_video_media_content_from_dict(self) -> None:
        """Test creating VideoMediaContent from dictionary."""
        data: dict[str, Any] = {
            "type": "video",
            "video": {"url": "https://example.com/test.mp4", "duration": 180},
        }
        content = VideoMediaContent(**data)

        assert content.type == "video"
        assert content.video.url == "https://example.com/test.mp4"
        assert content.video.duration == 180
