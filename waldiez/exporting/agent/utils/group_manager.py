# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Export group manager and group chat to string."""

from typing import Callable, Dict, List, Optional, Tuple

from waldiez.models import WaldiezAgent, WaldiezGroupManager


def get_group_manager_extras(
    agent: WaldiezAgent,
    group_chat_members: List[WaldiezAgent],
    agent_names: Dict[str, str],
    serializer: Callable[..., str],
) -> Tuple[str, str]:
    """Get the group manager extra string and custom selection method if any.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    group_chat_members : List[WaldiezAgent]
        The group members.
    agent_names : Dict[str, str]
        The agent names.
    serializer : Callable[..., str]
        The serializer function.

    Returns
    -------
    Tuple[str, str]
        The content before the agent string and the group chat argument.
    """

    group_chat_arg = ""
    before_agent_string = ""
    custom_speaker_selection: Optional[str] = None
    if agent.agent_type == "manager" and isinstance(agent, WaldiezGroupManager):
        group_chat_string, group_chat_name, custom_speaker_selection = (
            _get_group_manager_extras(
                agent=agent,
                group_members=group_chat_members,
                agent_names=agent_names,
                serializer=serializer,
            )
        )
        if group_chat_name:
            group_chat_arg = "\n" + f"    groupchat={group_chat_name},"
        if custom_speaker_selection:
            before_agent_string += f"{custom_speaker_selection}" + "\n"
        if group_chat_string:
            before_agent_string += group_chat_string
    return before_agent_string, group_chat_arg


def _get_group_manager_extras(
    agent: WaldiezGroupManager,
    group_members: List[WaldiezAgent],
    agent_names: Dict[str, str],
    serializer: Callable[..., str],
) -> Tuple[str, str, Optional[str]]:
    """Get the group manager extra string and custom selection method if any.

    Parameters
    ----------
    agent : WaldiezGroupManager
        The agent.
    group_members : List[WaldiezAgent]
        The group members.
    agent_names : Dict[str, str]
        The agent names.
    serializer : Callable[..., str]
        The serializer function.

    Returns
    -------
    str
        The group chat definition string.
    str
        The group chat name.
    Optional[str]
        The custom selection method name and content if any.
    """
    agent_name = agent_names[agent.id]
    group_chat_name = f"{agent_name}_group_chat"
    group_members_str = ", ".join(
        agent_names[member.id] for member in group_members
    )
    group_chat_string = "\n" + f"{group_chat_name} = GroupChat(" + "\n"
    group_chat_string += f"    agents=[{group_members_str}]," + "\n"
    group_chat_string += (
        f"    enable_clear_history={agent.data.enable_clear_history}," + "\n"
    )
    group_chat_string += (
        f"    send_introductions={agent.data.send_introductions}," + "\n"
    )
    group_chat_string += "    messages=[]," + "\n"
    if agent.data.max_round is not None:
        group_chat_string += f"    max_round={agent.data.max_round}," + "\n"
    if agent.data.admin_name:
        group_chat_string += f'    admin_name="{agent.data.admin_name}",' + "\n"
    extra_group_chat_string, custom_selection_method = (
        _get_group_chat_speakers_string(agent, agent_names, serializer)
    )
    group_chat_string += extra_group_chat_string
    group_chat_string += ")\n\n"
    return group_chat_string, group_chat_name, custom_selection_method


def _get_group_chat_speakers_string(
    agent: WaldiezGroupManager,
    agent_names: Dict[str, str],
    serializer: Callable[..., str],
) -> Tuple[str, Optional[str]]:
    """Get the group chat speakers string.

    Parameters
    ----------
    agent : WaldiezGroupManager
        The agent.
    agent_names : Dict[str, str]
        The agent names.
    serializer : Callable[..., str]
        The serializer function.

    Returns
    -------
    str
        The group chat speakers string.
    Optional[str]
        The custom custom for speaker selection if any.
    """
    speakers_string = ""
    function_content: Optional[str] = None
    if agent.data.speakers.max_retries_for_selecting is not None:
        speakers_string += (
            "    max_retries_for_selecting_speaker="
            f"{agent.data.speakers.max_retries_for_selecting},"
            "\n"
        )
    if agent.data.speakers.selection_method != "custom":
        speakers_string += (
            "    speaker_selection_method="
            f'"{agent.data.speakers.selection_method}",'
            "\n"
        )
    else:
        agent_name = agent_names[agent.id]
        function_content, function_name = (
            agent.data.speakers.get_custom_method_function(
                name_suffix=agent_name
            )
        )
        speakers_string += (
            f"    speaker_selection_method={function_name}," + "\n"
        )
    # selection_mode == "repeat":
    if agent.data.speakers.selection_mode == "repeat":
        speakers_string += _get_speakers_selection_repeat_string(
            agent, agent_names
        )
    # selection_mode == "transition":
    if (
        agent.data.speakers.selection_mode == "transition"
        and agent.data.speakers.allowed_or_disallowed_transitions
    ):
        speakers_string += _get_speakers_selection_transition_string(
            agent=agent,
            agent_names=agent_names,
            serializer=serializer,
        )
    speakers_string = speakers_string.replace('"None"', "None")
    return speakers_string, function_content


def _get_speakers_selection_repeat_string(
    agent: WaldiezGroupManager, agent_names: Dict[str, str]
) -> str:
    speakers_string = ""
    if isinstance(agent.data.speakers.allow_repeat, bool):
        speakers_string += (
            f"    allow_repeat_speaker={agent.data.speakers.allow_repeat},"
            + "\n"
        )
    elif isinstance(agent.data.speakers.allow_repeat, list):
        # get the names of the agents
        allow_repeat = ", ".join(
            agent_names[agent_id]
            for agent_id in agent.data.speakers.allow_repeat
        )
        speakers_string += f"    allow_repeat=[{allow_repeat}]," + "\n"
    return speakers_string


def _get_speakers_selection_transition_string(
    agent: WaldiezGroupManager,
    agent_names: Dict[str, str],
    serializer: Callable[..., str],
) -> str:
    speakers_string = ""
    allowed_or_disallowed_speaker_transitions = {}
    for (
        agent_id,
        transitions,
    ) in agent.data.speakers.allowed_or_disallowed_transitions.items():
        allowed_or_disallowed_speaker_transitions[agent_names[agent_id]] = [
            agent_names[transition] for transition in transitions
        ]
    transitions_string = serializer(
        allowed_or_disallowed_speaker_transitions, 1
    )
    transitions_string = transitions_string.replace('"', "").replace("'", "")
    speakers_string += (
        "    allowed_or_disallowed_speaker_transitions="
        f"{transitions_string}," + "\n"
    )
    speakers_string += (
        "    speaker_transitions_type="
        f'"{agent.data.speakers.transitions_type}",' + "\n"
    )
    return speakers_string
