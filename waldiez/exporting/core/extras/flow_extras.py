# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,too-many-instance-attributes
# flake8: noqa: E501
"""Flow specific extras module."""

from dataclasses import dataclass, field

from waldiez.utils import get_waldiez_version

from ..result import ExportResult
from ..types import ExportConfig
from .base import BaseExtras


@dataclass
class FlowExtras(BaseExtras):
    """Extras for flow exporter."""

    # Flow metadata
    flow_name: str = ""
    description: str = ""
    config: ExportConfig = field(default_factory=ExportConfig)
    version: str = field(default_factory=get_waldiez_version)

    # Sub-exporter results
    tools_result: ExportResult | None = None
    models_result: ExportResult | None = None
    agents_result: ExportResult | None = None
    chats_result: ExportResult | None = None

    # Generated script parts
    header_content: str = ""
    main_function: str = ""
    after_run: str = ""
    execution_code: str = ""

    def has_specific_content(self) -> bool:
        """Check if the flow extras contain specific content.

        Returns
        -------
        bool
            True if any specific content is present, False otherwise.
        """
        return bool(
            self.flow_name
            or self.description
            or self.version
            or self.tools_result
            or self.models_result
            or self.agents_result
            or self.chats_result
            or self.header_content
            or self.main_function
            or self.execution_code
        )
