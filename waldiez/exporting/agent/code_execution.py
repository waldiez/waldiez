# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods,no-self-use
"""Code execution processor for Waldiez agents."""

import json

from typing_extensions import Literal

from waldiez.models import WaldiezAgent, WaldiezAgentCodeExecutionConfig

from ..core import CodeExecutionConfig, ImportPosition, ImportStatement


class CodeExecutionProcessor:
    """Processor for code execution configuration."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_name: str,
        tool_names: dict[str, str],
    ):
        self.agent = agent
        self.agent_name = agent_name
        self.tool_names = tool_names

    def process(self) -> CodeExecutionConfig:
        """Process code execution configuration.

        Returns
        -------
        CodeExecutionConfig
            The processed code execution configuration.
        """
        if self.agent.data.code_execution_config is False:
            return CodeExecutionConfig(
                executor_content="",
                executor_argument="False",
                executor_import=None,
            )

        config = self.agent.data.code_execution_config
        use_docker = (
            config.use_docker if config.use_docker is not None else False
        )

        executor_class = self._get_executor_class_name(use_docker)
        executor_content = self._build_executor_content(config, use_docker)
        executor_arg = f'{{"executor": {self.agent_name}_executor}}'
        executor_import = f"from autogen.coding import {executor_class}"

        return CodeExecutionConfig(
            executor_content=executor_content,
            executor_argument=executor_arg,
            executor_import=ImportStatement(
                statement=executor_import,
                position=ImportPosition.THIRD_PARTY,
            ),
        )

    # noinspection PyMethodMayBeStatic
    def _get_executor_class_name(self, use_docker: bool) -> str:
        """Get the appropriate executor class name."""
        return (
            "DockerCommandLineCodeExecutor"
            if use_docker
            else "LocalCommandLineCodeExecutor"
        )

    def _build_executor_content(
        self,
        config: WaldiezAgentCodeExecutionConfig | Literal[False],
        use_docker: bool,
    ) -> str:
        """Build the executor content string."""
        if config is False:
            return ""
        executor_class = self._get_executor_class_name(use_docker)
        lines = [f"{self.agent_name}_executor = {executor_class}("]

        # Add work directory
        if config.work_dir:
            lines.append(f"    work_dir={json.dumps(config.work_dir)},")

        # Add timeout
        if config.timeout:
            lines.append(f"    timeout={int(config.timeout)},")

        # Add functions (only for local executor)
        if not use_docker and config.functions:
            function_names = self._get_function_names(config.functions)
            if function_names:
                function_names_str = ", ".join(function_names)
                lines.append(f"    functions=[{function_names_str}],")

        lines.append(")")
        lines.append("")  # Add empty line

        return "\n".join(lines)

    def _get_function_names(self, function_ids: list[str]) -> list[str]:
        """Get function names from function IDs.

        Parameters
        ----------
        function_ids : list[str]
            List of function IDs to resolve names for.

        Returns
        -------
        list[str]
            List of function names corresponding to the provided IDs.
        """
        function_names: list[str] = []
        for tool_id in function_ids:
            if tool_id in self.tool_names:
                tool_name = self.tool_names[tool_id]
                if tool_name:
                    function_names.append(tool_name)
        return function_names
