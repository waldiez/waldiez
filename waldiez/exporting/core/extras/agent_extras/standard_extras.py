# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,no-self-use
"""Standard agent extras module."""

from dataclasses import dataclass

from ...enums import AgentPosition, ExportPosition
from ...result import ExportResult
from ...types import ImportStatement, InstanceArgument
from ..base import BaseExtras


@dataclass
class TerminationConfig:
    """Termination configuration."""

    termination_arg: str = "None"
    before_content: str = ""

    def has_content(self) -> bool:
        """Check if there's any termination content.

        Returns
        -------
        bool
            True if there's any termination configuration.
        """
        return bool(self.before_content.strip())


@dataclass
class CodeExecutionConfig:
    """Code execution configuration."""

    executor_content: str = ""
    executor_argument: str = "False"
    executor_import: ImportStatement | None = None

    def has_content(self) -> bool:
        """Check if there's any code execution content.

        Returns
        -------
        bool
            True if there's any code execution configuration.
        """
        return bool(
            self.executor_content.strip()
            or self.executor_argument != "False"
            or self.executor_import
        )


@dataclass
class SystemMessageConfig:
    """System message configuration."""

    # in case we support later custom methods for system messages
    before_agent_conent: str = ""
    system_message_arg: str = ""

    def has_content(self) -> bool:
        """Check if there's any system message content.

        Returns
        -------
        bool
            True if there's any system message configuration.
        """
        return bool(str(self.system_message_arg).strip())


@dataclass
class StandardExtras(BaseExtras):
    """Extras for standard agents (UserProxy, Assistant, etc.)."""

    code_execution_config: CodeExecutionConfig | None = None
    termination_config: TerminationConfig | None = None
    system_message_config: SystemMessageConfig | None = None

    def set_code_execution(self, config: CodeExecutionConfig) -> None:
        """Set code execution configuration.

        Parameters
        ----------
        config : CodeExecutionConfig
            The code execution configuration.
        """
        self.code_execution_config = config
        if config.executor_import:
            self.add_import(config.executor_import)
        # we either add the executor content here or
        # in _contribute_specific_content below
        if config.executor_content:
            self.append_before_agent(config.executor_content)

    def set_termination_config(self, config: TerminationConfig) -> None:
        """Set termination configuration.

        Parameters
        ----------
        config : TerminationConfig
            The termination configuration.
        """
        self.termination_config = config
        if config.before_content:
            self.append_before_agent(config.before_content)

    def set_system_message_config(self, config: SystemMessageConfig) -> None:
        """Set system message configuration.

        Parameters
        ----------
        config : SystemMessageConfig
            The system message configuration.
        """
        self.system_message_config = config
        if config.before_agent_conent:
            self.append_before_agent(config.before_agent_conent)

    def get_code_execution_arg(self) -> InstanceArgument:
        """Get the code execution argument string.

        Returns
        -------
        InstanceArgument
            The code execution argument.
        """
        if (
            self.code_execution_config
            and self.code_execution_config.executor_argument
        ):
            argunent = self.code_execution_config.executor_argument
        else:
            argunent = "False"
        return InstanceArgument(
            instance_id=self.instance_id,
            name="code_execution_config",
            value=argunent,
            skip_trailing_comma=True,
            tabs=1,
        )

    def get_termination_arg(self) -> InstanceArgument:
        """Get the termination argument.

        Returns
        -------
        InstanceArgument
            The termination argument.
        """
        if self.termination_config and self.termination_config.termination_arg:
            argument = self.termination_config.termination_arg
        else:
            argument = "None"
        return InstanceArgument(
            instance_id=self.instance_id,
            name="is_termination_msg",
            value=argument,
            tabs=1,
        )

    def get_system_message_arg(self) -> InstanceArgument:
        """Get the system message argument.

        Returns
        -------
        InstanceArgument
            The system message argument.
        """
        if (
            self.system_message_config
            and self.system_message_config.system_message_arg
        ):
            argument = self.system_message_config.system_message_arg
        else:
            argument = ""
        return InstanceArgument(
            instance_id=self.instance_id,
            name="system_message",
            value=argument,
            skip_if_empty_string=True,
            with_new_line_before=False,
            skip_trailing_comma=True,
            tabs=1,
        )

    def has_specific_content(self) -> bool:
        """Check for standard agent specific content.

        Returns
        -------
        bool
            True if there's standard agent specific content.
        """
        return bool(
            self.extra_args
            or (
                self.code_execution_config
                and self.code_execution_config.has_content()
            )
            or (
                self.termination_config
                and self.termination_config.has_content()
            )
            or (
                self.system_message_config
                and self.system_message_config.has_content()
            )
        )

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute standard agent specific content.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        if self.extra_args:
            result.add_content(
                self.get_extra_args_content(),
                position=ExportPosition.AGENTS,
                agent_position=AgentPosition.AS_ARGUMENT,
                agent_id=self.instance_id,
            )
        # content added above
        # alternatively, we could add it here
        # (but we should pay attention with the order)
        # if (
        #     self.code_execution_config
        #     and self.code_execution_config.has_content()
        # ):
        #     result.add_content(
        #         self.code_execution_config.executor_content,
        #         position=ExportPosition.AGENTS,
        #         agent_position=AgentPosition.BEFORE,
        #         order=ContentOrder.EARLY_SETUP,
        #         agent_id=self.instance_id,
        #     )
        #     if self.code_execution_config.executor_import:
        #    \statement = self.code_execution_config.executor_import.statement
        #         position = self.code_execution_config.executor_import.position
        #         result.add_import(
        #             statement=statement,
        #             position=position,
        #         )
        # if self.termination_config and self.termination_config.has_content():
        #     result.add_content(
        #         self.termination_config.before_content,
        #         position=ExportPosition.AGENTS,
        #         agent_position=AgentPosition.BEFORE,
        #         agent_id=self.instance_id,
        #     )
        # for extra_import in self.extra_imports:
        #     result.add_import(
        #         statement=extra_import.statement,
        #         position=extra_import.position,
        #     )
