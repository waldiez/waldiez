/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentSwarmData,
    WaldiezSwarmAfterWork,
    WaldiezSwarmHandoff,
    WaldiezSwarmOnCondition,
    WaldiezSwarmOnConditionAvailableCheckType,
} from "@waldiez/models";

export const isAfterWork = (item: any) => {
    // recipientType: WaldiezSwarmAfterWorkRecipientType;
    // recipient: string | WaldiezSwarmAfterWorkOption;
    // WaldiezSwarmAfterWorkRecipientType = "agent" | "option" | "callable";
    // WaldiezSwarmAfterWorkOption = "TERMINATE" | "REVERT_TO_USER" | "STAY";
    if (!("recipientType" in item && "recipient" in item)) {
        return false;
    }
    const recipientType = item.recipientType as string;
    if (!["agent", "option", "callable"].includes(recipientType)) {
        return false;
    }
    if (recipientType === "agent") {
        if (typeof item.recipient !== "string") {
            return false;
        }
    } else if (recipientType === "option") {
        if (typeof item.recipient !== "string") {
            return false;
        }
        if (!["TERMINATE", "REVERT_TO_USER", "STAY", "SWARM_MANAGER"].includes(item.recipient)) {
            return false;
        }
    }
    return true;
};

export const getSwarmAgentHandoffs = (
    nodeData: WaldiezNodeAgentSwarmData,
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    },
    agentNodes: WaldiezNodeAgent[],
    swarmAgentNodes: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
) => {
    let foundAfterWork: WaldiezSwarmAfterWork | null = null;
    const onConditions: WaldiezSwarmOnCondition[] = [];
    const nestedChatOnCondition = getNestedChatOnConditionHandoff(agentConnections, nodeData);
    if (nestedChatOnCondition) {
        onConditions.push(nestedChatOnCondition);
    }
    const swarmTargets = agentConnections.target.nodes.filter(node =>
        swarmAgentNodes.some(agent => agent.id === node.id),
    );
    const swarmTargetEdges = agentConnections.target.edges.filter(
        edge => edge.type === "swarm" && swarmTargets.some(target => target.id === edge.target),
    );
    swarmTargetEdges.forEach(edge => {
        const swarmEdge = edges.find(e => e.id === edge.id);
        if (!swarmEdge) {
            return;
        }
        const { afterWork, onCondition } = getSwarmAgentHandoff(swarmEdge, agentNodes);
        if (afterWork && !foundAfterWork) {
            foundAfterWork = afterWork;
        }
        if (onCondition) {
            onConditions.push(onCondition);
        }
    });
    if (!foundAfterWork) {
        const fromData = nodeData.handoffs.find(handoff => isAfterWork(handoff));
        if (fromData) {
            foundAfterWork = fromData as WaldiezSwarmAfterWork;
        }
    }
    const sortedOnConditions = onConditions.sort((a, b) => a.target.order - b.target.order);
    // afterWork should be the last item in the array
    const handoffs: WaldiezSwarmHandoff[] = [...sortedOnConditions];
    if (foundAfterWork) {
        handoffs.push(foundAfterWork);
    }
    return handoffs;
};

export const getNestedChatOnConditionHandoff: (
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    },
    agentData: WaldiezNodeAgentSwarmData,
) => WaldiezSwarmOnCondition | null = (agentConnections, agentData) => {
    // if we have targets that are not swarm agents,
    // check if a handoff (onCondition) with targetType == "nested_chat" exists
    // if so, return that
    // else, return a new onCondition with targetType == "nested_chat"
    // if no targets that are not swarm agents, return null
    const nonSwarmTargets = agentConnections.target.nodes.filter(node => node.data.agentType !== "swarm");
    if (nonSwarmTargets.length === 0) {
        return null;
    }
    const onConditionHandoffsNested = agentData.handoffs.filter(handoff => {
        if ("targetType" in handoff) {
            return handoff.targetType === "nested_chat";
        }
    });
    if (onConditionHandoffsNested.length > 0) {
        return onConditionHandoffsNested[0] as WaldiezSwarmOnCondition;
    } else {
        const nestedChats = agentData.nestedChats;
        if (nestedChats.length > 0 && nestedChats[0].messages.length > 0) {
            const edgeId = nestedChats[0].messages[0].id;
            return {
                targetType: "nested_chat",
                target: { id: edgeId, order: nonSwarmTargets.length },
                condition: `Transfer to ${nonSwarmTargets[0].data.label}`,
                available: {
                    type: "none",
                    value: null,
                },
            };
        }
        const nonSwarmTargetEdges = agentConnections.target.edges.filter(
            edge => edge.type === "swarm" && nonSwarmTargets.some(target => target.id === edge.target),
        );
        const edgeId = nonSwarmTargetEdges[0].id;
        return {
            targetType: "nested_chat",
            target: { id: edgeId, order: nonSwarmTargets.length },
            condition: `Transfer to ${nonSwarmTargets[0].data.label}`,
            available: {
                type: "none",
                value: null,
            },
        };
    }
};

const getSwarmAgentHandoff: (
    edge: WaldiezEdge,
    agentNodes: WaldiezNodeAgent[],
) => { afterWork: WaldiezSwarmAfterWork | null; onCondition: WaldiezSwarmOnCondition | null } = (
    edge,
    agentNodes,
) => {
    const targetNode = agentNodes.find(node => node.id === edge.target);
    if (!targetNode || !edge.data) {
        return {
            afterWork: null,
            onCondition: null,
        };
    }
    const afterWork = edge.data.afterWork;
    if (afterWork) {
        return {
            afterWork,
            onCondition: null,
        };
    }
    const onCondition = getOnConditionFromEdge(edge, targetNode);
    let order = 0;
    // check if it already exists in sourceNode's handoffs
    // to get the order
    const sourceNode = agentNodes.find(node => node.id === edge.source);
    if (sourceNode && "data" in sourceNode && sourceNode.data && "handoffs" in sourceNode.data) {
        const onConditionInHandoff = sourceNode.data.handoffs.find(
            handoff =>
                "target" in handoff &&
                typeof handoff.target === "object" &&
                handoff.target &&
                "id" in handoff.target &&
                handoff.target.id === targetNode.id &&
                "order" in handoff.target &&
                typeof handoff.target.order === "number",
        );
        if (onConditionInHandoff) {
            order = (onConditionInHandoff as WaldiezSwarmOnCondition).target.order;
        }
    }
    return {
        afterWork: null,
        onCondition: {
            targetType: "agent",
            target: { id: targetNode.id, order },
            condition: onCondition.condition,
            available: {
                type: onCondition.availableCheckType,
                value: onCondition.available,
            },
        },
    };
};

const getOnConditionFromEdge = (edge: WaldiezEdge, targetNode: WaldiezNodeAgent) => {
    let condition = `Transfer to ${targetNode.data.label}`;
    if (
        edge.data?.description &&
        edge.data.description !== "" &&
        edge.data.description.toLowerCase() !== "new connection"
    ) {
        condition = edge.data.description;
    }
    const availableCheckType: WaldiezSwarmOnConditionAvailableCheckType = [
        "string",
        "callable",
        "none",
    ].includes(edge.data?.available?.type || "none")
        ? edge.data?.available?.type || "none"
        : "none";
    const available = edge.data?.available.type === "none" ? null : edge.data?.available.value;
    if (!available) {
        return { condition, available: null, availableCheckType };
    }
    return { condition, available, availableCheckType };
};
