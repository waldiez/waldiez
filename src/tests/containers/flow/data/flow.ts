/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { createdAt, description, flowId, name, requirements, tags, updatedAt } from "./common";
import { edges } from "./edges";
import { nodes } from "./nodes";

import { Edge, Node } from "@xyflow/react";

import {
    WaldiezAgentAssistant,
    WaldiezAgentGroupManager,
    WaldiezAgentRagUser,
    WaldiezAgentUserProxy,
    WaldiezChat,
    WaldiezModel,
    WaldiezNodeAgentRagUserData,
    WaldiezSkill,
    agentMapper,
    chatMapper,
    modelMapper,
    skillMapper,
} from "@waldiez/models";

const agents = {
    users: [] as WaldiezAgentUserProxy[],
    assistants: [] as WaldiezAgentAssistant[],
    managers: [] as WaldiezAgentGroupManager[],
    rag_users: [] as WaldiezAgentRagUser[],
};
const models = [] as WaldiezModel[];
const skills = [] as WaldiezSkill[];

/* eslint-disable max-statements */
const nodesWithoutData = nodes.map((node: Node) => {
    const nodeType = node.type;
    if (nodeType === "agent") {
        const agentData = node.data as any;
        const agentType = agentData.agentType;
        const jsonData = {
            id: node.id,
            type: nodeType,
            position: agentData.position,
            data: { ...agentData },
            createdAt,
            updatedAt,
        };
        if (agentType === "user") {
            agents.users.push(agentMapper.importAgent(jsonData, jsonData.id));
        } else if (agentType === "assistant") {
            agents.assistants.push(agentMapper.importAgent(jsonData, jsonData.id));
        } else if (agentType === "manager") {
            agents.managers.push(agentMapper.importAgent(jsonData, jsonData.id) as WaldiezAgentGroupManager);
        } else if (agentType === "rag_user") {
            const dataWithRetrieveConfig = {
                ...jsonData,
                data: {
                    ...jsonData.data,
                    retrieveConfig: (jsonData.data as WaldiezNodeAgentRagUserData).retrieveConfig,
                },
            };
            agents.rag_users.push(
                agentMapper.importAgent(dataWithRetrieveConfig, jsonData.id) as WaldiezAgentRagUser,
            );
        }
        return { ...node };
    } else if (nodeType === "model") {
        const modelData = node.data as any;
        const jsonData = {
            id: node.id,
            type: nodeType,
            position: modelData.position,
            data: { ...modelData },
            createdAt,
            updatedAt,
        };
        models.push(modelMapper.importModel(jsonData));
        return { ...node };
    } else if (nodeType === "skill") {
        const skillData = node.data as any;
        const jsonData = {
            id: node.id,
            type: nodeType,
            position: skillData.position,
            data: { ...skillData },
            createdAt,
            updatedAt,
        };
        skills.push(skillMapper.importSkill(jsonData));
        return { ...node };
    }
    const newNode = { ...node, data: {} };
    return { ...newNode };
});
const chats = [] as WaldiezChat[];
const edgesWithoutData = edges.map((edge: Edge, index: number) => {
    const chatData = edge.data as any;
    const jsonData = {
        id: edge.id,
        data: {
            ...chatData,
            source: edge.source,
            target: edge.target,
        },
        position: chatData.position,
        hidden: chatData.hidden,
    };
    chats.push(chatMapper.importChat(jsonData, edges, nodes, index).chat);
    const newEdge = { ...edge, data: {} };
    return { ...newEdge };
});

export const flow = {
    id: flowId,
    type: "flow",
    name,
    description,
    tags,
    requirements,
    storageId: "storage-id",
    data: {
        nodes: nodesWithoutData,
        edges: edgesWithoutData,
        viewport: {
            x: 0,
            y: 0,
            zoom: 1,
        },
        chats,
        models,
        skills,
        agents,
    },
    createdAt,
    updatedAt,
};
