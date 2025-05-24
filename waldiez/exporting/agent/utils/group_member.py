# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
"""Get the extras for a group_member agent."""

from typing import Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentUpdateSystemMessage,
    WaldiezChat,
    WaldiezContextBasedCondition,
    WaldiezContextBasedTransition,
    WaldiezLLMBasedCondition,
    WaldiezLLMBasedTransition,
    WaldiezTransitionTarget,
)


def get_group_member_extras(
    agent: WaldiezAgent,
    agent_names: dict[str, str],
    tool_names: dict[str, str],
    chats: tuple[list[WaldiezChat], dict[str, str]],
    is_async: bool,
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
) -> tuple[str, str, str]:
    """Get the extras of a group_member agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent to get the extras for.
    agent_names : dict[str, str]
        A mapping of agent IDs to agent names.
    tool_names : dict[str, str]
        A mapping of skill IDs to skill names.
    chats : tuple[list[WaldiezChat], dict[str, str]]
        The list of all chats and the mapping of chat IDs to chat names.
    is_async : bool
        Whether the chat is asynchronous.
    serializer : Callable[..., str]
        The serializer to get the string representation of an object.
    string_escape : Callable[[str], str]
        The function to escape the string quotes and newlines.

    Returns
    -------
    tuple[str, str, str]
        The extras of the group_member agent:
        the content before the agent (like the function definitions),
        the extra argument(s) for the agent initialization,
        and the content after the agent (like the handoff registrations).
    """
    args_string = ""
    before_agent = ""
    after_agent = ""
    if not agent.is_group_member:
        return args_string, before_agent, after_agent
    args_string = get_function_arg(agent, tool_names)
    before_reply = get_update_agent_state_before_reply_arg(
        agent=agent,
        agent_names=agent_names,
        tool_names=tool_names,
        string_escape=string_escape,
    )
    args_string += before_reply[0]
    before_agent += before_reply[1]
    before_registration, after_agent = get_agent_handoff_registrations(
        agent=agent,
        agent_names=agent_names,
        all_chats=chats[0],
        chat_names=chats[1],
        is_async=is_async,
        serializer=serializer,
        string_escape=string_escape,
    )
    before_agent += before_registration
    return before_agent, args_string, after_agent


def get_function_arg(
    agent: WaldiezAgent,
    tool_names: dict[str, str],
) -> str:
    """Get the function argument of a group_member agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The group_member agent to get the function argument for.
    tool_names : dict[str, str]
        A mapping of skill IDs to skill names.

    Returns
    -------
    str
        The function argument of the group_member agent.
    """
    tab = "    "
    arg_string = f"{tab}functions=["
    added_tools = False
    for tool in agent.data.tools:
        tool_name = tool_names[tool.id]
        if tool_name:
            arg_string += "\n" + f"{tab}{tab}{tool_name},"
            added_tools = True
    if added_tools:
        arg_string += "\n" + tab
    arg_string += "],\n"
    return arg_string


def get_update_agent_state_before_reply_arg(
    agent: WaldiezAgent,
    agent_names: dict[str, str],
    tool_names: dict[str, str],
    string_escape: Callable[[str], str],
) -> tuple[str, str]:
    """Get the update_agent_state_before_reply argument of a group_member agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The group_member agent to get the argument for.
    agent_names : dict[str, str]
        A mapping of agent IDs to agent names.
    tool_names : dict[str, str]
        A mapping of skill IDs to skill names.
    string_escape : Callable[[str], str]
        The function to escape the string quotes and newlines.

    Returns
    -------
    tuple[str, str]
        The update_agent_state_before_reply argument of the group_member agent
        and the content before the agent if any.
    """
    tab = "    "
    before_agent = ""
    arg_string = f"{tab}update_agent_state_before_reply=["
    added_functions = False
    # pylint: disable=line-too-long
    for function in agent.data.update_agent_state_before_reply:
        if isinstance(function, WaldiezAgentUpdateSystemMessage):
            added_functions = True
            if function.type == "callable":
                function_content, function_name = function.get_content(
                    name_suffix=agent_names[agent.id],
                )
                arg_string += (
                    "\n" + f"{tab}{tab}UpdateSystemMessage({function_name}),"
                )
                before_agent += "\n" + function_content + "\n"
            else:
                escaped_function = string_escape(function.content)
                arg_string += (
                    "\n"
                    + f'{tab}{tab}UpdateSystemMessage("{escaped_function}"),'
                )
        else:
            tool_name = tool_names.get(function, "")
            if tool_name:
                added_functions = True
                arg_string += "\n" + f"{tab}{tab}{tool_name},"
    if added_functions:
        arg_string = arg_string + "\n" + tab
    arg_string += "],\n"
    return arg_string, before_agent


