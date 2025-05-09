# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test loading a tool from a file or a dictionary."""

import json
from pathlib import Path

import pytest

from waldiez.models.tool import WaldiezTool


def test_load_tool_from_file(tmp_path: Path) -> None:
    """Test loading a tool from a file.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    tool_content = '''def custom_tool() -> str:
    """Custom tool."""
    return "This is a custom tool."'''
    tool = {
        "id": "test_tool",
        "type": "tool",
        "name": "custom_tool",
        "description": "This is a test tool.",
        "tags": ["test", "tool"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "toolType": "custom",
            "content": tool_content,
            "secrets": {},
        },
    }
    tool_file = tmp_path / "test_load_tool_from_file.WaldiezTool"
    with open(tool_file, "w", encoding="utf-8") as f:
        json.dump(tool, f)

    loaded_tool = WaldiezTool.load(str(tool_file))
    assert loaded_tool.id == tool["id"]
    assert loaded_tool.type == tool["type"]
    assert loaded_tool.name == tool["name"]
    assert loaded_tool.description == tool["description"]
    assert loaded_tool.tags == tool["tags"]
    assert loaded_tool.requirements == tool["requirements"]
    assert loaded_tool.created_at == tool["created_at"]
    assert loaded_tool.updated_at == tool["updated_at"]
    assert loaded_tool.data.model_dump() == tool["data"]
    assert loaded_tool.data.tool_type == "custom"
    assert loaded_tool.data.content == tool_content
    tool_file.unlink()


def test_load_tool_from_dict() -> None:
    """Test loading a tool from a dictionary."""
    tool_content = '''def custom_tool() -> str:
    """Custom tool."""
    return "This is a custom tool."'''
    tool = {
        "id": "test_tool",
        "type": "tool",
        "name": "custom_tool",
        "description": "This is a test tool.",
        "tags": ["test", "tool"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "toolType": "custom",
            "content": tool_content,
            "secrets": {},
        },
    }

    loaded_tool = WaldiezTool.load(tool)
    assert loaded_tool.id == tool["id"]
    assert loaded_tool.type == tool["type"]
    assert loaded_tool.name == tool["name"]
    assert loaded_tool.description == tool["description"]
    assert loaded_tool.tags == tool["tags"]
    assert loaded_tool.requirements == tool["requirements"]
    assert loaded_tool.created_at == tool["created_at"]
    assert loaded_tool.updated_at == tool["updated_at"]
    assert loaded_tool.data.model_dump() == tool["data"]
    assert loaded_tool.data.tool_type == "custom"
    assert loaded_tool.data.content == tool_content


def test_load_tool_from_invalid_file(tmp_path: Path) -> None:
    """Test loading a tool from an invalid file.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    tool_file = tmp_path / "test_load_tool_from_invalid_file.WaldiezTool"
    with open(tool_file, "w", encoding="utf-8") as f:
        f.write("This is an invalid file.")

    with pytest.raises(ValueError):
        WaldiezTool.load(tool_file)
    tool_file.unlink()


def test_load_tool_invalid_path(tmp_path: Path) -> None:
    """Test loading a tool from an invalid path.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    file_path = tmp_path / "invalid_path.WaldiezTool"
    if file_path.exists():
        file_path.unlink()
    with pytest.raises(FileNotFoundError):
        WaldiezTool.load(str(file_path))


def test_load_invalid_interop_tool() -> None:
    """Test loading an invalid interop tool."""
    tool_content = """
from autogen.interop import Interoperability
interop = Interoperability()
custom_tool = "This is a custom tool."
# we should not convert the tool
interop.convert_tool(tool="custom", type="langchain")
"""
    tool = {
        "id": "test_tool",
        "type": "tool",
        "name": "custom_tool",
        "description": "This is a test tool.",
        "tags": ["test", "tool"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "toolType": "langchain",
            "content": tool_content,
            "secrets": {},
        },
    }

    with pytest.raises(ValueError):
        WaldiezTool.load(tool)
