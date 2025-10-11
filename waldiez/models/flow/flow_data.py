# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright:  reportArgumentType=false

"""Waldiez flow data."""

from typing import Any

from pydantic import Field, model_validator
from typing_extensions import Annotated, Self

from ..agents import (
    WaldiezAgents,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
)
from ..chat import (
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
)
from ..common import (
    WaldiezBase,
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
    now,
)
from ..model import WaldiezModel
from ..tool import WaldiezTool


class WaldiezFlowData(WaldiezBase):
    """Flow data class.

    Attributes
    ----------
    nodes : list[dict[str, Any]]
        The nodes of the flow. We ignore this (UI-related)
    edges : list[dict[str, Any]]
        The edges of the flow. We ignore this (UI-related)
    viewport : dict[str, Any]
        The viewport of the flow. We ignore this (UI-related)
    agents : WaldiezAgents
        The agents of the flow:
        users: list[WaldiezUserProxy]
        assistants: list[WaldiezAssistant]
        managers: list[WaldiezGroupManager]
        rag_users : list[WaldiezRagUserProxy]
        See `WaldiezAgents` for more info.
    models : list[WaldiezModel]
        The models of the flow. See `WaldiezModel`.
    tools : list[WaldiezTool]
        The tools of the flow. See `WaldiezTool`.
    chats : list[WaldiezChat]
        The chats of the flow. See `WaldiezChat`.
    is_async : bool
        Whether the flow is asynchronous or not.
    cache_seed : Optional[int]
        The seed for the cache. If None, the seed is not set. Default is 41.
    """

    # we ignore the three below (nodes, edges, viewport)
    # (they for graph connections, positions, etc.)
    nodes: Annotated[
        list[dict[str, Any]],
        Field(
            default_factory=list,
            title="Nodes",
            description="The nodes of the flow",
        ),
    ]
    edges: Annotated[
        list[dict[str, Any]],
        Field(
            default_factory=list,
            title="Edges",
            description="The edges of the flow",
        ),
    ]
    viewport: Annotated[
        dict[str, Any],
        Field(
            default_factory=dict,
            title="Viewport",
            description="The viewport of the flow",
        ),
    ]
    # these are the ones we use.
    agents: Annotated[
        WaldiezAgents,
        Field(
            description="The agents of the flow",
            title="Agents",
            default_factory=WaldiezAgents,
        ),
    ]
    models: Annotated[
        list[WaldiezModel],
        Field(
            description="The models of the flow",
            title="Models",
            default_factory=list,
        ),
    ]
    tools: Annotated[
        list[WaldiezTool],
        Field(
            description="The tools of the flow",
            title="Tools",
            default_factory=list,
        ),
    ]
    chats: Annotated[
        list[WaldiezChat],
        Field(
            description="The chats of the flow",
            title="Chats",
            default_factory=list,
        ),
    ]
    is_async: Annotated[
        bool,
        Field(
            default=False,
            description="Whether the flow is asynchronous or not",
            title="Is Async",
        ),
    ]
    cache_seed: Annotated[
        int | None,
        Field(
            42,
            alias="cacheSeed",
            description=(
                "The seed for the cache. If None, the seed is not set."
                "Default is 42."
            ),
            title="Cache Seed",
        ),
    ]

    @model_validator(mode="after")
    def validate_flow_chats(self) -> Self:
        """Validate the flow chats.

        Returns
        -------
        WaldiezFlowData
            The flow data.

        Raises
        ------
        ValueError
            If there is a chat with a prerequisite that does not exist.
        """
        self.chats.sort(key=lambda x: x.order)
        # in async, ag2 uses the "chat_id" field (and it must be an int):
        # ```
        #    prerequisites = []
        #    for chat_info in chat_queue:
        #        if "chat_id" not in chat_info:
        #            raise ValueError(
        #               "Each chat must have a unique id for "
        #               "async multi-chat execution."
        #            )
        #     chat_id = chat_info["chat_id"]
        #     pre_chats = chat_info.get("prerequisites", [])
        #     for pre_chat_id in pre_chats:
        #         if not isinstance(pre_chat_id, int):
        #             raise ValueError("Prerequisite chat id is not int.")
        #         prerequisites.append((chat_id, pre_chat_id))
        #    return prerequisites
        # ```
        id_to_chat_id: dict[str, int] = {}
        for index, chat in enumerate(self.chats):
            id_to_chat_id[chat.id] = index
            chat.set_chat_id(index)
        if not self.is_async:
            return self
        # also update the chat prerequisites (if async)
        #  we have ids(str), not chat_ids(int)
        for chat in self.chats:
            chat_prerequisites: list[int] = []
            for chat_id in chat.data.prerequisites:
                if chat_id not in id_to_chat_id:  # pragma: no cover
                    raise ValueError(
                        f"Chat with id {chat_id} not found in the flow."
                    )
                chat_prerequisites.append(id_to_chat_id[chat_id])
            chat.set_prerequisites(chat_prerequisites)
        return self

    @classmethod
    def default(cls) -> "WaldiezFlowData":
        """Create a default flow data.

        Returns
        -------
        WaldiezFlowData
            The default flow data.
        """
        termination = WaldiezAgentTerminationMessage()
        return cls(
            nodes=[],
            edges=[],
            viewport={},
            agents=WaldiezAgents(
                userProxyAgents=[],
                assistantAgents=[
                    WaldiezAssistant(
                        id="assistant1",
                        name="Assistant 1",
                        created_at=now(),
                        updated_at=now(),
                        data=WaldiezAssistantData(
                            termination=termination,
                        ),
                    ),
                    WaldiezAssistant(
                        id="assistant2",
                        name="Assistant 2",
                        created_at=now(),
                        updated_at=now(),
                        data=WaldiezAssistantData(
                            # is_multimodal=True,  # we need an api key for this
                            termination=termination,
                        ),
                    ),
                ],
                ragUserProxyAgents=[],
                reasoningAgents=[],
                captainAgents=[],
                groupManagerAgents=[],
                docAgents=[],
            ),
            models=[],
            tools=[],
            chats=[
                WaldiezChat(
                    id="chat1",
                    type="chat",
                    source="assistant1",
                    target="assistant2",
                    data=WaldiezChatData(
                        name="Chat 1",
                        order=0,
                        position=0,
                        source_type="assistant",
                        target_type="assistant",
                        summary=WaldiezChatSummary(),
                        message=WaldiezChatMessage(
                            type="string",
                            content="Hello, how can I help you?",
                        ),
                        condition=WaldiezDefaultCondition.create(),
                        available=WaldiezTransitionAvailability(),
                        nested_chat=WaldiezChatNested(),
                    ),
                ),
                WaldiezChat(
                    id="chat2",
                    type="chat",
                    source="assistant2",
                    target="assistant1",
                    data=WaldiezChatData(
                        name="Chat 2",
                        order=1,
                        position=1,
                        source_type="assistant",
                        target_type="assistant",
                        summary=WaldiezChatSummary(),
                        message=WaldiezChatMessage(
                            type="string",
                            content="Hello, I need some help.",
                        ),
                        condition=WaldiezDefaultCondition.create(),
                        available=WaldiezTransitionAvailability(),
                        nested_chat=WaldiezChatNested(),
                        prerequisites=["chat1"],
                    ),
                ),
            ],
            is_async=False,
            cache_seed=42,
        )


