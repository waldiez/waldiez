/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { Edge, Node } from "@xyflow/react";

import {
    WaldiezEdge,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezNodeModel,
    WaldiezNodeSkill,
    emptyFlow,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers/agent";
import { chatMapper } from "@waldiez/models/mappers/chat";
import {
    exportAgent,
    exportChat,
    exportModel,
    exportSkill,
    exportSwarmAgents,
    getAgentNodes,
    getAgents,
    getCacheSeed,
    getChats,
    getEdges,
    getFlowViewport,
    getIsAsync,
    getModels,
    getNodes,
    getSkills,
    getSwarmInitialFlowAgent,
    getSwarmRFNodes,
    importFlowMeta,
} from "@waldiez/models/mappers/flow/utils";
import { modelMapper } from "@waldiez/models/mappers/model";
import { skillMapper } from "@waldiez/models/mappers/skill";
import { WaldiezChat, WaldiezFlowProps } from "@waldiez/types";

export const flowMapper = {
    importFlow: (item: any, newId?: string) => {
        const flowJson = getFlowJson(item);
        if (!flowJson.type || flowJson.type !== "flow") {
            return emptyFlow;
        }
        const { id, storageId, name, description, tags, requirements, createdAt, updatedAt, rest } =
            importFlowMeta(flowJson);
        const flowData = (flowJson.data || flowJson) as Record<string, unknown>;
        const flowId = newId || id;
        const data = getFlowDataToImport(flowData, flowId);
        let flowStorageId = storageId;
        if (storageId === id && typeof newId === "string") {
            flowStorageId = newId;
        }
        return new WaldiezFlow({
            id: flowId,
            storageId: flowStorageId,
            name,
            description,
            tags,
            requirements,
            data,
            createdAt,
            updatedAt,
            rest,
        });
    },
    toReactFlow(flow: WaldiezFlow) {
        const edges: Edge[] = getRFEdges(flow);
        const nodes: Node[] = getRFNodes(flow, edges);
        const flowProps: WaldiezFlowProps = {
            flowId: flow.id,
            isAsync: flow.data.isAsync ?? false,
            cacheSeed: flow.data.cacheSeed,
            storageId: flow.storageId,
            name: flow.name,
            description: flow.description,
            tags: flow.tags,
            requirements: flow.requirements,
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
            edges,
            nodes,
            viewport: flow.data.viewport || { zoom: 1, position: { x: 0, y: 0 } },
            ...flow.rest,
        };
        return flowProps;
    },
    exportFlow: (flow: WaldiezFlowProps, hideSecrets: boolean, skipLinks: boolean = false) => {
        const waldiezFlow: WaldiezFlow = {
            id: flow.flowId,
            type: "flow",
            storageId: flow.storageId,
            name: flow.name,
            description: flow.description,
            tags: flow.tags,
            requirements: flow.requirements,
            createdAt: flow.createdAt || new Date().toISOString(),
            updatedAt: flow.updatedAt || new Date().toISOString(),
            data: getFlowDataToExport(flow, hideSecrets, skipLinks),
        };
        return waldiezFlow;
    },
};

const getFlowDataToImport = (json: Record<string, unknown>, flowId: string) => {
    const isAsync = getIsAsync(json);
    const cacheSeed = getCacheSeed(json);
    const viewport = getFlowViewport(json);
    const nodes = getNodes(json);
    let edges = getEdges(json);
    const chatsNEdges = getChats(json, nodes, edges);
    edges = chatsNEdges.edges;
    const chats = chatsNEdges.chats;
    const models = getModels(json, nodes);
    const skills = getSkills(json, nodes);
    const agents = getAgents(
        json,
        nodes,
        models.map(model => model.id),
        skills.map(skill => skill.id),
        edges.map(edge => edge.id),
    );
    agents.swarm_agents.forEach(agent => {
        if (
            agent.rest &&
            agent.rest.parentId &&
            typeof agent.rest.parentId === "string" &&
            agent.rest.parentId.startsWith("swarm-container")
        ) {
            agent.rest.parentId = `swarm-container-${flowId}`;
        }
    });
    nodes.forEach(node => {
        if (node.id.startsWith("swarm-container")) {
            node.id = `swarm-container-${flowId}`;
        }
        if (node.parentId && node.parentId.startsWith("swarm-container")) {
            node.parentId = `swarm-container-${flowId}`;
        }
    });

    return new WaldiezFlowData({ nodes, edges, agents, models, skills, chats, isAsync, cacheSeed, viewport });
};

const getFlowDataToExport = (flow: WaldiezFlowProps, hideSecrets: boolean, skipLinks: boolean) => {
    const nodes = flow.nodes || [];
    const flowEdges = (flow.edges || []) as WaldiezEdge[];
    const modelNodes = nodes.filter(node => node.type === "model") as WaldiezNodeModel[];
    const skillNodes = nodes.filter(node => node.type === "skill") as WaldiezNodeSkill[];
    const {
        agentNodes,
        userAgentNodes,
        assistantAgentNodes,
        managerNodes,
        ragUserNodes,
        reasoningAgentNodes,
        captainAgentNodes,
    } = getAgentNodes(nodes);
    const { edges, swarmAgents } = exportSwarmAgents(agentNodes, flowEdges, skipLinks);
    return new WaldiezFlowData({
        nodes: nodes.map(node => {
            const nodeCopy = { ...node } as any;
            delete nodeCopy.data;
            delete nodeCopy.agentType;
            return nodeCopy;
        }),
        edges: edges.map(edge => {
            const edgeCopy = { ...edge } as any;
            delete edgeCopy.data;
            return edgeCopy;
        }),
        agents: {
            users: userAgentNodes.map(userAgentNode => exportAgent(userAgentNode, nodes, skipLinks)),
            assistants: assistantAgentNodes.map(assistantAgentNode =>
                exportAgent(assistantAgentNode, nodes, skipLinks),
            ),
            managers: managerNodes.map(managerNode => exportAgent(managerNode, nodes, skipLinks)),
            rag_users: ragUserNodes.map(ragUserNode => exportAgent(ragUserNode, nodes, skipLinks)),
            swarm_agents: swarmAgents,
            reasoning_agents: reasoningAgentNodes.map(reasoningAgentNode =>
                exportAgent(reasoningAgentNode, nodes, skipLinks),
            ),
            captain_agents: captainAgentNodes.map(captainAgentNode =>
                exportAgent(captainAgentNode, nodes, skipLinks),
            ),
        },
        models: modelNodes.map(modelNode => exportModel(modelNode, nodes, hideSecrets)),
        skills: skillNodes.map(skillNode => exportSkill(skillNode, nodes, hideSecrets)),
        chats: edges.map((edge, index) => exportChat(edge, edges, index)),
        isAsync: flow.isAsync,
        cacheSeed: flow.cacheSeed,
        viewport: flow.viewport,
    });
};

const getRFNodes = (flow: WaldiezFlow, edges: Edge[]) => {
    const nodes: Node[] = [];
    flow.data.models.forEach(model => {
        nodes.push(modelMapper.asNode(model));
    });
    flow.data.skills.forEach(skill => {
        nodes.push(skillMapper.asNode(skill));
    });
    flow.data.agents.users.forEach(user => {
        nodes.push(agentMapper.asNode(user));
    });
    flow.data.agents.assistants.forEach(assistant => {
        nodes.push(agentMapper.asNode(assistant));
    });
    flow.data.agents.managers.forEach(manager => {
        nodes.push(agentMapper.asNode(manager));
    });
    flow.data.agents.rag_users.forEach(ragUser => {
        nodes.push(agentMapper.asNode(ragUser));
    });
    flow.data.agents.reasoning_agents.forEach(reasoningAgent => {
        nodes.push(agentMapper.asNode(reasoningAgent));
    });
    flow.data.agents.captain_agents.forEach(captainAgent => {
        nodes.push(agentMapper.asNode(captainAgent));
    });
    const swarmNodes = getSwarmRFNodes(flow, edges);
    nodes.push(...swarmNodes);
    return nodes;
};

const getRFEdges = (flow: WaldiezFlow) => {
    const flowEdges: Edge[] = [];
    flow.data.chats.forEach(chat => {
        const edge = chatMapper.asEdge(chat);
        const { sourceHandle, targetHandle } = getEdgeHandles(flow, chat);
        edge.sourceHandle = sourceHandle;
        edge.targetHandle = targetHandle;
        if (edge.type === "swarm" && edge.target.startsWith("swarm-container")) {
            handleEdgeToSwarmContainer(edge, flow);
        }
        flowEdges.push(edge);
    });
    return flowEdges;
};

const getEdgeHandles = (flow: WaldiezFlow, chat: WaldiezChat) => {
    // if in chat.rest there is a "sourceHandle" and "targetHandle" use them
    // else, check flow.edges (compare the id) and use the sourceHandle and targetHandle from there
    // if not found, use the default ones
    let sourceHandle; // = `agent-handle-right-source-${chat.source}`;
    let targetHandle; // = `agent-handle-left-target-${chat.target}`;
    if (chat.rest.sourceHandle && typeof chat.rest.sourceHandle === "string") {
        sourceHandle = chat.rest.sourceHandle;
    }
    if (chat.rest.targetHandle && typeof chat.rest.targetHandle === "string") {
        targetHandle = chat.rest.targetHandle;
    }
    if (!sourceHandle || !targetHandle) {
        const edge = flow.data.edges.find(edge => edge.id === chat.id);
        if (edge) {
            sourceHandle = edge.sourceHandle || sourceHandle;
            targetHandle = edge.targetHandle || targetHandle;
        }
    }
    if (!sourceHandle) {
        sourceHandle = `agent-handle-right-source-${chat.source}`;
    }
    if (!targetHandle) {
        targetHandle = `agent-handle-left-target-${chat.target}`;
    }
    return { sourceHandle, targetHandle };
};

const handleEdgeToSwarmContainer = (edge: Edge, flow: WaldiezFlow) => {
    const initialAgent = getSwarmInitialFlowAgent(flow);
    edge.target = initialAgent.id;
    edge.sourceHandle = `agent-handle-right-source-${edge.source}`;
    edge.targetHandle = `agent-handle-left-target-${initialAgent.id}`;
    if (edge.data) {
        edge.data.realTarget = initialAgent.id;
    }
};

const getFlowJson = (item: any) => {
    let flowJson: Record<string, unknown> = {};
    if (typeof item === "string") {
        try {
            flowJson = JSON.parse(item);
        } catch (_) {
            return {};
        }
    } else if (typeof item === "object") {
        flowJson = item;
    }
    return flowJson;
};
