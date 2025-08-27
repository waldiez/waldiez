# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,too-few-public-methods
"""Group manager agent configuration processor."""

from typing import Callable, Optional

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezGroupManager,
    WaldiezModel,
    WaldiezTransitionTarget,
)

from ...core import (
    CodeExecutionConfig,
    GroupManagerExtras,
    GroupManagerStrategy,
    SystemMessageConfig,
    TerminationConfig,
    get_agent_llm_config_arg,
)


class GroupManagerProcessor:
    """Processes group manager configurations."""

    def __init__(
        self,
        agent: WaldiezAgent,
        initial_chats: list[WaldiezAgentConnection],
        group_chat_members: list[WaldiezAgent],
        agent_names: dict[str, str],
        model_names: dict[str, str],
        all_models: list[WaldiezModel],
        serializer: Callable[..., str],
        cache_seed: Optional[int] = None,
    ):
        """Initialize the group manager processor.

        Parameters
        ----------
        agent : WaldiezAgent
            The group manager agent to process.
        initial_chats : list[WaldiezAgentConnection]
            The initial chats to process for the group manager.
        group_chat_members : list[WaldiezAgent]
            The members of the group chat.
        agent_names : dict[str, str]
            Mapping of agent IDs to their names.
        model_names : dict[str, str]
            Mapping of model IDs to their names.
        all_models : list[WaldiezModel]
            List of all models available for the agent.
        serializer : Callable[..., str]
            Function to serialize data into a string format.
        cache_seed : Optional[int], optional
            Seed for caching purposes, by default None.
        """
        self.agent = agent
        self.initial_chats = initial_chats
        self.group_chat_members = group_chat_members
        self.agent_names = agent_names
        self.model_names = model_names
        self.all_models = all_models
        self.serializer = serializer
        self.cache_seed = cache_seed

    def process(
        self,
        code_execution_config: Optional[CodeExecutionConfig] = None,
        termination_config: Optional[TerminationConfig] = None,
        system_message_config: Optional[SystemMessageConfig] = None,
    ) -> GroupManagerExtras:
        """Process group manager and return extras.

        Parameters
        ----------
        code_execution_config : CodeExecutionConfig, optional
            Configuration for code execution, by default None.
        termination_config : TerminationConfig, optional
            Configuration for termination, by default None.
        system_message_config : SystemMessageConfig, optional
            Configuration for system messages, by default None.

        Returns
        -------
        GroupManagerExtras
            The processed group manager extras containing configuration.
        """
        extras = GroupManagerExtras(
            instance_id=self.agent.id,
            code_execution_config=code_execution_config,
            termination_config=termination_config,
            system_message_config=system_message_config,
        )

        # Determine strategy based on initial chats and message types
        extras.strategy = self._determine_strategy()

        if extras.strategy == GroupManagerStrategy.PATTERN:
            self._process_pattern_strategy(extras)
        else:
            self._process_traditional_strategy(extras)

        return extras

    @staticmethod
    def is_pattern_strategy(
        initial_chats: list[WaldiezAgentConnection],
    ) -> bool:
        """Check if the group manager should use pattern strategy.

        Parameters
        ----------
        initial_chats : list[WaldiezAgentConnection]
            The initial chats to determine the strategy.

        Returns
        -------
        bool
            True if pattern strategy should be used, False otherwise.
        """
        if not initial_chats:
            return True

        first_chat = initial_chats[0]["chat"]
        return (
            isinstance(first_chat.data.message, str)
            or not first_chat.data.message.is_method()
        )

    def _determine_strategy(self) -> GroupManagerStrategy:
        """Determine which strategy to use for this group manager."""
        if self.is_pattern_strategy(self.initial_chats):
            # Use AG2 Pattern system
            return GroupManagerStrategy.PATTERN

        # Method call - must use traditional approach
        return GroupManagerStrategy.TRADITIONAL

    def _process_pattern_strategy(self, extras: GroupManagerExtras) -> None:
        """Process using AG2 Pattern system."""
        extras.pattern_class_name = self._get_pattern_class_name()

        # Add required imports
        extras.pattern_imports.add(
            "from autogen.agentchat.group.patterns import "
            f"{extras.pattern_class_name}"
        )

        # Get user agent if applicable
        user_agent = None
        if self.initial_chats:
            user_agent = self.initial_chats[0]["source"]

        # Generate pattern definition
        extras.pattern_definition = self._generate_pattern_definition(
            extras.pattern_class_name, user_agent
        )

        # Add context variables if present
        if self.agent.data.context_variables:
            ctx_lines = self._generate_context_variables()
            if ctx_lines:
                extras.context_variables_content = (
                    "    context_variables=ContextVariables(data={\n"
                    + "\n".join(ctx_lines)
                    + "\n    })"
                )
            extras.pattern_imports.add(
                "from autogen.agentchat.group import ContextVariables"
            )

        # Add after work configuration if needed
        if self._should_check_for_after_work(extras.pattern_class_name):
            after_work_arg, extra_import = self._get_after_work_configuration()
            if after_work_arg:
                extras.after_work_content = after_work_arg
            if extra_import:
                extras.pattern_imports.add(extra_import)

    def _process_traditional_strategy(self, extras: GroupManagerExtras) -> None:
        """Process using traditional GroupChat + GroupChatManager."""
        if not self.initial_chats:
            return

        user_agent = self.initial_chats[0]["source"]
        group_members = self.group_chat_members
        if user_agent not in group_members:
            group_members.append(user_agent)
        admin_name = self.agent_names[user_agent.id]

        # Generate group chat definition
        group_chat_content = self._generate_group_chat_definition(
            group_members, admin_name
        )

        extras.group_chat_definition = group_chat_content["definition"]
        extras.group_chat_name = group_chat_content["name"]
        extras.custom_speaker_selection = group_chat_content["custom_selection"]

        # Generate group chat argument for agent constructor
        if extras.group_chat_name:
            extras.group_chat_argument = f"groupchat={extras.group_chat_name}"

    def _get_pattern_class_name(self) -> str:
        """Get the appropriate pattern class name."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return "AutoPattern"
        selection_method = self.agent.data.speakers.selection_method

        pattern_map = {
            "auto": "AutoPattern",
            "manual": "ManualPattern",
            "round_robin": "RoundRobinPattern",
            "random": "RandomPattern",
            "default": "DefaultPattern",
        }

        return pattern_map.get(selection_method, "AutoPattern")

    def _generate_pattern_definition(
        self, pattern_class: str, user_agent: Optional[WaldiezAgent]
    ) -> str:
        """Generate the pattern definition string."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return ""
        manager_name = self.agent_names[self.agent.id]
        initial_agent_name = self.agent_names[self.agent.data.initial_agent_id]
        agents_string = ", ".join(
            self.agent_names[agent.id] for agent in self.group_chat_members
        )

        pattern_lines = [
            f"{manager_name}_pattern = {pattern_class}(",
            f"    initial_agent={initial_agent_name},",
            f"    agents=[{agents_string}],",
        ]

        if user_agent:
            pattern_lines.append(
                f"    user_agent={self.agent_names[user_agent.id]},"
            )

        # Add LLM config
        llm_config_arg = get_agent_llm_config_arg(
            agent=self.agent,
            all_models=self.all_models,
            model_names=self.model_names,
            cache_seed=self.cache_seed,
            as_dict=True,
        )
        pattern_lines.append(
            f"    group_manager_args={{\n{llm_config_arg}    }},"
        )

        # Add context variables if present
        if self.agent.data.context_variables:
            # Generate context variables lines
            ctx_lines = self._generate_context_variables()
            if ctx_lines:
                pattern_lines.extend(
                    [
                        "    context_variables=ContextVariables(data={",
                        *ctx_lines,
                        "    }),",
                    ]
                )

        # Add after work if applicable
        if self._should_check_for_after_work(pattern_class):
            after_work_arg, _ = self._get_after_work_configuration()
            if after_work_arg:
                pattern_lines.append(f"    group_after_work={after_work_arg},")

        pattern_lines.append(")")

        return "\n" + "\n".join(pattern_lines)

    def _generate_group_chat_definition(
        self, group_members: list[WaldiezAgent], admin_name: str
    ) -> dict[str, str]:
        """Generate traditional group chat definition."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return {}
        agent_name = self.agent_names[self.agent.id]
        group_chat_name = f"{agent_name}_group_chat"

        group_members_str = ", ".join(
            self.agent_names[member.id] for member in group_members
        )

        lines = [
            f"{group_chat_name} = GroupChat(",
            f"    agents=[{group_members_str}],",
            f"    enable_clear_history={self.agent.data.enable_clear_history},",
            f"    send_introductions={self.agent.data.send_introductions},",
            "    messages=[],",
        ]

        if self.agent.data.max_round > 0:
            lines.append(f"    max_round={self.agent.data.max_round},")

        # Add admin name
        admin = self.agent.data.admin_name or admin_name
        lines.append(f'    admin_name="{admin}",')

        # Add speakers configuration
        speakers_config, custom_selection = (
            self._generate_speakers_configuration()
        )
        lines.extend(speakers_config)

        lines.append(")")

        return {
            "definition": "\n" + "\n".join(lines) + "\n",
            "name": group_chat_name,
            "custom_selection": custom_selection or "",
        }

    def _generate_context_variables(
        self,
    ) -> list[str]:
        """Generate context variables for the group manager agent."""
        ctx_lines: list[str] = []
        for key, value in self.agent.data.context_variables.items():
            if isinstance(value, str):
                ctx_lines.append(f'        "{key}": "{value}",')
            else:
                ctx_lines.append(f'        "{key}": {value},')
        return ctx_lines

    def _generate_speakers_configuration(
        self,
    ) -> tuple[list[str], Optional[str]]:
        """Generate speakers configuration for traditional group chat."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return [], None
        config_lines: list[str] = []
        custom_function = None

        speakers = self.agent.data.speakers

        # Max retries
        if speakers.max_retries_for_selecting is not None:
            config_lines.append(
                "    max_retries_for_selecting_speaker="
                f"{speakers.max_retries_for_selecting},"
            )

        # Selection method
        if speakers.selection_method != "custom":
            selection_method = speakers.selection_method
            if selection_method == "default":
                # this only on pattern based group chats :(
                selection_method = "auto"
            config_lines.append(
                f'    speaker_selection_method="{selection_method}",'
            )
        else:
            # Custom selection method
            agent_name = self.agent_names[self.agent.id]
            custom_function, function_name = (
                speakers.get_custom_method_function(name_suffix=agent_name)
            )
            config_lines.append(
                f"    speaker_selection_method={function_name},"
            )

        # Selection mode configurations
        if speakers.selection_mode == "repeat":
            config_lines.extend(self._generate_repeat_configuration())
        elif speakers.selection_mode == "transition":
            config_lines.extend(self._generate_transition_configuration())

        # Clean up None values
        config_lines = [line.replace('"None"', "None") for line in config_lines]

        return config_lines, custom_function

    def _generate_repeat_configuration(self) -> list[str]:
        """Generate repeat selection configuration."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return []
        lines: list[str] = []
        allow_repeat = self.agent.data.speakers.allow_repeat

        if isinstance(allow_repeat, bool):
            lines.append(f"    allow_repeat_speaker={allow_repeat},")
        else:
            # List of agent names
            agent_names = ", ".join(
                self.agent_names[agent_id] for agent_id in allow_repeat
            )
            lines.append(f"    allow_repeat=[{agent_names}],")

        return lines

    def _generate_transition_configuration(self) -> list[str]:
        """Generate transition selection configuration."""
        if not isinstance(self.agent, WaldiezGroupManager):
            return []
        lines: list[str] = []

        if not self.agent.data.speakers.allowed_or_disallowed_transitions:
            return lines

        # Convert agent IDs to names in transitions
        transitions_dict = {}
        for (
            agent_id,
            transitions,
        ) in self.agent.data.speakers.allowed_or_disallowed_transitions.items():
            agent_name = self.agent_names[agent_id]
            transition_names = [self.agent_names[tid] for tid in transitions]
            transitions_dict[agent_name] = transition_names

        # Serialize transitions
        transitions_str = self.serializer(transitions_dict, tabs=1)
        transitions_str = transitions_str.replace('"', "").replace("'", "")

        lines.extend(
            [
                "    allowed_or_disallowed_speaker_transitions="
                f"{transitions_str},",
                '    speaker_transitions_type="'
                f'"{self.agent.data.speakers.transitions_type}",',
            ]
        )

        return lines

    # noinspection PyMethodMayBeStatic
    def _should_check_for_after_work(self, pattern_class: str) -> bool:
        """Check if pattern should have after work configuration."""
        return pattern_class not in ["ManualPattern", "AutoPattern"]

    def _get_after_work_configuration(self) -> tuple[str, str]:
        """Get after work target configuration."""
        if not self.agent.data.after_work:
            return "", ""

        return self._get_transition_target(self.agent.data.after_work)

    # noinspection PyTypeHints
    def _get_transition_target(
        self, target: WaldiezTransitionTarget
    ) -> tuple[str, str]:
        """Get transition target configuration and import."""
        import_prefix = "from autogen.agentchat.group"

        target_map = {
            "TerminateTarget": (
                "TerminateTarget()",
                f"{import_prefix} import TerminateTarget",
            ),
            "AskUserTarget": (
                "AskUserTarget()",
                f"{import_prefix} import AskUserTarget",
            ),
            "RevertToUserTarget": (
                "RevertToUserTarget()",
                f"{import_prefix} import RevertToUserTarget",
            ),
            "StayTarget": (
                "StayTarget()",
                f"{import_prefix} import StayTarget",
            ),
            "GroupManagerTarget": (
                "GroupManagerTarget()",
                f"{import_prefix}.targets.group_manager_target "
                "import GroupManagerTarget",
            ),
        }

        if target.target_type in target_map:
            return target_map[target.target_type]

        # Special cases
        if target.target_type == "AgentTarget":
            target_name = self.agent_names[target.value[0]]
            return (
                f"AgentTarget(agent={target_name})",
                f"{import_prefix} import AgentTarget",
            )

        if target.target_type == "RandomAgentTarget":
            target_names = [
                self.agent_names[agent_id] for agent_id in target.value
            ]
            if not target_names:
                target_names = [
                    self.agent_names[agent.id]
                    for agent in self.group_chat_members
                ]
            target_names_str = ", ".join(target_names)
            return (
                f"RandomAgentTarget(agents=[{target_names_str}])",
                f"{import_prefix}.targets.transition_target "
                "import RandomAgentTarget",
            )

        return "", ""
