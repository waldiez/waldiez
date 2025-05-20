# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument
"""Common utilities for the I/O extensions."""

import json
from pathlib import Path
from typing import (
    Annotated,
    Any,
    Callable,
    Literal,
    Optional,
    Type,
    TypedDict,
    Union,
)

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .utils import gen_id, get_image, now

MessageType = Literal[
    "input_request",
    "input_response",
    "print",
    "input",
]
"""Possible message types for the structured I/O stream."""

MediaType = Union[
    Literal["text"],
    Literal["image"],
    Literal["image_url"],
    Literal["video"],
    Literal["audio"],
    Literal["file", "document"],
]
"""Possible media types for the structured I/O stream."""


class StructuredBase(BaseModel):
    """Base model for structured data."""

    id: str = Field(default_factory=gen_id)
    type: MessageType
    timestamp: str = Field(default_factory=now)
    model_config = ConfigDict(
        extra="ignore",
        arbitrary_types_allowed=True,
    )


class UserInputRequest(StructuredBase):
    """User input prompt model."""

    type: MessageType = "input_request"
    request_id: str
    prompt: str
    password: bool = False


class PrintMessage(StructuredBase):
    """Model for print messages."""

    type: MessageType = "print"
    data: str


class ImageContent(BaseModel):
    """Image content model."""

    url: Optional[str] = None
    file: Optional[Any] = None  # File type not directly mappable in Python
    alt: Optional[str] = None


class VideoContent(BaseModel):
    """Video content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    duration: Optional[int] = None
    thumbnailUrl: Optional[str] = None
    mimeType: Optional[str] = None


class AudioContent(BaseModel):
    """Audio content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    duration: Optional[int] = None
    transcript: Optional[str] = None


