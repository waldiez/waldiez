# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Constants for Waldiez exporting core."""

from datetime import datetime, timezone

from .enums import (
    AgentPosition,
    ExportPosition,
    ImportPosition,
)

FILE_HEADER = (
    "# SPDX-License-Identifier: Apache-2.0.\n"
    f"# Copyright (c) 2024 - {datetime.now(timezone.utc).year} "
    "Waldiez and contributors."
)
DEFAULT_IMPORT_POSITION = ImportPosition.THIRD_PARTY
DEFAULT_EXPORT_POSITION = ExportPosition.AGENTS
DEFAULT_AGENT_POSITION = AgentPosition.AFTER
