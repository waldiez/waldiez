# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Core exporting infrastructure.

This module provides base classes, types, result builders,
and extras for exportign flows.
"""

# Core base class
# Context management
# Constants / defaults
from .constants import (
    DEFAULT_AGENT_POSITION,
    DEFAULT_EXPORT_POSITION,
    DEFAULT_IMPORT_POSITION,
    FILE_HEADER,
)

# Content
from .content import ContentMetadata, PositionedContent

# Context management
from .context import (
    ExporterContext,
    create_exporter_context,
    get_default_exporter_context,
)

# Enums
from .enums import (
    AgentPosition,
    ContentOrder,
    ContentType,
    ExportPosition,
    GroupManagerStrategy,
    ImportPosition,
)

# Errors
from .errors import (
    ExporterContentError,
    ExporterError,
    ExporterInitializationError,
    ExporterValidationError,
)
from .exporter import (
    Exporter,
)
from .exporters import (
    ConfigurableExporter,
    SimpleExporter,
)

# Agent-specific extras
from .extras.agent_extras import (
    CaptainExtras,
    CodeExecutionConfig,
    GroupManagerExtras,
    RAGUserExtras,
    ReasoningExtras,
    StandardExtras,
    SystemMessageConfig,
    TerminationConfig,
)

# Base extras system
from .extras.base import BaseExtras

# Chat-specific extras
from .extras.chat_extras import (
    ChatExtras,
)

# Model-specific extras
from .extras.model_extras import (
    ModelExtras,
)

# Defaults
from .extras.path_resolver import DefaultPathResolver
from .extras.serializer import DefaultSerializer

# Tool-specific extras
from .extras.tool_extras import (
    ToolExtras,
)

# Protocols
from .protocols import (
    ContentGenerator,
    ExportContributor,
    PathResolver,
    Serializer,
    Validator,
)

# Export result system
from .result import (
    ExportResult,
    ExportResultBuilder,
    create_empty_result,
    create_result_with_content,
    merge_export_results,
)
from .types import (
    EnvironmentVariable,
    ExportConfig,
    Extras,
    ImportStatement,
    InstanceArgument,
    NoExtras,
)
from .utils import (
    get_agent_llm_config_arg,
    get_comment,
)
from .validation import (
    ValidationError,
    ValidationResult,
)

__all__ = [
    # Core base classes
    "Exporter",
    "SimpleExporter",
    "ConfigurableExporter",
    # Protocols
    "ContentGenerator",
    "ExportContributor",
    "Validator",
    "Serializer",
    "PathResolver",
    # Core types and enums
    "ImportPosition",
    "ExportPosition",
    "AgentPosition",
    "ContentOrder",
    "GroupManagerStrategy",
    "Extras",
    "ImportStatement",
    "PositionedContent",
    "EnvironmentVariable",
    "ExportConfig",
    "ContentType",
    "ContentMetadata",
    "InstanceArgument",
    "NoExtras",
    "ValidationError",
    "ValidationResult",
    # Constants
    "FILE_HEADER",
    "DEFAULT_IMPORT_POSITION",
    "DEFAULT_EXPORT_POSITION",
    "DEFAULT_AGENT_POSITION",
    # Context management
    "ExporterContext",
    "get_default_exporter_context",
    "create_exporter_context",
    "create_exporter_context",
    # Export result system
    "ExportResult",
    "ExportResultBuilder",
    "merge_export_results",
    "create_empty_result",
    "create_result_with_content",
    # Base extras
    "BaseExtras",
    "DefaultSerializer",
    "DefaultPathResolver",
    # Agent extras
    "StandardExtras",
    "GroupManagerExtras",
    "CaptainExtras",
    "CodeExecutionConfig",
    "RAGUserExtras",
    "ReasoningExtras",
    "SystemMessageConfig",
    "TerminationConfig",
    # Model extras
    "ModelExtras",
    # Tool extras
    "ToolExtras",
    # Chat extras
    "ChatExtras",
    # Errors
    "ExporterError",
    "ExporterInitializationError",
    "ExporterValidationError",
    "ExporterContentError",
    # utils
    "get_comment",
    "get_agent_llm_config_arg",
]
