# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals
"""Export group manager and group chat to string."""

from typing import Callable, Optional, Set, Tuple

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezGroupManager,
    WaldiezTransitionTarget,
)
from waldiez.models.model.model import WaldiezModel

_IMPORT_PREFIX = "from autogen.agentchat.group"


def get_group_manager_extras(
    agent: WaldiezAgent,
    initial_chats: list[WaldiezAgentConnection],
    group_chat_members: list[WaldiezAgent],
    agent_names: dict[str, str],
    model_names: dict[str, str],
    serializer: Callable[..., str],
    all_models: list[WaldiezModel],
    llm_config_getter: Callable[
        [
            WaldiezAgent,
            list[WaldiezModel],
            dict[str, str],
            Optional[int],
            Optional[bool],
        ],
        str,
    ],
    cache_seed: Optional[int] = None,
) -> Tuple[str, str, Set[str]]:
    """Get the group manager extras.

    The content before, the group chat argument (if any) and the
    additional imports (if pattern is used).

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    initial_chats : list[tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]
        The initial chats.
    group_chat_members : list[WaldiezAgent]
        The group members.
    agent_names : dict[str, str]
        The agent names.
    model_names : dict[str, str]
        The model names.
    serializer : Callable[..., str]
        The serializer function.
    all_models : list[WaldiezModel]
        The list of all models.
    llm_config_getter : Callable[
            [
                WaldiezAgent,
                list[WaldiezModel],
                dict[str, str],
                Optional[int],
                Optional[bool],
            ],
            str,
        ]
        The function to get the llm config.
    cache_seed : Optional[int], optional
        The cache seed, by default None

    Returns
    -------
    Tuple[str, str, Set[str]]
        The content before the agent string, the group chat argument
        and the additional imports (if pattern is used).
    """
    if not isinstance(agent, WaldiezGroupManager):
        # we are not dealing with a group manager
        # we can use the group pattern (ag2 creates a manager automatically)
        return "", "", set()
    if not initial_chats:
        # no chat from user to manager,
        # we use the group pattern(ag2 creates a manager automatically)
        pattern, extra_imports = _get_group_manager_pattern(
            group_chat_members=group_chat_members,
            manager=agent,
            agent_names=agent_names,
            all_models=all_models,
            model_names=model_names,
            llm_config_getter=llm_config_getter,
            cache_seed=cache_seed,
        )
        return pattern, "", extra_imports
    first_chat_params = initial_chats[0]
    first_chat = first_chat_params["chat"]
    if (
        isinstance(first_chat.data.message, str)
        or first_chat.data.message.type != "method"
    ):
        # we do have a user but we can still use the group pattern:
        # result, context, last_agent = initiate_group_chat(
        #     pattern=pattern,
        #     messages=...,  # the fist chat message (not a method)
        #     max_rounds=10
        # )
        pattern, extra_imports = _get_group_manager_pattern(
            group_chat_members=group_chat_members,
            manager=agent,
            agent_names=agent_names,
            model_names=model_names,
            user=first_chat_params["source"],
            all_models=all_models,
            llm_config_getter=llm_config_getter,
            cache_seed=cache_seed,
        )
        return pattern, "", extra_imports
    # else, we cannot use the group pattern (we cannot have as message a method)
    # we need to create a group chat and a manager and start the chat like:
    # user.initiate_chat(manager, ...)  # we can use a method here
    group_chat_arg = ""
    before_agent_string = ""
    custom_speaker_selection: Optional[str] = None
    user_agent = first_chat_params["source"]
    group_chat_string, group_chat_name, custom_speaker_selection = (
        _get_group_manager_extras(
            agent=agent,
            group_members=group_chat_members + [user_agent],
            agent_names=agent_names,
            admin_name=agent_names[user_agent.id],
            serializer=serializer,
        )
    )
    if group_chat_name:
        group_chat_arg = "\n" + f"    groupchat={group_chat_name},"
    if custom_speaker_selection:
        before_agent_string += f"{custom_speaker_selection}" + "\n"
    if group_chat_string:
        before_agent_string += group_chat_string
    return before_agent_string, group_chat_arg, set()


