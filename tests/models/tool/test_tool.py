# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Test waldiez.models.tool.*."""

import pytest

from waldiez.models.tool import (
    SHARED_TOOL_NAME,
    WaldiezTool,
    WaldiezToolData,
)


def test_waldiez_tool() -> None:
    """Test WaldiezTool."""
    # Given
    tool_id = "ws-1"
    name = "tool_name"
    description = "description"
    data = {"content": "def tool_name():\n    pass"}
    # When
    tool = WaldiezTool(
        id=tool_id,
        name=name,
        description=description,
        data=data,  # type: ignore
    )
    # Then
    assert tool.id == tool_id
    assert tool.name == name
    assert tool.description == description
    assert tool.content == data["content"]
    assert not tool.secrets
    assert not tool.tags
    assert not tool.requirements


def test_invalid_tool() -> None:
    """Test invalid WaldiezTool."""
    with pytest.raises(ValueError):
        WaldiezTool()

    # Given
    tool_id = "ws-1"
    name = "tool_name"
    description = "description"
    data = {"content": "def tool_name(4):"}
    # Then
    with pytest.raises(ValueError):
        WaldiezTool(
            id=tool_id,
            name=name,
            description=description,
            data=data,  # type: ignore
        )

    # Given
    tool_id = "ws-1"
    name = "tool_name"
    description = "description"
    data = {"content": "def not_tool_name():\n    pass"}
    # Then
    with pytest.raises(ValueError):
        WaldiezTool(
            id=tool_id,
            name=name,
            description=description,
            data=data,  # type: ignore
        )


def test_shared_tool() -> None:
    """Test shared tool."""
    # When
    tool = WaldiezTool(
        id="ws-1",
        type="tool",
        tags=[],
        requirements=[],
        name=SHARED_TOOL_NAME,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="shared tool",
        data=WaldiezToolData(content="GLOBAL_VARIABLE = 5", secrets={}),
    )
    # Then
    assert tool.id == "ws-1"
    assert tool.name == SHARED_TOOL_NAME
    assert tool.description == "shared tool"
    assert tool.content == "GLOBAL_VARIABLE = 5"
    assert not tool.secrets
    assert not tool.tags
    assert not tool.requirements
    assert tool.get_content() == "GLOBAL_VARIABLE = 5"


def test_langchain_tool() -> None:
    """Test langchain tool."""
    # When
    tool_name = "wiki_tool"
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
    tool = WaldiezTool(
        id="ws-1",
        type="tool",
        tags=[],
        requirements=["wikipedia"],
        name=tool_name,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="langchain tool",
        data=WaldiezToolData(
            tool_type="langchain",
            content=langchain_tool_content,
            secrets={},
        ),
    )
    # Then
    assert tool.id == "ws-1"
    assert tool.name == tool_name
    assert tool.description == "langchain tool"
    assert tool.content == (
        "api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)\n"
        "wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)"
    )
    assert not tool.secrets
    assert not tool.tags
    assert tool.requirements == ["wikipedia"]
    assert tool.get_content() == tool.content
    tool_imports = tool.get_imports()
    assert tool_imports[1] == [
        "from autogen.interop import Interoperability",
        "from langchain_community.tools import WikipediaQueryRun",
        "from langchain_community.utilities import WikipediaAPIWrapper",
    ]
    assert tool_imports[0] == [
        "import os",
        "import sys",
        "from typing import List",
    ]


def test_crewai_tool() -> None:
    """Test crewai tool."""
    # When
    crewai_tool_content = """
import os
from typing import List
from autogen.interop import Interoperability
from crewai_tools import ScrapeWebsiteTool
scrape_tool = ScrapeWebsiteTool()

"""
    tool = WaldiezTool(
        id="ws-1",
        type="tool",
        tags=[],
        requirements=["crewai"],
        name="scrape_tool",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="crewai tool",
        data=WaldiezToolData(
            tool_type="crewai",
            content=crewai_tool_content,
            secrets={},
        ),
    )
    # Then
    assert tool.id == "ws-1"
    assert tool.name == "scrape_tool"
    assert tool.description == "crewai tool"
    assert tool.content == "scrape_tool = ScrapeWebsiteTool()"
    assert not tool.secrets
    assert not tool.tags
    assert tool.requirements == ["crewai"]
    assert tool.get_content() == tool.content
    tool_imports = tool.get_imports()
    assert tool_imports[0] == ["import os", "from typing import List"]
    assert tool_imports[1] == [
        "from autogen.interop import Interoperability",
        "from crewai_tools import ScrapeWebsiteTool",
    ]


def test_pydantic_tool() -> None:
    """Test pydantic tool."""
    # Given
    tool_id = "ws-1"
    tool_name = "ag2_pydantic_ai_tool"
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
    tool = WaldiezTool(
        id=tool_id,
        name=tool_name,
        type="tool",
        tags=[],
        requirements=[],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description=description,
        data=WaldiezToolData(
            tool_type="custom",
            content=pydantic_ai_tool_content,
            secrets={},
        ),
    )
    # Then
    assert tool.id == tool_id
    assert tool.name == tool_name
    assert tool.description == description
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
    assert tool.content == content_without_imports
    assert not tool.secrets
    assert not tool.tags
    assert not tool.requirements
    assert tool.get_content() == tool.content
    tool_imports = tool.get_imports()
    assert not tool_imports[0]
    assert tool_imports[1] == [
        "from autogen.interop import Interoperability",
        "from autogen.tools import Tool",
        "from pydantic import BaseModel",
        "from pydantic_ai import RunContext",
        "from pydantic_ai.tools import Tool as PydanticAITool",
    ]


def test_tool_without_interop_convert() -> None:
    """Test tool without interop convert."""
    # Given
    tool_name = "wiki_tool"
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
    WaldiezTool(
        id="ws-1",
        type="tool",
        tags=[],
        requirements=["wikipedia"],
        name=tool_name,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="langchain tool",
        data=WaldiezToolData(
            tool_type="langchain",
            content=langchain_tool_content,
            secrets={},
        ),
    )


def test_tool_invalid_name() -> None:
    """Test invalid tool name."""
    # When
    tool_name = "invalid_name"
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
        WaldiezTool(
            id="ws-1",
            type="tool",
            tags=[],
            requirements=["wikipedia"],
            name=tool_name,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            description="langchain tool",
            data=WaldiezToolData(
                tool_type="langchain",
                content=langchain_tool_content,
                secrets={},
            ),
        )


def test_custom_tool_content() -> None:
    """Test custom tool content."""
    # Given
    tool_id = "ws-1"
    name = "custom_tool"
    description = "description"
    content = '''

import os
from typing import List

import chess
import numpy as np
from nltk.tokenize import word_tokenize

def custom_tool(text: str) -> list[str]:
    """Tokenize the text."""
    return word_tokenize(text)

'''
    # When
    tool = WaldiezTool(
        id=tool_id,
        name=name,
        type="tool",
        tags=[],
        requirements=[],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description=description,
        data=WaldiezToolData(content=content, secrets={}),
    )
    # Then
    assert tool.id == tool_id
    assert tool.name == name
    assert tool.description == description
    assert not tool.secrets
    assert not tool.tags
    assert not tool.requirements
    assert (
        tool.get_content()
        == '''def custom_tool(text: str) -> list[str]:
    """Tokenize the text."""
    return word_tokenize(text)'''
    )
    tool_imports = tool.get_imports()
    assert tool_imports[0] == ["import os", "from typing import List"]
    assert tool_imports[1] == [
        "import chess",
        "import numpy as np",
        "from nltk.tokenize import word_tokenize",
    ]
