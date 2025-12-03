# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Waldiez tool for Waldiez (like inception or sth)."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class WaldiezFlowToolImpl(PredefinedTool):
    """Perplexity AI search tool for Waldiez."""

    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {}
    kwarg_types: dict[str, type] = {
        "flow": str,
    }

    @property
    def name(self) -> str:
        """Tool name."""
        return "waldiez_flow"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Run a complete waldiez flow as tool."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["waldiez"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["waldiez"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from waldiez import WaldiezRunner",
        ]

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """Validate secrets and return list of missing required ones.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        Returns
        -------
        list[str]
            List of missing required secrets.
        """
        return []

    # noinspection DuplicatedCode
    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """Validate keyword arguments and return list of missing required ones.

        Parameters
        ----------
        kwargs : dict[str, Any]
            Dictionary of keyword arguments.

        Returns
        -------
        list[str]
            List of missing required keyword arguments.
        """
        for key, value in self.kwargs.items():
            if key in kwargs:
                type_of = self.kwarg_types.get(key, str)
                # pylint: disable=broad-exception-caught
                # noinspection PyBroadException,TryExceptPass
                try:
                    casted = type_of(value)
                    if key in self.kwargs:
                        self.kwargs[key] = casted
                except Exception:
                    pass
        return []

    # pylint: disable=unused-argument
    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Get the content of the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.
        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            Content of the tool.
        """
        is_async_flow = (
            runtime_kwargs.get("is_async", "False")
            if runtime_kwargs
            else "False"
        )
        is_async = str(is_async_flow).lower().strip() == "true"
        the_def = "async def" if is_async else "def"
        content = f'''
{the_def} {self.name}(flow: str | Path | None = None, env_path: str | None = None) -> list[str] | list[dict[str, Any]] | str:
    """Run a waldiez flow and return its results.

    Args:
        flow: The path of te flow to run.
        env_path: Optional path to file with environment variables to use for the flow.

    Returns:
        list[str] | list[dict[str, Any]] | str: The flow results.

    Raises:
        FileNotFoundError: If the flow path cannot be resolved.
        RuntimeError: If running the flow fails.
    """
    from waldiez import WaldiezRunner
    import os

    if not flow:
        flow = "{self.kwargs.get("flow")}"
    if not flow or not os.path.exists(flow):
        raise FileNotFoundError("Invalid flow path")
'''
        content += """
    try:
        runner = WaldiezRunner.load(flow, dot_env=env_path)
"""
        if is_async:
            content += """
        results = await runner.a_run()
"""
        else:
            content += """
        results = runner.run()
"""
        content += """
        return results
    except BaseException as error:
        print(error)
        raise RuntimeError(str(error)) from error
"""
        return content


# pylint: disable=invalid-name
WaldiezFlowTool = WaldiezFlowToolImpl()
WaldiezFlowConfig = PredefinedToolConfig(
    name=WaldiezFlowTool.name,
    description=WaldiezFlowTool.description,
    required_secrets=WaldiezFlowTool.required_secrets,
    required_kwargs=WaldiezFlowTool.required_kwargs,
    requirements=WaldiezFlowTool.requirements,
    tags=WaldiezFlowTool.tags,
    implementation=WaldiezFlowTool,
)