def _get_group_manager_pattern(
    manager: WaldiezGroupManager,
    group_chat_members: list[WaldiezAgent],
    agent_names: dict[str, str],
    all_models: list[WaldiezModel],
    model_names: dict[str, str],
    llm_config_getter: Callable[
        [
            WaldiezAgent,
            list[WaldiezModel],
            dict[str, str],
            Optional[int],
            Optional[bool],
        ],
        str,
    ],
    user: Optional[WaldiezAgent] = None,
    cache_seed: Optional[int] = None,
) -> tuple[str, Set[str]]:
    """Get the group manager pattern.

    Parameters
    ----------
    manager : WaldiezGroupManager
        The group manager.
    group_chat_members : list[WaldiezAgent]
        The group members.
    agent_names : dict[str, str]
        The agent id to name mapping.
    all_models : list[WaldiezModel]
        The list of all models.
    model_names : dict[str, str]
        The model id to name mapping.
    llm_config_getter : Callable[
        [
            WaldiezAgent,
            list[WaldiezModel],
            dict[str, str],
            Optional[int],
            Optional[bool],
        ],
        str,
    ]
        The function to get the llm config.
    cache_seed : Optional[int], optional
        The cache seed, by default None
    user : Optional[WaldiezAgent], optional
        The user agent, by default None
    chat : Optional[WaldiezChat], optional
        The chat from the user to the manager, by default None

    Returns
    -------
    str
        The group manager pattern definition string.
    """
    # possible arguments (ag2's base Pattern class):
    #   initial_agent: "ConversableAgent",
    #   agents: list["ConversableAgent"],
    #   user_agent: Optional["ConversableAgent"] = None,
    #   group_manager_args: Optional[dict[str, Any]] = None,
    #   context_variables: Optional[ContextVariables] = None,
    #   exclude_transit_message: bool = True,
    #   summary_method: Optional[Union[str, Callable[..., Any]]] = "last_msg",
    #
    #   group_after_work: Optional[TransitionTarget] = None,
    #     this is used only if the pattern is not:
    #   -  a "ManualPattern" (group_after_work = AskUserTarget())
    #   -  an "AutoPattern" (
    #         group_manager_after_work = \
    #           GroupManagerTarget(selection_message=selection_message)
    #    otherwise it defaults to "TerminateTarget()"

    #  AutoPattern specific:
    #  selection_message: Optional[GroupManagerSelectionMessage] = None,
    #
    # ag2 example:
    #     pattern = AutoPattern(
    #     initial_agent=triage_agent,  # Agent that starts the conversation
    #     agents=[triage_agent, tech_agent, general_agent],
    #     user_agent=user,
    #     group_manager_args={"llm_config": llm_config}
    # )
    pattern_class_name = _get_group_pattern_class_name(manager)
    extra_imports = {
        f"from autogen.agentchat.group.patterns import {pattern_class_name}"
    }
    manager_name = agent_names[manager.id]
    initial_agent_name = agent_names[manager.data.initial_agent_id]
    agents_string = ", ".join(
        agent_names[agent.id] for agent in group_chat_members
    )
    pattern_string = "\n" + f"{manager_name}_pattern = "
    pattern_string += f"{pattern_class_name}(" + "\n"
    pattern_string += f"    initial_agent={initial_agent_name}," + "\n"
    pattern_string += f"    agents=[{agents_string}]," + "\n"
    if user:
        pattern_string += f"    user_agent={agent_names[user.id]}," + "\n"
    llm_config_arg = llm_config_getter(
        manager,
        all_models,
        model_names,
        cache_seed,
        True,
    )
    pattern_string += f"    group_manager_args={{\n{llm_config_arg}    }},\n"
    if should_check_for_after_work(pattern_class_name):
        after_work_arg, extra_import = get_group_after_work_arg(
            manager,
            agent_names=agent_names,
            group_chat_members=group_chat_members,
        )
        if extra_import:
            extra_imports.add(extra_import)
        if after_work_arg:
            pattern_string += f"    group_after_work={after_work_arg}," + "\n"
    if manager.data.context_variables:
        ctx_string = ""
        for key, value in manager.data.context_variables.items():
            if isinstance(value, str):
                ctx_string += f'        "{key}": "{value}",' + "\n"
            else:
                ctx_string += f'        "{key}": {value},' + "\n"
        pattern_string += "    context_variables=ContextVariables(data={\n"
        pattern_string += ctx_string
        pattern_string += "    }),\n"
    pattern_string += ")"
    return pattern_string, extra_imports


def should_check_for_after_work(
    pattern_class_name: str,
) -> bool:
    """Check if the pattern class name should check for after work.

    Parameters
    ----------
    pattern_class_name : str
        The pattern class name.

    Returns
    -------
    bool
        True if the pattern class name should check for after work,
        False otherwise.
    """
    return pattern_class_name not in [
        "ManualPattern",
        "AutoPattern",
    ]


def get_group_after_work_arg(
    manager: WaldiezGroupManager,
    agent_names: dict[str, str],
    group_chat_members: list[WaldiezAgent],
) -> tuple[str, str]:
    """Get the group after work argument and additional import if any.

    Parameters
    ----------
    manager : WaldiezGroupManager
        The group manager.
    agent_names : dict[str, str]
        The agent names.
    group_chat_members : list[WaldiezAgent]
        The group members.

    Returns
    -------
    tuple[str, str]
        The group after work argument and additional import if any.
    """
    empty: tuple[str, str] = ("", "")
    after_work_handoffs = [
        entry for entry in manager.data.handoffs if entry.after_work
    ]
    if not after_work_handoffs:
        return empty
    after_work_transition = after_work_handoffs[0].after_work
    if not after_work_transition:
        return empty
    return get_after_work_target(
        after_work_transition, agent_names, group_chat_members
    )