# pylint: disable=too-many-locals
def get_agent_handoff_registrations(
    agent: WaldiezAgent,
    agent_names: dict[str, str],
    all_chats: list[WaldiezChat],
    chat_names: dict[str, str],
    is_async: bool,
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
) -> tuple[str, str]:
    """Get the agent handoff registrations of a group_member agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The group_member agent to get the agent handoff registrations for.
    agent_names : dict[str, str]
        A mapping of agent IDs to agent names.
    all_chats : list[WaldiezChat]
        The list of all chats.
    chat_names : dict[str, str]
        A mapping of chat IDs to chat names.
    is_async : bool
        Whether the chat is asynchronous.
    serializer : Callable[..., str]
        The serializer to get the string representation of an object.
    string_escape : Callable[[str], str]
        The function to escape the string quotes and newlines.

    Returns
    -------
    tuple[str, str]
        the contents before and after the agent.
    """
    before_content = ""
    after_content = ""
    if not agent.handoffs:
        return before_content, after_content
    agent_name = agent_names.get(agent.id, f"agent_{agent.id}")
    handoff_lines: list[str] = []

    for handoff in agent.data.handoffs:
        handoff_registrations: list[str] = []

        # Process LLM conditions
        if handoff.llm_transitions:
            llm_transitions = get_agent_llm_transitions(
                agent_name=agent_name,
                llm_based_transitions=handoff.llm_transitions,
                agent_names=agent_names,
                chat_names=chat_names,
                serializer=serializer,
                string_escape=string_escape,
            )
            if llm_transitions:
                # handoff_registrations.append(llm_transitions[0])
                handoff_registrations.extend(llm_transitions[1])

        # Process context conditions
        if handoff.context_transitions:
            context_transitions = get_agent_context_transitions(
                agent_name=agent_name,
                context_based_transitions=handoff.context_transitions,
                agent_names=agent_names,
                chat_names=chat_names,
                string_escape=string_escape,
                serializer=serializer,
            )
            if context_transitions:
                handoff_registrations.extend(context_transitions)

        # Process after_work
        if handoff.after_work:
            target_str = _get_target_string(
                handoff.after_work, agent_names, chat_names
            )
            registration = f"""    # Set the default after-work transition
    {agent_name}.handoffs.set_after_work({target_str})"""
            handoff_registrations.append(registration)

        if handoff_registrations:
            handoff_lines.extend(handoff_registrations)

    if handoff_lines:
        after_content = "\n".join(handoff_lines)

    return before_content, after_content


def get_agent_llm_transitions(
    agent_name: str,
    llm_based_transitions: list[WaldiezLLMBasedTransition],
    agent_names: dict[str, str],
    chat_names: dict[str, str],
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
) -> list[str]:
    """Get the LLM conditions of a group_member agent.

    Parameters
    ----------
    agent_name : str
        The name of the agent.
    llm_based_transitions : list[WaldiezLLMBasedTransition]
        The LLM-based conditions to get the registrations for.
    agent_names : dict[str, str]
        A mapping of agent IDs to agent names.
    chat_names : dict[str, str]
        A mapping of chat IDs to chat names.
    serializer : Callable[..., str]
        The serializer to get the string representation of an object.
    string_escape : Callable[[str], str]
    The function to escape the string quotes and newlines.

    Returns
    -------
    tuple[list[str], list[str]]
        The LLM conditions and the extra registrations.
    """
    registrations: list[str] = []
    condition_strings: list[str] = []
    for llm_transition in llm_based_transitions:
        target_str = _get_target_string(
            llm_transition.target, agent_names, chat_names
        )
        condition_str = _get_llm_transition_string(
            llm_transition.condition, string_escape, serializer
        )

        condition_strings.append(
            f"""        OnCondition(
        target={target_str},
        condition={condition_str}
    )"""
        )
    if condition_strings:
        conditions_str = ",\n".join(condition_strings)
        registration = f"""    # Set up LLM-based handoffs for {agent_name}
    {agent_name}.handoffs.add_llm_transitions([
{conditions_str}
    ])"""
        registrations.append(registration)
    return registrations


