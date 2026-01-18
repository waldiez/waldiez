# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc
# flake8: noqa: E501
"""Test waldiez.models.tool.*."""

from typing import Any

import pytest

from waldiez.models.tool import (
    SHARED_TOOL_NAME,
    WaldiezTool,
    WaldiezToolData,
)


# noinspection PyArgumentList
def test_waldiez_tool() -> None:
    """Test WaldiezTool."""
    # Given
    tool_id = "wt-1"
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


# noinspection PyArgumentList
def test_invalid_tool() -> None:
    """Test invalid WaldiezTool."""
    with pytest.raises(ValueError):
        WaldiezTool()

    # Given
    tool_id = "wt-1"
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
    tool_id = "wt-1"
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
        id="wt-1",
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
    assert tool.id == "wt-1"
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
        id="wt-1",
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
    assert tool.id == "wt-1"
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
        id="wt-1",
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
    assert tool.id == "wt-1"
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
    tool_id = "wt-1"
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
        id="wt-1",
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
            id="wt-1",
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
    tool_id = "wt-1"
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
    expected_content = '''def custom_tool(text: str) -> list[str]:
    """Tokenize the text."""
    return word_tokenize(text)'''
    assert tool.get_content() == expected_content
    tool_imports = tool.get_imports()
    assert tool_imports[0] == ["import os", "from typing import List"]
    assert tool_imports[1] == [
        "import chess",
        "import numpy as np",
        "from nltk.tokenize import word_tokenize",
    ]


@pytest.mark.parametrize(
    "name,description,requirements,secrets,kwargs,content,should_raise",
    [
        ("predefined_tool", "description", [], {}, {}, "any", True),
        (
            "google_search",
            "description",
            [],
            {"GOOGLE_SEARCH_API_KEY": "your_api_key"},
            {},
            "",
            True,
        ),
        (
            "google_search",
            "Google search tool",
            ["google"],
            {
                "GOOGLE_SEARCH_API_KEY": "your_api_key",
                "GOOGLE_SEARCH_ENGINE_ID": "your_search_engine_id",
            },
            {},
            "",
            False,
        ),
        (
            "youtube_search",
            "YouTube search tool",
            ["youtube"],
            {"YOUTUBE_API_KEY": "your_api_key"},
            {},
            "",
            False,
        ),
        (
            "wikipedia",
            "Wikipedia search tool",
            ["wikipedia"],
            {},
            {},
            "",
            True,
        ),
        (
            "wikipedia_search",
            "Wikipedia search tool",
            ["wikipedia"],
            {},
            {},
            "",
            False,
        ),
        (
            "perplexity_search",
            "Perplexity search tool",
            [],
            {"PERPLEXITY_API_KEY": "your_api_key"},
            {
                "model": "sonar",
                "max_tokens": 1000,
                "search_domain_filters": None,
            },
            "",
            False,
        ),
        (
            "perplexity_search",
            "Perplexity search tool",
            [],
            {},
            {
                "model": "sonar",
                "max_tokens": 1000,
                "search_domain_filters": None,
            },
            "",
            True,
        ),
        (
            "duckduckgo_search",
            "DuckDuckGo search tool",
            ["duckduckgo"],
            {},
            {},
            "",
            False,
        ),
        (
            "tavily_search",
            "Tavily search tool",
            ["tavily"],
            {"TAVILY_API_KEY": "your_api_key"},
            {},
            "",
            False,
        ),
        (
            "tavily_search",
            "Tavily search tool",
            ["tavily"],
            {},
            {},
            "",
            True,
        ),
        (
            "searxng_search",
            "SearxNG search tool",
            ["searxng"],
            {},
            {},
            "",
            False,
        ),
    ],
)
def test_predefined_tool_parametrized(
    name: str,
    description: str,
    requirements: list[str],
    secrets: dict[str, str],
    kwargs: dict[str, str],
    content: str,
    should_raise: bool,
) -> None:
    """Test predefined tool with various parameters."""
    tool_id = "wt-1"
    data = WaldiezToolData(
        content=content,
        secrets=secrets,
        tool_type="predefined",
        kwargs=kwargs or {},
    )

    args: dict[str, Any] = {
        "id": tool_id,
        "name": name,
        "type": "tool",
        "tags": [],
        "requirements": requirements,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "description": description,
        "data": data,
    }

    if should_raise:
        with pytest.raises(ValueError):
            WaldiezTool(**args)
    else:
        tool = WaldiezTool(**args)
        assert tool.id == tool_id
        assert tool.name == name
        assert tool.description == description
        assert tool.content is not None


def test_tool_data_serialization() -> None:
    """Test serialization of WaldiezToolData."""
    # Given
    content = '''
import os
from typing import List

def example_tool_function() -> str:
    """Example tool function."""
    return "Hello, world!"
'''
    secrets = {"API_KEY": "your_api_key"}
    kwargs = {"example_arg": "value"}
    tool_args: dict[str, Any] = {
        "content": content,
        "secrets": secrets,
        "kwargs": kwargs,
        "tool_type": "custom",
    }
    tool = WaldiezTool(
        id="example_tool_id",
        name="example_tool_function",
        type="tool",
        tags=[],
        requirements=[],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        description="Example tool function",
        data=tool_args,  # type: ignore
    )
    # When
    serialized_data = tool.data.model_dump(by_alias=True)
    # Then
    # Content should be stripped of imports
    assert tool.data.content != content
    assert "import" not in tool.data.content  # imports should be stripped
    assert tool.get_content() == tool.data.content
    # but should be serialized exactly as provided
    assert serialized_data["content"] == content
    assert serialized_data["secrets"] == secrets
    assert serialized_data["kwargs"] == kwargs
    assert serialized_data["toolType"] == "custom"
    # to_json string should also work correctly (keep raw content)
    assert "import os" in tool.model_dump_json()
    assert "from typing import List" in tool.data.model_dump_json()