# pylint: disable=too-many-return-statements
def get_after_work_target(
    target: WaldiezTransitionTarget,
    agent_names: dict[str, str],
    group_chat_members: list[WaldiezAgent],
) -> tuple[str, str]:
    """Get the after work target and additional import if any.

    Parameters
    ----------
    target : WaldiezTransitionTarget
        The target.
    agent_names : dict[str, str]
        The agent names.
    group_chat_members : list[WaldiezAgent]
        The group members.

    Returns
    -------
    tuple[str, str]
        The after work target and additional import if any.
    """
    if target.target_type == "TerminateTarget":
        return "TerminateTarget()", f"{_IMPORT_PREFIX} import TerminateTarget"
    if target.target_type == "AskUserTarget":
        return "AskUserTarget()", f"{_IMPORT_PREFIX} import AskUserTarget"
    if target.target_type == "AgentTarget":
        target_name = agent_names[target.value]
        return (
            f"AgentTarget(agent={target_name})",
            f"{_IMPORT_PREFIX} import AgentTarget",
        )
    if target.target_type == "RevertToUserTarget":
        return (
            "RevertToUserTarget()",
            f"{_IMPORT_PREFIX} import RevertToUserTarget",
        )
    if target.target_type == "StayTarget":
        return "StayTarget()", f"{_IMPORT_PREFIX} import StayTarget"
    if target.target_type == "GroupManagerTarget":
        to_import = (
            f"{_IMPORT_PREFIX}.targets.group_manager_target "
            "import GroupManagerTarget"
        )
        return ("GroupManagerTarget()", to_import)
    if target.target_type == "RandomAgentTarget":
        to_import = (
            f"{_IMPORT_PREFIX}.targets.transition_target "
            "import RandomAgentTarget"
        )
        target_names = [agent_names[agent_id] for agent_id in target.value]
        if not target_names:
            target_names = [
                agent_names[agent.id] for agent in group_chat_members
            ]
        target_names_str = ", ".join(target_names)
        return (
            f"RandomAgentTarget(agents=[{target_names_str}])",
            to_import,
        )
    # No sub-group or nested chat targets for now
    # if target.target_type == "NestedChatTarget":
    #     ...
    # if target.target_type == "GroupChatTarget":
    #     ...
    return "", ""


def _get_group_pattern_class_name(manger: WaldiezGroupManager) -> str:
    """Get the group pattern class name.

    Parameters
    ----------
    manager : WaldiezGroupManager
        The group manager.

    Returns
    -------
    str
        The group pattern class name.
    """
    if manger.data.speakers.selection_method == "auto":
        return "AutoPattern"
    if manger.data.speakers.selection_method == "manual":
        return "ManualPattern"
    if manger.data.speakers.selection_method == "round_robin":
        return "RoundRobinPattern"
    if manger.data.speakers.selection_method == "random":
        return "RandomPattern"
    if manger.data.speakers.selection_method == "default":
        return "DefaultPattern"
    # no "custom" for pattern
    # (this is only used if we don't use patterns for group chats)
    return "AutoPattern"


def _get_group_manager_extras(
    agent: WaldiezGroupManager,
    group_members: list[WaldiezAgent],
    agent_names: dict[str, str],
    admin_name: str,
    serializer: Callable[..., str],
) -> Tuple[str, str, Optional[str]]:
    """Get the group manager extra string and custom selection method if any.

    Parameters
    ----------
    agent : WaldiezGroupManager
        The agent.
    group_members : list[WaldiezAgent]
        The group members.
    agent_names : dict[str, str]
        The agent names.
    admin_name : str
        The admin name.
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
    if agent.data.max_round > 0:
        group_chat_string += f"    max_round={agent.data.max_round}," + "\n"
    if agent.data.admin_name:
        group_chat_string += f'    admin_name="{agent.data.admin_name}",' + "\n"
    else:
        group_chat_string += f'    admin_name="{admin_name}",' + "\n"
    extra_group_chat_string, custom_selection_method = (
        _get_group_chat_speakers_string(agent, agent_names, serializer)
    )
    group_chat_string += extra_group_chat_string
    group_chat_string += ")\n\n"
    return group_chat_string, group_chat_name, custom_selection_method


def _get_group_chat_speakers_string(
    agent: WaldiezGroupManager,
    agent_names: dict[str, str],
    serializer: Callable[..., str],
) -> Tuple[str, Optional[str]]:
    """Get the group chat speakers string.

    Parameters
    ----------
    agent : WaldiezGroupManager
        The agent.
    agent_names : dict[str, str]
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
    agent: WaldiezGroupManager, agent_names: dict[str, str]
) -> str:
    speakers_string = ""
    if isinstance(agent.data.speakers.allow_repeat, bool):
        speakers_string += (
            f"    allow_repeat_speaker={agent.data.speakers.allow_repeat},"
            + "\n"
        )
    else:
        # get the names of the agents
        allow_repeat = ", ".join(
            agent_names[agent_id]
            for agent_id in agent.data.speakers.allow_repeat
        )
        speakers_string += f"    allow_repeat=[{allow_repeat}]," + "\n"
    return speakers_string


def _get_speakers_selection_transition_string(
    agent: WaldiezGroupManager,
    agent_names: dict[str, str],
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
