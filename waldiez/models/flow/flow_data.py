# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez flow data."""

from typing import Any, Optional

from pydantic import Field, model_validator
from typing_extensions import Annotated, Self

from ..agents import WaldiezAgents, WaldiezAssistant
from ..chat import WaldiezChat
from ..common import WaldiezBase
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

    # the ones below (nodes,edges, viewport) we ignore
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
            False,
            description="Whether the flow is asynchronous or not",
            title="Is Async",
        ),
    ]
    cache_seed: Annotated[
        Optional[int],
        Field(
            41,
            alias="cacheSeed",
            description=(
                "The seed for the cache. If None, the seed is not set."
                "Default is 41."
            ),
            title="Cache Seed",
        ),
    ] = 42

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
        self.chats = sorted(self.chats, key=lambda x: x.order)
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
            chat_prerequisites = []
            for chat_id in chat.data.prerequisites:
                if chat_id not in id_to_chat_id:  # pragma: no cover
                    raise ValueError(
                        f"Chat with id {chat_id} not found in the flow."
                    )
                chat_prerequisites.append(id_to_chat_id[chat_id])
            chat.set_prerequisites(chat_prerequisites)
        return self

    @staticmethod
    def default() -> "WaldiezFlowData":
        """Create a default flow data.

        Returns
        -------
        WaldiezFlowData
            The default flow data.
        """
        return WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents=WaldiezAgents(
                userProxyAgents=[],
                assistantAgents=[
                    WaldiezAssistant(
                        id="assistant",
                        name="Assistant",
                    )
                ],
                ragUserProxyAgents=[],
                reasoningAgents=[],
                captainAgents=[],
            ),
            models=[],
            tools=[],
            chats=[],
            is_async=False,
            cache_seed=42,
        )
