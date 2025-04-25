/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node } from "@xyflow/react";

import {
    WaldiezAgent,
    WaldiezAgentSwarm,
    WaldiezAgentSwarmContainerData,
    WaldiezEdge,
    WaldiezFlow,
    WaldiezNodeAgent,
    WaldiezNodeAgentSwarm,
    WaldiezNodeAgentSwarmContainer,
    WaldiezNodeAgentSwarmContainerData,
    WaldiezSwarmAfterWork,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers/agent";
import { getRestFromJSON } from "@waldiez/models/mappers/common";
import { getEdgeTrigger } from "@waldiez/models/mappers/flow/utils/swarm/edges";
import { getAgentConnections, getSwarmAgentHandoffs, isAfterWork } from "@waldiez/store/utils";

export const getSwarmInitialFlowAgent = (flow: WaldiezFlow) => {
    const initialAgent = flow.data.agents.swarm_agents.find(agent => agent.data.isInitial);
    return initialAgent || flow.data.agents.swarm_agents[0];
};

export const getSwarmContainer = (flow: WaldiezFlow, nodes: Node[]) => {
    const agentData = new WaldiezAgentSwarmContainerData();
    const rest: any = { position: { x: 50, y: 50 } };
    // check if there is a swarm_container in the nodes
    // (to also get props like "width", "height", "selected", "isSelected", ...)
    const existingSwarmContainer = nodes.find(
        node =>
            node.type === "agent" &&
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "swarm_container",
    );
    if (existingSwarmContainer) {
        const containerRest = getRestFromJSON(existingSwarmContainer, [
            "id",
            "parentId",
            "type",
            "agentType",
            "name",
            "description",
            "tags",
            "requirements",
            "createdAt",
            "updatedAt",
            "data",
        ]);
        Object.keys(containerRest).forEach(key => {
            rest[key] = containerRest[key];
        });
    }
    const agent = new WaldiezAgent({
        id: `swarm-container-${flow.id}`,
        name: "Swarm container",
        description: "Swarm container",
        tags: [],
        requirements: [],
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        agentType: "swarm_container",
        data: agentData,
        rest,
    });
    const swarmContainerNode = agentMapper.asNode(agent);
    return swarmContainerNode;
};

export const exportSwarmAgents = (
    agentNodes: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
    skipLinks: boolean,
) => {
    const swarmAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "swarm",
    ) as WaldiezNodeAgentSwarm[];
    if (swarmAgentNodes.length === 0) {
        return { swarmAgents: [], edges };
    }
    const swarmContainerNode = agentNodes.find(
        node =>
            node.type === "agent" &&
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "swarm_container",
    ) as WaldiezNodeAgentSwarmContainer | undefined;
    if (!swarmContainerNode) {
        return { swarmAgents: [], edges };
    }
    if (!swarmContainerNode.data.label) {
        swarmContainerNode.data.label = "Swarm container";
    }
    return _exportSwarmAgents(swarmAgentNodes, swarmContainerNode, agentNodes, edges, skipLinks);
};

const _exportSwarmAgents = (
    swarmAgentNodes: WaldiezNodeAgentSwarm[],
    swarmContainerNode: WaldiezNodeAgentSwarmContainer,
    agentNodes: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
    skipLinks: boolean,
) => {
    const swarmAgents: WaldiezAgentSwarm[] = [];
    let updatedEdges = [...edges];
    const swarmContainerData = swarmContainerNode.data;
    const initialAgent = getSwarmInitialAgent(swarmContainerData, swarmAgentNodes);
    const edgeTrigger = getEdgeTrigger(
        edges,
        agentNodes,
        initialAgent,
        swarmContainerData,
        swarmContainerNode.id,
    );
    if (!edgeTrigger) {
        return { swarmAgents, edges };
    }
    updatedEdges = edges.map(edge => {
        if (edge.id === edgeTrigger.id) {
            return { ...edgeTrigger };
        }
        return edge;
    });
    swarmAgentNodes.forEach(node => {
        const agentConnections = getAgentConnections(agentNodes, updatedEdges, node.id);
        const handoffs = getSwarmAgentHandoffs(
            node.data,
            agentConnections,
            agentNodes,
            swarmAgentNodes,
            updatedEdges,
        );
        const updatedData = { ...node.data, handoffs };
        const updatedNode = { ...node, data: updatedData };
        const exported = agentMapper.exportAgent(updatedNode, skipLinks); // WaldiezNodeAgent to WaldiezAgent.
        swarmAgents.push(exported);
    });
    return { swarmAgents, edges: updatedEdges };
};

const getSwarmInitialAgent = (data: WaldiezNodeAgentSwarmContainerData, agents: WaldiezNodeAgentSwarm[]) => {
    let selectedAgent: WaldiezNodeAgentSwarm;
    if (!data.initialAgent) {
        const fromAgents = agents.filter(agent => agent.data.isInitial);
        if (fromAgents.length > 0) {
            selectedAgent = fromAgents[0];
        } else {
            selectedAgent = agents[0];
        }
    } else {
        selectedAgent = agents.find(agent => agent.id === data.initialAgent) ?? agents[0];
    }
    if (!selectedAgent) {
        selectedAgent = agents[0];
    }
    agents.forEach(agent => {
        agent.data.isInitial = agent.id === selectedAgent.id;
    });
    return selectedAgent;
};

