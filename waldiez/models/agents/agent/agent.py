# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Base agent class to be inherited by all agents."""

import warnings
from typing import List, Set

from pydantic import Field, field_validator
from typing_extensions import Annotated, Literal

from ....models.common import WaldiezBase, now
from .agent_data import WaldiezAgentData
from .agent_type import WaldiezAgentType
from .code_execution import WaldiezAgentCodeExecutionConfig


class WaldiezAgent(WaldiezBase):
    """Waldiez Agent.

    Attributes
    ----------
    id : str
        The ID of the agent.
    type : Literal["agent"]
        The type of the "node" in a graph: "agent"
    agent_type : WaldiezAgentType
        The type of the agent
    name: str
        The name of the agent.
    description : str
        The description of the agent.
    tags : List[str]
        Tags for this agent.
    requirements : List[str]
        Python requirements for the agent.
    created_at : str
        The date and time when the agent was created.
    updated_at : str
        The date and time when the agent was last updated.
    data: WaldiezAgentData
        The data (properties) of this agent.
        See `waldiez.models.agents.WaldiezAgentData` for more info.

    Functions
    ---------
    validate_linked_skills(skill_ids: List[str], agent_ids: List[str])
        Validate the skills linked to the agent.
    validate_linked_models(model_ids: List[str])
        Validate the models linked to the agent.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The agents unique id")
    ]
    type: Annotated[
        Literal["agent"],
        Field(
            "agent",
            title="Type",
            description="The type of the 'node' in a graph.",
        ),
    ]
    agent_type: Annotated[
        WaldiezAgentType,
        Field(
            ...,
            title="Agent type",
            description=(
                "The type of the agent: user_proxy, assistant, group manager, "
                "rag_user_proxy or reasoning"
            ),
        ),
    ]
    name: Annotated[
        str, Field(..., title="Name", description="The name of the agent")
    ]
    description: Annotated[
        str,
        Field(
            "Agent's description",
            title="Description",
            description="The description of the agent",
        ),
    ]
    tags: Annotated[
        List[str],
        Field(
            title="Tags",
            description="Tags of the agent",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        List[str],
        Field(
            title="Requirements",
            description="Python requirements for the agent",
            default_factory=list,
        ),
    ]
    created_at: Annotated[
        str,
        Field(
            title="Created at",
            description="The date and time when the agent was created",
            default_factory=now,
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            title="Updated at",
            description="The date and time when the agent was last updated",
            default_factory=now,
        ),
    ]
    data: Annotated[
        WaldiezAgentData,
        Field(
            title="Data",
            description="The data (properties) of the agent",
            default_factory=WaldiezAgentData,
        ),
    ]

    @field_validator("agent_type")
    @classmethod
    def validate_agent_type(cls, v: WaldiezAgentType) -> WaldiezAgentType:
        """Validate the agent type.

        Parameters
        ----------
        v : WaldiezAgentType
            The agent type.

        Returns
        -------
        WaldiezAgentType
            The validated agent type.

        Raises
        ------
        ValueError
            If the agent type is not valid.
        """

        def _get_warning_message(old_type: str, new_type: str) -> str:
            return (
                f"The agent type '{old_type}' is deprecated. "
                f"Use '{new_type}' instead."
            )

        if v == "user":
            warnings.warn(
                _get_warning_message("user", "user_proxy"),
                DeprecationWarning,
                stacklevel=2,
            )
            return "user_proxy"
        if v == "rag_user":
            warnings.warn(
                _get_warning_message("rag_user", "rag_user_proxy"),
                DeprecationWarning,
                stacklevel=2,
            )
            return "rag_user_proxy"
        return v

    @property
    def ag2_class(self) -> str:
        """Return the AG2 class of the agent."""
        class_name = "ConversableAgent"
        if self.agent_type == "assistant":
            if getattr(self.data, "is_multimodal", False) is True:
                class_name = "MultimodalConversableAgent"
            else:
                class_name = "AssistantAgent"
        if self.agent_type in ("user", "user_proxy"):
            class_name = "UserProxyAgent"
        if self.agent_type in ("rag_user", "rag_user_proxy"):
            class_name = "RetrieveUserProxyAgent"
        if self.agent_type == "reasoning":
            class_name = "ReasoningAgent"
        if self.agent_type == "captain":
            class_name = "CaptainAgent"
        return class_name

    @property
    def ag2_imports(self) -> Set[str]:
        """Return the AG2 imports of the agent."""
        agent_class = self.ag2_class
        imports = {"import autogen"}
        if agent_class == "AssistantAgent":
            imports.add("from autogen import AssistantAgent")
        elif agent_class == "UserProxyAgent":
            imports.add("from autogen import UserProxyAgent")
        elif agent_class == "GroupChatManager":
            imports.add("from autogen import GroupChatManager")
        elif agent_class == "RetrieveUserProxyAgent":
            imports.add(
                "from autogen.agentchat.contrib.retrieve_user_proxy_agent "
                "import RetrieveUserProxyAgent"
            )
        elif agent_class == "MultimodalConversableAgent":
            imports.add(
                "from autogen.agentchat.contrib.multimodal_conversable_agent "
                "import MultimodalConversableAgent"
            )
        elif agent_class == "ReasoningAgent":
            imports.add(
                "from autogen.agents.experimental import ReasoningAgent"
            )
        elif agent_class == "CaptainAgent":
            imports.add(
                "from autogen.agentchat.contrib.captainagent "
                "import CaptainAgent"
            )
        else:  # pragma: no cover
            imports.add("import ConversableAgent")
        return imports

    def validate_linked_skills(
        self, skill_ids: List[str], agent_ids: List[str]
    ) -> None:
        """Validate the skills.

        Parameters
        ----------
        skill_ids : List[str]
            The list of skill IDs.
        agent_ids : List[str]
            The list of agent IDs.

        Raises
        ------
        ValueError
            If a skill or agent is not found
        """
        # if the config dict has skills, make sure they can be found
        for skill in self.data.skills:
            if skill.id not in skill_ids:
                raise ValueError(
                    f"Skill '{skill.id}' not found in agent's {self.id} skills"
                )
            if skill.executor_id not in agent_ids:
                raise ValueError(
                    f"Agent '{skill.executor_id}' not found in agents"
                )

    def validate_linked_models(self, model_ids: List[str]) -> None:
        """Validate the models.

        Parameters
        ----------
        model_ids : List[str]
            The list of model IDs.

        Raises
        ------
        ValueError
            If a model is not found
        """
        # if the config dict has models, make sure they can be found
        for model in self.data.model_ids:
            if model not in model_ids:
                raise ValueError(
                    f"Model '{model}' not found in agent's {self.id} models"
                )

    def validate_code_execution(self, skill_ids: List[str]) -> None:
        """Validate the code execution config.

        Parameters
        ----------
        skill_ids : List[str]
            The list of skill IDs.

        Raises
        ------
        ValueError
            If a function is not found
        """
        # if the config dict has functions, make sure they can be found
        if isinstance(
            self.data.code_execution_config, WaldiezAgentCodeExecutionConfig
        ):
            for function in self.data.code_execution_config.functions:
                if function not in skill_ids:
                    raise ValueError(
                        f"Function '{function}' not found in skills"
                    )
