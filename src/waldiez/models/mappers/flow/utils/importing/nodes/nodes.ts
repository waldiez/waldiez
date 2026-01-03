/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentType } from "@waldiez/models/Agent/types";
import { getIdFromJSON, getRestFromJSON } from "@waldiez/models/mappers/common";

const ValidChatTypes = ["model", "tool", "agent"];
const ValidAgentTypes: WaldiezAgentType[] = ["user_proxy", "assistant", "rag_user_proxy"];

export const getNodes = (json: Record<string, unknown>) => {
    const nodes: Node[] = [];
    if (!("nodes" in json) || !Array.isArray(json.nodes)) {
        return nodes;
    }
    json.nodes.forEach((nodeJson: Record<string, unknown>) => {
        const nodeEssentials = isValidNode(nodeJson);
        if (!nodeEssentials) {
            return;
        }
        const { type, position, data } = nodeEssentials;
        let parentId: string | undefined = undefined;
        if ("parentId" in nodeJson && typeof nodeJson.parentId === "string") {
            parentId = nodeJson.parentId;
        }
        const id = getIdFromJSON(nodeJson);
        const rest = getRestFromJSON(nodeJson, ["id", "type", "parentId", "data"]);
        delete rest.position;
        nodes.push({
            id: id,
            type: type,
            position: {
                x: position.x,
                y: position.y,
            },
            parentId,
            data,
            ...rest,
        });
    });
    updateNodes(json, nodes);
    return nodes;
};

const isValidNode = (nodeJson: Record<string, unknown>) => {
    if (
        !("type" in nodeJson) ||
        typeof nodeJson.type !== "string" ||
        !ValidChatTypes.includes(nodeJson.type)
    ) {
        return null;
    }
    let position = getNodePosition(nodeJson);
    if (!position || typeof position !== "object") {
        position = { x: 20, y: 20 }; // Default position if not specified
    }
    if (!("x" in position) || typeof position.x !== "number") {
        position.x = 20; // Default x position if not specified
    }
    if (!("y" in position) || typeof position.y !== "number") {
        position.y = 20; // Default y position if not specified
    }
    const data = getNodeData(nodeJson, nodeJson.type);
    if (!data) {
        return null;
    }
    return { type: nodeJson.type, position, data };
};

const getNodePosition = (nodeJson: Record<string, unknown>) => {
    if (!("position" in nodeJson) || typeof nodeJson.position !== "object") {
        return null;
    }
    const position = nodeJson.position as Record<string, unknown>;
    if (
        !("x" in position) ||
        typeof position.x !== "number" ||
        !("y" in position) ||
        typeof position.y !== "number"
    ) {
        return null;
    }
    return position as { x: number; y: number };
};

const getNodeData = (nodeJson: Record<string, unknown>, type: string) => {
    const data: Record<string, unknown> = {};
    if (type === "agent") {
        const agentData = (nodeJson.data || {}) as Record<string, unknown>;
        if (
            !("agentType" in agentData) ||
            typeof agentData.agentType !== "string" ||
            !ValidAgentTypes.includes(agentData.agentType as any)
        ) {
            return data;
        }
        data.agentType = agentData.agentType;
    }
    return data;
};

const updateNodeLabel = (node: Node, json: Record<string, unknown>) => {
    if ("data" in json && typeof json.data === "object" && json.data) {
        const data = json.data as Record<string, unknown>;
        if ("label" in data && typeof data.label === "string") {
            node.data.label = data.label;
        }
    }
};

const updateNodes = (json: Record<string, unknown>, nodes: Node[]) => {
    ["models", "tools"].forEach(key => {
        if (!(key in json) || !Array.isArray(json[key])) {
            return;
        }
        const jsonModels = json[key] as Record<string, unknown>[];
        nodes.forEach(node => {
            const jsonModel = jsonModels.find(model => {
                return getIdFromJSON(model) === node.id;
            });
            if (jsonModel) {
                updateNodeLabel(node, jsonModel);
            }
        });
    });
    updateAgentNodes(json, nodes);
};

const updateAgentNodes = (json: Record<string, unknown>, nodes: Node[]) => {
    if (!("agents" in json) || typeof json.agents !== "object") {
        return;
    }
    const agents = json.agents as Record<string, unknown>;
    nodes.forEach(node => {
        if (node.type !== "agent") {
            return;
        }
        ValidAgentTypes.forEach(agentType => {
            const key = `${agentType}s`;
            if (!(key in agents) || !Array.isArray(agents[key])) {
                return;
            }
            agents[key].forEach((agentJson: Record<string, unknown>) => {
                if (node.id === agentJson.id) {
                    node.data.agentType = agentType;
                    updateNodeLabel(node, agentJson);
                }
                if ("data" in agentJson && typeof agentJson.data === "object" && agentJson.data) {
                    const agentData = agentJson.data as Record<string, unknown>;
                    if ("parentId" in agentData && typeof agentData.parentId === "string") {
                        node.data.parentId = agentData.parentId;
                    }
                }
            });
        });
    });
};
