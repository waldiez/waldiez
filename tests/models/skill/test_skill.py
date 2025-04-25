# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Test waldiez.models.skill.*."""

import pytest
from waldiez.models.skill import (
    SHARED_SKILL_NAME,
    WaldiezSkill,
    WaldiezSkillData,
)


def test_waldiez_skill() -> None:
    """Test WaldiezSkill."""
    # Given
    skill_id = "ws-1"
    name = "skill_name"
    description = "description"
    data = {"content": "def skill_name():\n    pass"}
    # When
    skill = WaldiezSkill(
        id=skill_id,
        name=name,
        description=description,
        data=data,  # type: ignore
    )
    # Then
    assert skill.id == skill_id
    assert skill.name == name
    assert skill.description == description
    assert skill.content == data["content"]
    assert not skill.secrets
    assert not skill.tags
    assert not skill.requirements


def test_invalid_skill() -> None:
    """Test invalid WaldiezSkill."""
    with pytest.raises(ValueError):
        WaldiezSkill()

    # Given
    skill_id = "ws-1"
    name = "skill_name"
    description = "description"
    data = {"content": "def skill_name(4):"}
    # Then
    with pytest.raises(ValueError):
        WaldiezSkill(
            id=skill_id,
            name=name,
            description=description,
            data=data,  # type: ignore
        )

    # Given
    skill_id = "ws-1"
    name = "skill_name"
    description = "description"
    data = {"content": "def not_skill_name():\n    pass"}
    # Then
    with pytest.raises(ValueError):
        WaldiezSkill(
            id=skill_id,
            name=name,
            description=description,
            data=data,  # type: ignore
        )


def test_shared_skill() -> None:
    """Test shared skill."""
    # When
    skill = WaldiezSkill(
        id="ws-1",
        type="skill",
        tags=[],
        requirements=[],
        name=SHARED_SKILL_NAME,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="shared skill",
        data=WaldiezSkillData(content="GLOBAL_VARIABLE = 5", secrets={}),
    )
    # Then
    assert skill.id == "ws-1"
    assert skill.name == SHARED_SKILL_NAME
    assert skill.description == "shared skill"
    assert skill.content == "GLOBAL_VARIABLE = 5"
    assert not skill.secrets
    assert not skill.tags
    assert not skill.requirements
    assert skill.get_content() == "GLOBAL_VARIABLE = 5"


def test_langchain_skill() -> None:
    """Test langchain skill."""
    # When
    skill_name = "wiki_tool"
    langchain_tool_content = """
import os
import sys
from typing import List

from autogen.interop import Interoperability
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
"""
    skill = WaldiezSkill(
        id="ws-1",
        type="skill",
        tags=[],
        requirements=["wikipedia"],
        name=skill_name,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="langchain skill",
        data=WaldiezSkillData(
            skill_type="langchain",
            content=langchain_tool_content,
            secrets={},
        ),
    )
    # Then
    assert skill.id == "ws-1"
    assert skill.name == skill_name
    assert skill.description == "langchain skill"
    assert skill.content == (
        "api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)\n"
        "wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)"
    )
    assert not skill.secrets
    assert not skill.tags
    assert skill.requirements == ["wikipedia"]
    assert skill.get_content() == skill.content
    skill_imports = skill.get_imports()
    assert skill_imports[1] == [
        "from autogen.interop import Interoperability",
        "from langchain_community.tools import WikipediaQueryRun",
        "from langchain_community.utilities import WikipediaAPIWrapper",
    ]
    assert skill_imports[0] == [
        "import os",
        "import sys",
        "from typing import List",
    ]


def test_crewai_skill() -> None:
    """Test crewai skill."""
    # When
    crewai_tool_content = """
import os
from typing import List
from autogen.interop import Interoperability
from crewai_tools import ScrapeWebsiteTool
scrape_tool = ScrapeWebsiteTool()

"""
    skill = WaldiezSkill(
        id="ws-1",
        type="skill",
        tags=[],
        requirements=["crewai"],
        name="scrape_tool",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="crewai skill",
        data=WaldiezSkillData(
            skill_type="crewai",
            content=crewai_tool_content,
            secrets={},
        ),
    )
    # Then
    assert skill.id == "ws-1"
    assert skill.name == "scrape_tool"
    assert skill.description == "crewai skill"
    assert skill.content == "scrape_tool = ScrapeWebsiteTool()"
    assert not skill.secrets
    assert not skill.tags
    assert skill.requirements == ["crewai"]
    assert skill.get_content() == skill.content
    skill_imports = skill.get_imports()
    assert skill_imports[0] == ["import os", "from typing import List"]
    assert skill_imports[1] == [
        "from autogen.interop import Interoperability",
        "from crewai_tools import ScrapeWebsiteTool",
    ]


