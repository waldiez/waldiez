/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback } from "react";

import type {
    WaldiezAgentNestedChat,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezTransitionTarget,
} from "@waldiez/types";

export const useHandoffNames = (
    agents: WaldiezNodeAgent[],
    allEdges: WaldiezEdge[],
    nestedChats: WaldiezAgentNestedChat[],
) => {
    // Get agent name by ID
    const getAgentName = useCallback(
        (agentId: string) => {
            const agent = agents.find(a => a.id === agentId);
            return agent?.data.label || agent?.data.name || agentId;
        },
        [agents],
    );

    // Get nested chat display name
    const getNestedChatDisplayName = useCallback(
        (index: number = 0) => {
            if (
                nestedChats.length === 0 ||
                index >= nestedChats.length ||
                nestedChats[index]?.messages.length === 0
            ) {
                return "Nested Chat";
            }

            const nestedChat = nestedChats[index];
            const targets =
                nestedChat?.messages
                    .map(msg => {
                        const edge = allEdges.find(e => e.id === msg.id);
                        return edge ? getAgentName(edge.target) : "";
                    })
                    .filter(Boolean) || [];

            if (targets.length === 0) {
                return "Nested Chat";
            }

            return targets.length === 1
                ? `Nested Chat: ${targets[0]}`
                : `Nested Chat: ${targets[0]} +${targets.length - 1} more`;
        },
        [nestedChats, allEdges, getAgentName],
    );
    // Get transition target display name
    const getTransitionTargetName = (target: WaldiezTransitionTarget) => {
        switch (target.targetType) {
            case "AgentTarget":
                return getAgentName(target.value[0] ? target.value[0] : "");
            case "RandomAgentTarget":
                return `Random (${target.value.map(getAgentName).join(", ")})`;
            case "GroupChatTarget":
                return `Group Chat: ${getAgentName(target.value[0] ? target.value[0] : "")}`;
            case "NestedChatTarget":
                return getNestedChatDisplayName(0);
            case "AskUserTarget":
                return "Ask User";
            case "GroupManagerTarget":
                return "Group Manager";
            case "RevertToUserTarget":
                return "Revert to User";
            case "StayTarget":
                return "Stay";
            case "TerminateTarget":
                return "Terminate";
            default:
                return "Unknown";
        }
    };

    // Get after work target name
    const getAfterWorkTargetName = (target: WaldiezTransitionTarget) => {
        return getTransitionTargetName(target);
    };
    return {
        getAgentName,
        getTransitionTargetName,
        getAfterWorkTargetName,
        getNestedChatDisplayName,
    };
};