export const getSwarmRFNodes = (flow: WaldiezFlow, edges: Edge[]) => {
    const nodes: Node[] = [];
    if (flow.data.agents.swarm_agents.length > 0) {
        const containerNode = getSwarmContainerNode(flow, edges);
        nodes.push(containerNode);
        flow.data.agents.swarm_agents.forEach(swarmAgent => {
            const swarmNode = agentMapper.asNode(swarmAgent);
            swarmNode.parentId = containerNode.id;
            nodes.push(swarmNode);
        });
    }
    return nodes;
};

const getSwarmContainerNode = (flow: WaldiezFlow, edges: Edge[]) => {
    const parentId = getSwarmContainerId(flow);
    if (parentId) {
        const agentNode = flow.data.nodes.find(node => node.id === parentId);
        if (agentNode) {
            const agentData = new WaldiezAgentSwarmContainerData() as any;
            agentNode.data = agentData;
            return updateSwarmContainer(flow, agentNode as WaldiezNodeAgentSwarmContainer, edges);
        }
    }
    return getSwarmContainer(flow, []);
};

const updateSwarmContainer = (
    flow: WaldiezFlow,
    agentNode: WaldiezNodeAgentSwarmContainer,
    edges: Edge[],
) => {
    const initialAgent = getSwarmInitialFlowAgent(flow);
    const containerId = getSwarmContainerId(flow);
    agentNode.data.initialAgent = initialAgent.id;
    agentNode.id = `swarm-container-${flow.id}`;
    agentNode.data.agentType = "swarm_container";
    // missing:
    // - maxRounds: number;
    // - afterWork: WaldiezSwarmAfterWork | null;
    // - contextVariables: { [key: string]: string };
    updateSwarmContainerFromEdgeTrigger(flow, edges, agentNode, initialAgent, containerId);
    // updateSwarmContainerFromEdgeTrigger(edges, agentNode, initialAgent, containerId);
    // let's try to get these from the edge trigger.
    // find the edge that has as target the swarm_container
    // if not found (no userAgent), find the edge that has as source the initialAgent of the swarm_container
    return agentNode;
};

// eslint-disable-next-line max-statements
const updateSwarmContainerFromEdgeTrigger = (
    flow: WaldiezFlow,
    edges: Edge[],
    agentNode: WaldiezNodeAgentSwarmContainer,
    initialAgent: WaldiezAgentSwarm,
    containerId: string,
) => {
    let foundUserTrigger = false;
    const edgesWithInitialAgentAsSource: Edge[] = [];
    for (const edge of edges) {
        if (edge.type === "swarm") {
            if (
                edge.target === initialAgent.id ||
                edge.data?.realTarget === initialAgent.id ||
                edge.target === containerId
            ) {
                const userSource = flow.data.agents.users.find(user => user.id === edge.source);
                if (userSource) {
                    updateSwarmContainerFromEdge(edge, agentNode);
                    foundUserTrigger = true;
                    break;
                }
            }
            if (edge.source === initialAgent.id) {
                edgesWithInitialAgentAsSource.push(edge);
            }
        }
    }
    // the chat is not triggered by a user,
    // so we need to find the edge that has as source the initialAgent
    if (!foundUserTrigger) {
        for (const edge of edgesWithInitialAgentAsSource) {
            for (const agent of flow.data.agents.swarm_agents) {
                if (edge.target === agent.id) {
                    updateSwarmContainerFromEdge(edge, agentNode);
                    break;
                }
            }
        }
    }
};

const updateSwarmContainerFromEdge = (edgeTrigger: Edge, agentNode: WaldiezNodeAgentSwarmContainer) => {
    if (typeof edgeTrigger.data?.maxRounds !== "number") {
        agentNode.data.maxRounds = 20;
    } else {
        agentNode.data.maxRounds = edgeTrigger.data.maxRounds;
    }
    if (!edgeTrigger.data?.flowAfterWork) {
        agentNode.data.afterWork = null;
    } else if (isAfterWork(edgeTrigger.data.flowAfterWork)) {
        agentNode.data.afterWork = edgeTrigger.data.flowAfterWork as WaldiezSwarmAfterWork;
    }
    agentNode.data.contextVariables = {};
    if (edgeTrigger.data?.contextVariables && typeof edgeTrigger.data.contextVariables === "object") {
        agentNode.data.contextVariables = edgeTrigger.data.contextVariables as Record<string, string>;
    }
};

const getSwarmContainerId = (flow: WaldiezFlow) => {
    let parentId = `swarm-container-${flow.id}`;
    for (const agent of flow.data.agents.swarm_agents) {
        if (agent.data.parentId && typeof agent.data.parentId === "string") {
            parentId = agent.data.parentId;
            break;
        } else if (agent.rest?.parentId && typeof agent.rest.parentId === "string") {
            parentId = agent.rest.parentId as string;
            break;
        }
    }
    return parentId;
};