def get_flow_data(
    data: dict[str, Any],
    flow_id: str | None = None,
    name: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
    requirements: list[str] | None = None,
) -> dict[str, Any]:
    """Get the flow from the passed data dict.

    Parameters
    ----------
    data : dict[str, Any]
        The data dict.
    flow_id : Optional[str], optional
        The flow ID, by default None.
    name : Optional[str], optional
        The flow name, by default None.
    description : Optional[str], optional
        The flow description, by default None.
    tags : Optional[list[str]], optional
        The flow tags, by default None.
    requirements : Optional[list[str]], optional
        The flow requirements, by default None.

    Returns
    -------
    dict[str, Any]
        The flow data.

    Raises
    ------
    ValueError
        If the flow type is not "flow".
    """
    item_type = data.get("type", "flow")
    if item_type != "flow":
        # empty flow (from exported model/tool ?)
        raise ValueError(f"Invalid flow type: {item_type}")
    from_args: dict[str, Any] = {
        "id": flow_id,
        "name": name,
        "description": description,
        "tags": tags,
        "requirements": requirements,
    }
    for key, value in from_args.items():
        if value:
            data[key] = value
    if "name" not in data:
        data["name"] = "Waldiez Flow"
    if "description" not in data:
        data["description"] = "Waldiez Flow description"
    if "tags" not in data:
        data["tags"] = []
    if "requirements" not in data:
        data["requirements"] = []
    return data