def get_agent_context_transitions(
    agent_name: str,
    context_based_transitions: list[WaldiezContextBasedTransition],
    agent_names: dict[str, str],
    chat_names: dict[str, str],
    string_escape: Callable[[str], str],
    serializer: Callable[..., str],
) -> list[str]:
    """Get the context conditions of a group_member agent.

    Parameters
    ----------
    agent_name : str
        The name of the agent.
    context_based_transitions : list[WaldiezContextBasedTransition]
        The context-based conditions to get the registrations for.
    agent_names : dict[str, str]
        A mapping of agent IDs to agent names.
    chat_names : dict[str, str]
        A mapping of chat IDs to chat names.
    string_escape : Callable[[str], str]
        The function to escape the string quotes and newlines.
    serializer : Callable[..., str]
        The serializer to get the string representation of an object.

    Returns
    -------
    list[str]
        The context conditions registrations for the agent.
    """
    registrations: list[str] = []
    for condition in context_based_transitions:
        target_str = _get_target_string(
            condition.target, agent_names, chat_names
        )
        condition_str = _get_context_condition_string(
            condition.condition, string_escape, serializer
        )

        registation = f"""    # Set up context-based handoffs for {agent_name}
    {agent_name}.handoffs.add_context_condition(
        OnContextCondition(
            target={target_str},
            condition={condition_str}
        )
    )"""
        registrations.append(registation)
    return registrations


def _get_llm_transition_string(
    condition: WaldiezLLMBasedCondition,
    string_escape: Callable[[str], str],
    serializer: Callable[..., str],
) -> str:
    """Generate the condition string for an LLM condition."""
    if condition.condition_type == "string_llm":
        prompt = string_escape(condition.prompt)
        if hasattr(condition, "data") and condition.data:
            data_str = serializer(condition.data)
            return f'StringLLMCondition(prompt="{prompt}", data={data_str})'
        return f'StringLLMCondition(prompt="{prompt}")'

    if condition.condition_type == "context_str_llm":
        context_str = string_escape(condition.context_str)
        if hasattr(condition, "data") and condition.data:
            data_str = serializer(condition.data)
            return (
                f'ContextStrLLMCondition(context_str="{context_str}", '
                f"data={data_str})"
            )
        return f'ContextStrLLMCondition(context_str="{context_str}")'
    raise ValueError(f"Unknown LLM condition type: {condition.condition_type}")


def _get_context_condition_string(
    condition: WaldiezContextBasedCondition,
    string_escape: Callable[[str], str],
    serializer: Callable[..., str],
) -> str:
    """Generate the condition string for a context condition."""
    if condition.condition_type == "string_context":
        variable_name = string_escape(condition.variable_name)
        return f'StringContextCondition(variable_name="{variable_name}")'

    if condition.condition_type == "expression_context":
        expression = string_escape(condition.expression)
        if hasattr(condition, "data") and condition.data:
            data_str = serializer(condition.data)
            return (
                "ExpressionContextCondition(expression=ContextExpression("
                f'"{expression}"), data={data_str})'
            )
        return (
            "ExpressionContextCondition(expression=ContextExpression("
            f'"{expression}"))'
        )

    raise ValueError(
        f"Unknown context condition type: {condition.condition_type}"
    )


def _get_target_string(
    target: WaldiezTransitionTarget,
    agent_names: dict[str, str],
    chat_names: dict[str, str],
) -> str:
    """Generate the target string for a transition target."""
    target_string: str = ""

    if target.target_type == "AgentTarget":
        agent_name = agent_names.get(target.value, f"agent_{target.value}")
        target_string = f"AgentTarget({agent_name})"
    elif target.target_type == "RandomAgentTarget":
        agent_vars = [
            agent_names.get(agent_id, f"agent_{agent_id}")
            for agent_id in target.value
        ]
        agents_str = ", ".join(agent_vars)
        target_string = f"RandomAgentTarget([{agents_str}])"
    elif target.target_type == "GroupChatTarget":
        chat_name = chat_names.get(target.value, f"chat_{target.value}")
        target_string = f"GroupChatTarget({chat_name})"
    elif target.target_type == "NestedChatTarget":
        chat_name = chat_names.get(target.value, f"chat_{target.value}")
        target_string = f"NestedChatTarget({chat_name})"
    elif target.target_type == "AskUserTarget":
        target_string = "AskUserTarget()"
    elif target.target_type == "GroupManagerTarget":
        target_string = "GroupManagerTarget()"
    elif target.target_type == "RevertToUserTarget":
        target_string = "RevertToUserTarget()"
    elif target.target_type == "StayTarget":
        target_string = "StayTarget()"
    elif target.target_type == "TerminateTarget":
        target_string = "TerminateTarget()"
    else:
        raise ValueError(
            f"Unknown target type: {target.target_type} for target {target}"
        )
    return target_string
