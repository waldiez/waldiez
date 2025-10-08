# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,too-few-public-methods
"""Group member agent configuration processor."""

from dataclasses import dataclass, field
from typing import Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentUpdateSystemMessage,
    WaldiezChat,
)

from ...core import (
    ImportStatement,
    InstanceArgument,
)
from .handoffs import HandoffProcessor


@dataclass
class GroupMemberProcessorResult:
    """Result from processing group member agent configuration."""

    before_agent: str = ""
    after_agent: str = ""
    extra_arguments: list[InstanceArgument] = field(  # pyright: ignore
        default_factory=list,
    )
    extra_imports: set[ImportStatement] = field(  # pyright: ignore
        default_factory=set,
    )


class GroupMemberAgentProcessor:
    """Processor for group member agent configuration."""

    result: GroupMemberProcessorResult

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        tool_names: dict[str, str],
        all_chats: list[WaldiezChat],
        chat_names: dict[str, str],
        serializer: Callable[..., str],
    ) -> None:
        self.agent = agent
        self.agent_names = agent_names
        self.tool_names = tool_names
        self.all_chats = all_chats
        self.chat_names = chat_names
        self.serializer = serializer

    def process(
        self,
    ) -> GroupMemberProcessorResult:
        """Process group member agent configuration.

        Returns
        -------
        GroupMemberProcessorResult
            The processed result containing before_agent code,
            after_agent code, and extra imports.
        """
        self.result = GroupMemberProcessorResult()
        if not self.agent.is_group_member:
            return self.result
        if not self.agent.is_doc_agent:
            self._process_agent_functions()
            self._process_agent_update_state_before_reply()
        self._process_handoff_registrations()
        return self.result

    def _process_agent_functions(self) -> None:
        """Process function arguments for the agent."""
        tab = "    "
        arg_string = "["

        tools_added = self._add_tools()
        if tools_added:
            arg_string += f"{tools_added}\n{tab}"

        arg_string += "]"
        self.result.extra_arguments.append(
            InstanceArgument(
                name="functions",
                value=arg_string,
                instance_id=self.agent.id,
                tabs=1,
            )
        )

    def _add_tools(self) -> str:
        """Add tools to the function arguments."""
        tab = "    "
        arg_string = ""
        for tool in self.agent.data.tools:
            tool_name = self.tool_names.get(tool.id)
            if tool_name:
                arg_string += f"\n{tab}{tab}{tool_name},"
        return arg_string

    def _process_agent_update_state_before_reply(self) -> None:
        """Process agent update state before reply configuration."""
        tab = "    "
        arg_string = "["

        arg_content = self._process_update_functions()

        if arg_content:
            arg_string += f"{arg_content}\n{tab}"
            self.result.extra_imports.add(
                ImportStatement("from autogen import UpdateSystemMessage")
            )
        arg_string += "]"
        self.result.extra_arguments.append(
            InstanceArgument(
                name="update_agent_state_before_reply",
                value=arg_string,
                instance_id=self.agent.id,
                tabs=1,
            )
        )

    def _process_update_functions(
        self,
    ) -> str:
        """Process individual update functions."""
        arg_content = ""

        for function in self.agent.data.update_agent_state_before_reply:
            if isinstance(function, WaldiezAgentUpdateSystemMessage):
                arg_content = self._process_system_message_update(function)
            else:
                arg_content = self._process_tool_update(function)

        return arg_content

    def _process_system_message_update(
        self,
        function: WaldiezAgentUpdateSystemMessage,
    ) -> str:
        """Process system message update function."""
        tab = "    "
        space = tab * 2
        if function.type == "callable":
            content, name = function.get_content(
                name_suffix=self.agent_names[self.agent.id]
            )
            arg_string = f"\n{space}UpdateSystemMessage({name}),"
            self.result.before_agent += content + "\n"
        else:
            dumped = self.serializer(function.content)
            arg_string = f"\n{space}UpdateSystemMessage({dumped}),"
        return arg_string

    def _process_tool_update(
        self,
        function_id: str,
    ) -> str:
        """Process tool-based update function."""
        tool_name = self.tool_names.get(function_id)
        if tool_name:
            tab = "    "
            return f"\n{tab}{tab}{tool_name},"
        return ""

    def _process_handoff_registrations(self) -> None:
        """Process handoff registrations for the agent."""
        result = HandoffProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            chat_names=self.chat_names,
            all_chats=self.all_chats,
            serializer=self.serializer,
        ).process()
        for extra_import in result.extra_imports:
            self.result.extra_imports.add(ImportStatement(extra_import))
        self.result.after_agent += result.after_agent