class FileContent(BaseModel):
    """File content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    name: str
    size: Optional[int] = None
    type: Optional[str] = None
    previewUrl: Optional[str] = None


class TextMediaContent(BaseModel):
    """Text media content."""

    type: Literal["text"] = "text"
    text: str

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        return self.text


class ImageMediaContent(BaseModel):
    """Image media content."""

    type: Literal["image"] = "image"
    image: ImageContent

    def to_string(
        self,
        uploads_root: Path | None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        if self.image.url:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image.url,
                base_name=base_name,
            )
            return f"<img {image}>"
        if self.image.file:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image.file,
                base_name=base_name,
            )
            return f"<img {image}>"
        return str(self.image.file)


class ImageUrlMediaContent(BaseModel):
    """Image URL media content."""

    type: Literal["image_url"] = "image_url"
    image_url: ImageContent

    def to_string(
        self,
        uploads_root: Path | None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        if self.image_url.url:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image_url.url,
                base_name=base_name,
            )
            return f"<img {image}>"
        if self.image_url.file:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image_url.file,
                base_name=base_name,
            )
            return f"<img {image}>"
        return str(self.image_url.file)


class VideoMediaContent(BaseModel):
    """Video media content."""

    type: Literal["video"] = "video"
    video: VideoContent

    def to_string(
        self,
        uploads_root: Path | None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        if self.video.url:
            return f"<video src='{self.video.url}'></video>"
        if self.video.file:
            return f"<video src='{self.video.file}'></video>"
        return str(self.video.file)


class AudioMediaContent(BaseModel):
    """Audio media content."""

    type: Literal["audio"] = "audio"
    audio: AudioContent

    def to_string(
        self,
        uploads_root: Path | None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        if self.audio.url:
            return f"<audio src='{self.audio.url}'></audio>"
        if self.audio.file:
            return f"<audio src='{self.audio.file}'></audio>"
        return str(self.audio.file)


class FileMediaContent(BaseModel):
    """File media content."""

    type: Literal["file", "document"]
    file: FileContent

    def to_string(
        self,
        uploads_root: Path | None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        if self.file.url:
            return f"<a href='{self.file.url}'>{self.file.name}</a>"
        if self.file.file:
            return f"<a href='{self.file.file}'>{self.file.name}</a>"
        return str(self.file.file)


MediaContent = Union[
    TextMediaContent,
    ImageMediaContent,
    ImageUrlMediaContent,
    VideoMediaContent,
    AudioMediaContent,
    FileMediaContent,
]


class ContentMappingEntry(TypedDict):
    """TypedDict for content mapping entries.

    Attributes
    ----------
    fields: List[str]
        List of possible field names for the content type
    class: Type[MediaContent]  # This is more specific than just Type
        The class to instantiate for this content type
    required_field: str
        The field name required by the class constructor
    """

    fields: list[str]
    cls: Type[MediaContent]
    required_field: str


ContentTypeKey = Literal[
    "text", "image", "image_url", "video", "audio", "file", "document"
]
"""Possible content types for the mapping."""

CONTENT_MAPPING: dict[ContentTypeKey, ContentMappingEntry] = {
    "text": {
        "fields": ["text"],
        "cls": TextMediaContent,
        "required_field": "text",
    },
    "image": {
        "fields": ["image"],
        "cls": ImageMediaContent,
        "required_field": "image",
    },
    "image_url": {
        "fields": ["image_url", "url"],
        "cls": ImageUrlMediaContent,
        "required_field": "image_url",
    },
    "video": {
        "fields": ["video"],
        "cls": VideoMediaContent,
        "required_field": "video",
    },
    "audio": {
        "fields": ["audio"],
        "cls": AudioMediaContent,
        "required_field": "audio",
    },
    "document": {
        "fields": ["document", "file"],
        "cls": FileMediaContent,
        "required_field": "file",
    },
    "file": {
        "fields": ["document", "file"],
        "cls": FileMediaContent,
        "required_field": "file",
    },
}


class UserInputData(BaseModel):
    """User's input data model."""

    content: Annotated[
        MediaContent,
        Field(discriminator="type"),
    ]

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        return self.content.to_string(uploads_root, base_name)

    @classmethod
    def _content_from_string(cls, value: str) -> MediaContent:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return TextMediaContent(type="text", text=value)
        if isinstance(parsed, str):
            return TextMediaContent(type="text", text=value)
        return cls.validate_content(parsed)

    @classmethod
    def _content_from_dict(cls, value: dict[str, Any]) -> MediaContent:
        """Convert a dictionary to the appropriate MediaContent type.

        Parameters
        ----------
        value : dict[str, Any]
            The input dictionary

        Returns
        -------
        MediaContent
            the appropriate MediaContent.
        """
        content_type = detect_media_type(value)

        # mapping of content types to their respective field names and classes

        # Get the mapping for the detected content type
        if content_type not in CONTENT_MAPPING:
            raise ValueError(f"Unsupported content type: {content_type}")

        mapping = CONTENT_MAPPING[content_type]

        # Check for any of the possible field names for this content type
        for field in mapping["fields"]:
            if field in value:
                # If we need additional parameters (e.g. FileMediaContent)
                if content_type in ["document", "file"]:
                    return mapping["cls"](
                        type=content_type,  # type: ignore
                        **{mapping["required_field"]: value[field]},
                    )
                # If we have a direct mapping
                if field == mapping["required_field"]:
                    return mapping["cls"](**{field: value[field]})
                # If we need field name conversion (e.g., url -> image_url)
                return mapping["cls"](
                    **{mapping["required_field"]: value[field]}
                )

        raise ValueError(
            "Missing required field for content type"
            f" '{content_type}' in: {value}"
        )

    @classmethod
    @field_validator("content", mode="before")
    def validate_content(cls, v: Any) -> MediaContent:  # noqa: C901,D102
        """Validate the input data content.

        Parameters
        ----------
        v: Any
            The input data conent

        Returns
        -------
        MediaContent
            The validated content

        Raises
        ------
        ValueError
            If the content is not valid.
        """
        if isinstance(
            v,
            (
                TextMediaContent,
                ImageMediaContent,
                ImageUrlMediaContent,
                VideoMediaContent,
                AudioMediaContent,
                FileMediaContent,
            ),
        ):
            return v

        # If it's a string, check if it is a dumped one
        if isinstance(v, str):
            return cls._content_from_string(v)

        # If it's a dictionary, check if it has a 'type' field
        if isinstance(v, dict):
            return cls._content_from_dict(v)  # pyright: ignore

        # It is's a list
        if isinstance(v, list):
            raise ValueError(
                "List of content is not supported. "
                "Please provide a single content item."
            )

        # Default fallback
        return TextMediaContent(type="text", text=str(v))


