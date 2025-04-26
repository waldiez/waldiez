# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test loading a skill from a file or a dictionary."""

import json
from pathlib import Path

import pytest

from waldiez.models.skill import WaldiezSkill


def test_load_skill_from_file(tmp_path: Path) -> None:
    """Test loading a skill from a file.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    skill_content = '''def custom_skill() -> str:
    """Custom skill."""
    return "This is a custom skill."'''
    skill = {
        "id": "test_skill",
        "type": "skill",
        "name": "custom_skill",
        "description": "This is a test skill.",
        "tags": ["test", "skill"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "skillType": "custom",
            "content": skill_content,
            "secrets": {},
        },
    }
    skill_file = tmp_path / "test_load_skill_from_file.WaldiezSkill"
    with open(skill_file, "w", encoding="utf-8") as f:
        json.dump(skill, f)

    loaded_skill = WaldiezSkill.load(str(skill_file))
    assert loaded_skill.id == skill["id"]
    assert loaded_skill.type == skill["type"]
    assert loaded_skill.name == skill["name"]
    assert loaded_skill.description == skill["description"]
    assert loaded_skill.tags == skill["tags"]
    assert loaded_skill.requirements == skill["requirements"]
    assert loaded_skill.created_at == skill["created_at"]
    assert loaded_skill.updated_at == skill["updated_at"]
    assert loaded_skill.data.model_dump() == skill["data"]
    assert loaded_skill.data.skill_type == "custom"
    assert loaded_skill.data.content == skill_content
    skill_file.unlink()


def test_load_skill_from_dict() -> None:
    """Test loading a skill from a dictionary."""
    skill_content = '''def custom_skill() -> str:
    """Custom skill."""
    return "This is a custom skill."'''
    skill = {
        "id": "test_skill",
        "type": "skill",
        "name": "custom_skill",
        "description": "This is a test skill.",
        "tags": ["test", "skill"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "skillType": "custom",
            "content": skill_content,
            "secrets": {},
        },
    }

    loaded_skill = WaldiezSkill.load(skill)
    assert loaded_skill.id == skill["id"]
    assert loaded_skill.type == skill["type"]
    assert loaded_skill.name == skill["name"]
    assert loaded_skill.description == skill["description"]
    assert loaded_skill.tags == skill["tags"]
    assert loaded_skill.requirements == skill["requirements"]
    assert loaded_skill.created_at == skill["created_at"]
    assert loaded_skill.updated_at == skill["updated_at"]
    assert loaded_skill.data.model_dump() == skill["data"]
    assert loaded_skill.data.skill_type == "custom"
    assert loaded_skill.data.content == skill_content


def test_load_skill_from_invalid_file(tmp_path: Path) -> None:
    """Test loading a skill from an invalid file.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    skill_file = tmp_path / "test_load_skill_from_invalid_file.WaldiezSkill"
    with open(skill_file, "w", encoding="utf-8") as f:
        f.write("This is an invalid file.")

    with pytest.raises(ValueError):
        WaldiezSkill.load(skill_file)
    skill_file.unlink()


def test_load_skill_invalid_path(tmp_path: Path) -> None:
    """Test loading a skill from an invalid path.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    file_path = tmp_path / "invalid_path.WaldiezSkill"
    if file_path.exists():
        file_path.unlink()
    with pytest.raises(FileNotFoundError):
        WaldiezSkill.load(str(file_path))


def test_load_invalid_interop_skill() -> None:
    """Test loading an invalid interop skill."""
    skill_content = """
from autogen.interop import Interoperability
interop = Interoperability()
custom_skill = "This is a custom skill."
# we should not convert the tool
interop.convert_tool(tool="custom", type="langchain")
"""
    skill = {
        "id": "test_skill",
        "type": "skill",
        "name": "custom_skill",
        "description": "This is a test skill.",
        "tags": ["test", "skill"],
        "requirements": ["numpy"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "data": {
            "skillType": "langchain",
            "content": skill_content,
            "secrets": {},
        },
    }

    with pytest.raises(ValueError):
        WaldiezSkill.load(skill)
