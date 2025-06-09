# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportPrivateUsage=false
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=no-self-use,protected-access,too-many-public-methods
"""Tests for waldiez.io.models.user_response.*."""

import json
from pathlib import Path
from typing import Any

from waldiez.io.models.content.text import TextMediaContent
from waldiez.io.models.user_input import UserInputData
from waldiez.io.models.user_response import UserResponse


class TestUserResponse:
    """Test suite for UserResponse class."""

    def test_json_string_becomes_user_input_data(self) -> None:
        """Test that JSON strings get parsed to UserInputData."""
        json_data = json.dumps({"text": "hello world"})
        response = UserResponse(request_id="req2", data=json_data)

        assert isinstance(response.data, UserInputData)
        assert response.data.content.text == "hello world"  # type: ignore
        assert response.to_string() == "hello world"

    def test_dict_becomes_user_input_data(self) -> None:
        """Test that dictionaries become UserInputData."""
        response = UserResponse(
            request_id="req3",
            data={"text": "from dict"},  # type: ignore
        )

        assert isinstance(response.data, UserInputData)
        assert response.data.content.text == "from dict"  # type: ignore

    def test_existing_user_input_data_unchanged(self) -> None:
        """Test that existing UserInputData passes through unchanged."""
        user_input = UserInputData(content=TextMediaContent(text="existing"))
        response = UserResponse(request_id="req4", data=user_input)

        assert response.data is user_input

    def test_list_of_user_input_data_unchanged(self) -> None:
        """Test that valid lists pass through unchanged."""
        input1 = UserInputData(content=TextMediaContent(text="first"))
        input2 = UserInputData(content=TextMediaContent(text="second"))

        response = UserResponse(request_id="req5", data=[input1, input2])

        assert isinstance(response.data, list)
        assert len(response.data) == 2
        assert response.data[0] is input1  # pyright: ignore
        assert response.data[1] is input2

    def test_nested_list_gets_processed(self) -> None:
        """Test that nested lists get converted properly."""
        nested_list: list[Any] = [
            {"text": "from dict"},
            UserInputData(content=TextMediaContent(text="existing")),
            ["another", "nested", "list"],
            ["yet another", {"text": "dict in list"}],
            ["one"],
            4,
        ]

        response = UserResponse(request_id="req5", data=nested_list)

        assert isinstance(response.data, list)
        assert len(response.data) == 9
        assert isinstance(response.data[0], UserInputData)
        assert response.data[0].to_string() == "from dict"

    def test_mixed_list_gets_processed(self) -> None:
        """Test that mixed lists get converted properly."""
        mixed_list: list[Any] = [
            "plain str",
            {"text": "from dict"},
            UserInputData(content=TextMediaContent(text="existing")),
        ]

        response = UserResponse(request_id="req6", data=mixed_list)

        assert isinstance(response.data, list)
        assert len(response.data) == 3
        assert all(isinstance(item, UserInputData) for item in response.data)
        assert response.data[0].content.text == "plain str"  # type: ignore
        assert response.data[1].content.text == "from dict"  # type: ignore
        assert response.data[2].content.text == "existing"  # type: ignore

    def test_single_item_list_returns_item_directly(self) -> None:
        """Test that single-item lists return the item directly."""
        response = UserResponse(
            request_id="req7",
            data=["single item"],  # type: ignore
        )

        assert isinstance(response.data, UserInputData)
        assert response.data.content.text == "single item"  # type: ignore

    def test_json_with_content_field(self) -> None:
        """Test JSON with explicit content field."""
        json_data = json.dumps({"content": {"text": "content text"}})
        response = UserResponse(request_id="req8", data=json_data)

        assert isinstance(response.data, UserInputData)
        assert response.data.content.text == "content text"  # type: ignore

    def test_invalid_content_field_fallback(self) -> None:
        """Test fallback when content field is invalid."""
        json_data = json.dumps({"content": {"invalid": "field"}})
        response = UserResponse(request_id="req9", data=json_data)

        assert isinstance(response.data, UserInputData)
        assert "Invalid content:" in response.data.content.text  # type: ignore

    def test_invalid_dict_fallback(self) -> None:
        """Test fallback when dict validation fails."""
        response = UserResponse(
            request_id="req10",
            data={"invalid": "structure"},  # type: ignore
        )

        assert isinstance(response.data, UserInputData)
        assert "Invalid data:" in response.data.content.text  # type: ignore

    def test_boolean_input(self) -> None:
        """Test boolean input gets converted to text."""
        response = UserResponse(
            request_id="req12",
            data=True,  # type: ignore
        )

        assert isinstance(response.data, UserInputData)
        assert response.data.content.text == "True"  # type: ignore

    def test_json_list_processing(self) -> None:
        """Test JSON string containing a list."""
        json_data = json.dumps(
            [{"text": "first item"}, {"text": "second item"}]
        )
        response = UserResponse(request_id="req13", data=json_data)

        assert isinstance(response.data, list)
        assert len(response.data) == 2
        assert response.data[0].content.text == "first item"  # type: ignore
        assert response.data[1].content.text == "second item"  # type: ignore

    def test_json_primitive_values(self) -> None:
        """Test JSON strings with primitive values."""
        # JSON number
        response1 = UserResponse(request_id="req14", data=json.dumps(123))
        assert isinstance(response1.data, UserInputData)
        assert response1.data.content.text == "123"  # type: ignore

        # JSON boolean
        response2 = UserResponse(request_id="req15", data=json.dumps(False))
        assert isinstance(response2.data, UserInputData)
        assert response2.data.content.text == "False"  # type: ignore

    def test_to_string_with_list(self) -> None:
        """Test to_string with list data."""
        input1 = UserInputData(content=TextMediaContent(text="first"))
        input2 = UserInputData(content=TextMediaContent(text="second"))

        response = UserResponse(request_id="req16", data=[input1, input2])

        result = response.to_string()
        assert result == '["first", "second"]'

    def test_to_string_with_uploads_params(self, tmp_path: Path) -> None:
        """Test to_string with upload parameters."""
        user_input = UserInputData(content=TextMediaContent(text="test"))
        response = UserResponse(request_id="req17", data=user_input)

        result = response.to_string(
            uploads_root=tmp_path, base_name="test_base"
        )
        assert result == "test"

    def test_json_detection_edge_cases(self) -> None:
        """Test JSON detection with edge cases."""
        # String that looks like JSON but isn't
        response1 = UserResponse(request_id="req18", data="{not valid json")
        assert isinstance(response1.data, UserInputData)
        assert (
            response1.data.to_string() == "{not valid json"  # pyright: ignore
        )

        # Empty string
        response2 = UserResponse(request_id="req19", data="")
        assert isinstance(response2.data, UserInputData)
        assert response2.data.to_string() == ""

        # Valid empty JSON object
        response3 = UserResponse(request_id="req20", data="{}")
        assert isinstance(response3.data, UserInputData)

    def test_model_serialization(self) -> None:
        """Test model can be serialized and deserialized."""
        response = UserResponse(request_id="req21", data="test data")

        # Serialize
        json_data = response.model_dump_json()

        # Deserialize
        recreated = UserResponse.model_validate_json(json_data)

        assert recreated.request_id == response.request_id
        assert recreated.data == response.data