class UserResponse(StructuredBase):
    """User response model."""

    request_id: str
    type: MessageType = "input_response"
    data: Union[str, UserInputData, list[UserInputData]]

    @classmethod
    @field_validator("data", mode="before")
    def validate_data(
        cls, value: Any
    ) -> Union[str, UserInputData, list[UserInputData]]:
        """Validate the data field in UserResponse.

        Parameters
        ----------
        value: Any
            The input value to validate

        Returns
        -------
        Union[str, UserInputData, List[UserInputData]]
            The validated data
        """
        # Handle already correct types
        if cls._is_valid_type(value):
            return value

        # Handle different input types
        handlers: dict[Callable[..., Any], Any] = {
            str: cls._handle_string,
            dict: cls._handle_dict,
            list: cls._handle_list,
        }

        # Get the handler for this type, or use default handler
        # pylint: disable=line-too-long
        handler = handlers.get(
            type(value),  # pyright: ignore  # noqa: E501
            cls._handle_default,
        )
        return handler(value)

    @classmethod
    def _is_valid_type(cls, value: Any) -> bool:
        """Check if value is already a valid type.

        Parameters
        ----------
        value: Any
            The value to check

        Returns
        -------
        bool
            True if the value is already a valid type
        """
        return isinstance(value, (str, UserInputData)) or (
            isinstance(value, list)
            and all(
                isinstance(item, UserInputData)
                for item in value  # pyright: ignore
            )
        )

    @classmethod
    def _handle_string(
        cls, value: str
    ) -> Union[str, UserInputData, list[UserInputData]]:
        """Handle string input.

        Parameters
        ----------
        value: str
            The string input

        Returns
        -------
        Union[str, UserInputData, List[UserInputData]]
            Processed result
        """
        # pylint: disable=too-many-try-statements
        try:
            parsed_value = json.loads(value)
            # If it parsed to a string, return it directly
            if isinstance(parsed_value, str):
                return parsed_value
            # Otherwise process it based on its type
            if isinstance(parsed_value, dict):
                return cls._handle_dict(parsed_value)  # pyright: ignore
            if isinstance(parsed_value, list):
                return cls._handle_list(parsed_value)  # pyright: ignore
            # For simple values like numbers or booleans
            return str(parsed_value)
        except json.JSONDecodeError:
            # Not valid JSON, return original string
            return value

    @classmethod
    def _handle_dict(cls, value: dict[str, Any]) -> UserInputData:
        """Handle dictionary input.

        Parameters
        ----------
        value: dict
            The dictionary input

        Returns
        -------
        UserInputData
            Processed result
        """
        # pylint: disable=broad-exception-caught
        if "content" in value:
            try:
                return UserInputData(content=value["content"])
            except Exception:
                # If that fails, try validating content directly
                try:
                    content = UserInputData.validate_content(value["content"])
                    return UserInputData(content=content)
                except Exception:
                    # Last resort: treat as text
                    return UserInputData(
                        content=TextMediaContent(
                            text=f"Invalid content: {json.dumps(value)[:100]}.."
                        )
                    )

        # Try without content field
        try:
            content = UserInputData.validate_content(value)
            return UserInputData(content=content)
        except Exception:
            # Last resort: treat as text
            return UserInputData(
                content=TextMediaContent(
                    text=f"Invalid data: {json.dumps(value)[:100]}..."
                )
            )

    @classmethod
    def _handle_list(
        cls, value: list[Any]
    ) -> Union[UserInputData, list[UserInputData]]:
        """Handle list input.

        Parameters
        ----------
        value: list
            The list input

        Returns
        -------
        Union[UserInputData, List[UserInputData]]
            Processed result - single item if list has only one element
        """
        result: list[Any] = []

        for item in value:
            # Handle different item types
            if isinstance(item, UserInputData):
                result.append(item)
            elif isinstance(item, dict):
                result.append(cls._handle_dict(item))  # pyright: ignore
            elif isinstance(item, str):
                result.append(cls._create_text_input(item))
            else:
                result.append(cls._create_text_input(str(item)))

        # If there's only one item, return it directly
        if len(result) == 1:
            return result[0]
        return result

    @classmethod
    def _handle_default(cls, value: Any) -> UserInputData:
        """Handle any other type of input.

        Parameters
        ----------
        value: Any
            The input

        Returns
        -------
        UserInputData
            Processed result
        """
        return cls._create_text_input(str(value))

    @classmethod
    def _create_text_input(cls, text: str) -> UserInputData:
        """Create a text input.

        Parameters
        ----------
        text: str
            The text

        Returns
        -------
        UserInputData
            UserInputData with text content
        """
        return UserInputData(content=TextMediaContent(text=text))

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the response to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the file, optional.

        Returns
        -------
        str
            The string representation of the response.
        """
        if isinstance(self.data, list):
            string = ""
            for item in self.data:
                string += (
                    item.to_string(
                        uploads_root=uploads_root, base_name=base_name
                    )
                    + " "
                )
            return string.strip()
        if isinstance(self.data, UserInputData):
            return self.data.to_string()
        if isinstance(self.data, str):  # pyright: ignore
            return self.data
        return json.dumps(self.data)


def detect_media_type(value: dict[str, Any]) -> MediaType:
    """Detect mediatype from dict.

    Either using the 'type' field or by checking the keys.

    Parameters
    ----------
    value : dict[str, Any]
        The input dictionary

    Returns
    -------
    MediaType
        The detected media type

    Raises
    ------
    ValueError
        If the media type is not valid or not found.
    """
    valid_types = (
        "text",
        "image",
        "image_url",
        "video",
        "audio",
        "file",
        "document",
    )
    if "type" in value:
        content_type = value["type"]
        if content_type not in valid_types:
            raise ValueError(f"Invalid media type: {content_type}")
        return content_type
    for valid_type in valid_types:
        if valid_type in value:
            return valid_type  # type: ignore
    raise ValueError(f"No type in value: {value}.")
