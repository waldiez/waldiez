# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Base exporter class to be inherited by all exporters."""

import abc
from typing import Any, Optional, TypedDict, Union

from .agent_position import AgentPosition
from .export_position import ExportPosition
from .import_position import ImportPosition


# flake8: noqa: E501,B027
# pylint: disable=line-too-long
class ExporterReturnType(TypedDict):
    """Exporter Return Type.

    Attributes
    ----------
    content : Optional[str]
        The exported content.
    imports : Optional[list[tuple[str, ImportPosition]]]
        The additional imports required for the exported content.
    environment_variables : Optional[list[tuple[str, str]]]
        The environment variables to set.
    before_export : Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
        The exported content before the main export and its position.
    after_export : Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
        The exported content after the main export and its position.
    """

    content: Optional[str]
    imports: Optional[list[tuple[str, ImportPosition]]]
    environment_variables: Optional[list[tuple[str, str]]]
    before_export: Optional[
        list[tuple[str, Union[ExportPosition, AgentPosition]]]
    ]
    after_export: Optional[
        list[tuple[str, Union[ExportPosition, AgentPosition]]]
    ]


class BaseExporter(abc.ABC):
    """Base exporter."""

    @abc.abstractmethod
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the exporter.

        Parameters
        ----------
        *args : Any
            The positional arguments.
        **kwargs : Any
            The keyword arguments.
        """
        raise NotImplementedError("Method not implemented.")

    def get_environment_variables(self) -> Optional[list[tuple[str, str]]]:
        """Get the environment variables to set.

        Returns
        -------
        Optional[Set[tuple[str, str]]]
            The environment variables to set if any.
        """

    def get_imports(self) -> Optional[list[tuple[str, ImportPosition]]]:
        """Generate the imports string for the exporter.

        Returns
        -------
        Optional[tuple[str, ImportPosition]]
            The exported imports and the position of the imports.
        """

    def get_before_export(
        self,
    ) -> Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content before the main export.

        Returns
        -------
        Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content before the main export and its position.
        """

    def generate(
        self,
    ) -> Optional[str]:
        """Generate the main export.

        Returns
        -------
        str
            The exported content.
        """

    def get_after_export(
        self,
    ) -> Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content after the main export.

        Returns
        -------
        Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content after the main export and its position.
        """

    @abc.abstractmethod
    def export(self) -> ExporterReturnType:
        """Export the content.

        Returns
        -------
        ExporterReturnType
            The exported content.
        """
