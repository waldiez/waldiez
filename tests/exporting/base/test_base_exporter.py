# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.base.BaseExporter."""

from typing import Any, Optional, Union

import pytest

from waldiez.exporting.base import (
    BaseExporter,
    ExporterReturnType,
    ExportPosition,
)
from waldiez.exporting.base.agent_position import AgentPosition, AgentPositions


# pylint: disable=unused-argument
class DummyExporter(BaseExporter):
    """Dummy exporter."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the exporter.

        Parameters
        ----------
        *args
            The positional arguments.

        **kwargs
            The keyword arguments.
        """

    def get_before_export(
        self,
    ) -> Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Get before export.

        Returns
        -------
        Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The before export.
        """
        # we expect an error here
        # if AFTER, we need an agent
        return [("logging", AgentPosition(None, AgentPositions.AFTER))]

    def export(self) -> ExporterReturnType:
        """Export.

        Returns
        -------
        ExporterReturnType
            The exported content.
        """
        result: ExporterReturnType = {
            "content": "content",
            "imports": None,
            "environment_variables": None,
            "before_export": self.get_before_export(),
            "after_export": None,
        }
        return result


class DummyExporter2(BaseExporter):
    """Dummy exporter."""

    # pylint: disable=useless-super-delegation
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the exporter.

        Parameters
        ----------
        *args
            The positional arguments.

        **kwargs
            The keyword arguments.
        """
        super().__init__(*args, **kwargs)  # type: ignore

    def export(self) -> ExporterReturnType:
        """Export.

        Returns
        -------
        ExporterReturnType
            The exported content.
        """
        result: ExporterReturnType = {
            "content": "content",
            "imports": None,
            "environment_variables": None,
            "before_export": None,
            "after_export": None,
        }
        return result


def test_abstract_init() -> None:
    """Test abstract init."""
    with pytest.raises(TypeError):
        # pylint: disable=abstract-class-instantiated
        BaseExporter()  # type: ignore


def test_not_implemented() -> None:
    """Test not implemented."""
    with pytest.raises(NotImplementedError):
        DummyExporter2()


def test_init_subclass() -> None:
    """Test init subclass."""
    DummyExporter()


def test_invalid_get_before_export() -> None:
    """Test invalid get_before_export."""
    with pytest.raises(ValueError):
        DummyExporter().get_before_export()
