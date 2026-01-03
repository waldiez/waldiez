# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Enums for Waldiez exporting core."""

from enum import Enum


# Position Enums
class ImportPosition(Enum):
    """Position for import statements in the generated code."""

    BUILTINS = 0  # Built-in imports (os, sys, etc.)
    THIRD_PARTY = 1  # Third-party imports (autogen, openai, etc.)
    LOCAL = 2  # Local/relative imports


class ExportPosition(Enum):
    """Position for content in the exported code.

    Attributes
    ----------
    TOP : int
        Position at the top of the file, typically for comments or metadata.
    IMPORTS : int
        Position for import statements.
    TOOLS : int
        Position for tool definitions.
    MODELS : int
        Position for model configurations (llm_config).
    AGENTS : int
        Position for agent definitions.
    CHATS : int
        Position for chat/connection definitions.
    BOTTOM : int
        Position at the bottom of the file,
        typically for main execution or final code.
    """

    TOP = 0  # Top of file (comments, metadata)
    IMPORTS = 1  # Import statements section
    TOOLS = 2  # Tool definitions
    MODELS = 3  # Model configurations (llm_config)
    AGENTS = 4  # Agent definitions
    CHATS = 5  # Chat/connection definitions
    BOTTOM = 6  # Bottom of file (main execution, etc.)


class AgentPosition(Enum):
    """Position relative to a specific agent."""

    BEFORE_ALL = 0  # Before all agents are defined
    BEFORE = 1  # Before this specific agent
    AS_ARGUMENT = 2  # As part of agent's initialization arguments
    AFTER = 3  # After this specific agent
    AFTER_ALL = 4  # After all agents are defined


# Content Order Enums
class ContentOrder(Enum):
    """Standard ordering for positioned content."""

    EARLY_SETUP = -100
    SETUP = -50
    PRE_CONTENT = -10
    MAIN_CONTENT = 0  # Default
    POST_CONTENT = 10
    CLEANUP = 50
    LATE_CLEANUP = 100


# Content Type Markers
class ContentType(Enum):
    """Type of content being exported."""

    AGENT_DEFINITION = 0
    MODEL_CONFIG = 1
    TOOL_DEFINITION = 2
    CHAT_DEFINITION = 3
    FLOW_SETUP = 4
    UTILITY_FUNCTION = 5
    IMPORT_STATEMENT = 6
    ENVIRONMENT_SETUP = 7


class GroupManagerStrategy(Enum):
    """Strategy for group manager agent."""

    PATTERN = "pattern"  # Use AG2 Pattern system
    TRADITIONAL = "traditional"  # Use traditional GroupChat + GroupChatManager
