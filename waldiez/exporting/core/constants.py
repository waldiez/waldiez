# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Constants for Waldiez exporting core."""

from .enums import (
    AgentPosition,
    ExportPosition,
    ImportPosition,
)

FILE_HEADER = (
    "# SPDX-License-Identifier: Apache-2.0.\n"
    "# Copyright (c) 2024 - 2025 Waldiez and contributors."
)
DEFAULT_IMPORT_POSITION = ImportPosition.THIRD_PARTY
DEFAULT_EXPORT_POSITION = ExportPosition.AGENTS
DEFAULT_AGENT_POSITION = AgentPosition.AFTER