def test_pydantic_skill() -> None:
    """Test pydantic skill."""
    # Given
    skill_id = "ws-1"
    skill_name = "ag2_pydantic_ai_tool"
    description = "description"
    pydantic_ai_tool_content = '''

from autogen.tools import Tool
from autogen.interop import Interoperability
from pydantic import BaseModel
from pydantic_ai import RunContext
from pydantic_ai.tools import Tool as PydanticAITool

def ag2_pydantic_ai_tool() -> Tool:
    """Get the pydantic tool."""

    class Player(BaseModel):
        name: str
        age: int


    def get_player(ctx: RunContext[Player], additional_info: Optional[str] = None) -> str:
        """Get the player's name.

        Args:
            additional_info: Additional information which can be used.
        """
        return f"Name: {ctx.deps.name}, Age: {ctx.deps.age}, Additional info: {additional_info}"


    pydantic_ai_tool = PydanticAITool(get_player, takes_ctx=True)
    interoperability = Interoperability()
    player = Player(name="John", age=25)
    return interoperability.convert_tool(pydantic_ai_tool, type="pydanticai", deps=player)

'''
    # When
    skill = WaldiezSkill(
        id=skill_id,
        name=skill_name,
        type="skill",
        tags=[],
        requirements=[],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description=description,
        data=WaldiezSkillData(
            skill_type="custom",
            content=pydantic_ai_tool_content,
            secrets={},
        ),
    )
    # Then
    assert skill.id == skill_id
    assert skill.name == skill_name
    assert skill.description == description
    content_without_imports = '''def ag2_pydantic_ai_tool() -> Tool:
    """Get the pydantic tool."""

    class Player(BaseModel):
        name: str
        age: int


    def get_player(ctx: RunContext[Player], additional_info: Optional[str] = None) -> str:
        """Get the player's name.

        Args:
            additional_info: Additional information which can be used.
        """
        return f"Name: {ctx.deps.name}, Age: {ctx.deps.age}, Additional info: {additional_info}"


    pydantic_ai_tool = PydanticAITool(get_player, takes_ctx=True)
    interoperability = Interoperability()
    player = Player(name="John", age=25)
    return interoperability.convert_tool(pydantic_ai_tool, type="pydanticai", deps=player)'''
    assert skill.content == content_without_imports
    assert not skill.secrets
    assert not skill.tags
    assert not skill.requirements
    assert skill.get_content() == skill.content
    skill_imports = skill.get_imports()
    assert not skill_imports[0]
    assert skill_imports[1] == [
        "from autogen.interop import Interoperability",
        "from autogen.tools import Tool",
        "from pydantic import BaseModel",
        "from pydantic_ai import RunContext",
        "from pydantic_ai.tools import Tool as PydanticAITool",
    ]


def test_skill_without_interop_convert() -> None:
    """Test skill without interop convert."""
    # Given
    skill_name = "wiki_tool"
    langchain_tool_content = """
import os
import sys
from typing import List

from autogen.interop import Interoperability
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
"""
    # Then
    WaldiezSkill(
        id="ws-1",
        type="skill",
        tags=[],
        requirements=["wikipedia"],
        name=skill_name,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="langchain skill",
        data=WaldiezSkillData(
            skill_type="langchain",
            content=langchain_tool_content,
            secrets={},
        ),
    )


def test_skill_invalid_name() -> None:
    """Test invalid skill name."""
    # When
    skill_name = "invalid_name"
    langchain_tool_content = """
import os
import sys
from typing import List

from autogen.interop import Interoperability
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
ag2_tool = Interoperability().convert_tool(wiki_tool, type="langchain")
"""
    with pytest.raises(ValueError):
        WaldiezSkill(
            id="ws-1",
            type="skill",
            tags=[],
            requirements=["wikipedia"],
            name=skill_name,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            description="langchain skill",
            data=WaldiezSkillData(
                skill_type="langchain",
                content=langchain_tool_content,
                secrets={},
            ),
        )


def test_custom_skill_content() -> None:
    """Test custom skill content."""
    # Given
    skill_id = "ws-1"
    name = "custom_skill"
    description = "description"
    content = '''

import os
from typing import List

import chess
import numpy as np
from nltk.tokenize import word_tokenize

def custom_skill(text: str) -> List[str]:
    """Tokenize the text."""
    return word_tokenize(text)

'''
    # When
    skill = WaldiezSkill(
        id=skill_id,
        name=name,
        type="skill",
        tags=[],
        requirements=[],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description=description,
        data=WaldiezSkillData(content=content, secrets={}),
    )
    # Then
    assert skill.id == skill_id
    assert skill.name == name
    assert skill.description == description
    assert not skill.secrets
    assert not skill.tags
    assert not skill.requirements
    assert (
        skill.get_content()
        == '''def custom_skill(text: str) -> List[str]:
    """Tokenize the text."""
    return word_tokenize(text)'''
    )
    skill_imports = skill.get_imports()
    assert skill_imports[0] == ["import os", "from typing import List"]
    assert skill_imports[1] == [
        "import chess",
        "import numpy as np",
        "from nltk.tokenize import word_tokenize",
    ]
