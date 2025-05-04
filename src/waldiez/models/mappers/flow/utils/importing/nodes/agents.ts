/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import {
    WaldiezAgent,
    WaldiezAgentAssistant,
    WaldiezAgentCaptain,
    WaldiezAgentRagUser,
    WaldiezAgentReasoning,
    WaldiezAgentType,
    WaldiezAgentUserProxy,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers/agent";
import { getIdFromJSON } from "@waldiez/models/mappers/common";

export const getAgents = (
    json: Record<string, unknown>,
    nodes: Node[],
    modelIds: string[],
    skillIds: string[],
    chatIds: string[],
) => {
    if (!("agents" in json) || typeof json.agents !== "object") {
        return {
            userProxyAgents: [],
            assistantAgents: [],
            ragUserProxyAgents: [],
            reasoningAgents: [],
            captainAgents: [],
        };
    }
    const agentsJson = json.agents as Record<string, unknown>;
    const agents: {
        userProxyAgents: WaldiezAgentUserProxy[];
        assistantAgents: WaldiezAgentAssistant[];
        ragUserProxyAgents: WaldiezAgentRagUser[];
        reasoningAgents: WaldiezAgentReasoning[];
        captainAgents: WaldiezAgentCaptain[];
    } = {
        userProxyAgents: getFlowAgents(
            "user_proxy",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentUserProxy[],
        assistantAgents: getFlowAgents(
            "assistant",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentAssistant[],
        ragUserProxyAgents: getFlowAgents(
            "rag_user_proxy",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentRagUser[],
        reasoningAgents: getFlowAgents(
            "reasoning",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentReasoning[],
        captainAgents: getFlowAgents(
            "captain",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentCaptain[],
    };
    return agents;
};

const getFlowAgents = (
    agentType: WaldiezAgentType,
    json: Record<string, unknown>,
    nodes: Node[],
    modelIds: string[],
    skillIds: string[],
    chatIds: string[],
) => {
    const keyToCheck = `${agentType}_agents`;
    if (!(keyToCheck in json) || !Array.isArray(json[keyToCheck])) {
        return [] as WaldiezAgent[];
    }
    const jsonEntries = json[keyToCheck] as Record<string, unknown>[];
    const agents: WaldiezAgent[] = [];
    const nodeIds = nodes.map(node => node.id);
    nodes.forEach(node => {
        if (node.type === "agent") {
            const agentJson = jsonEntries.find(agentJson => {
                return getIdFromJSON(agentJson) === node.id;
            });
            if (agentJson) {
                const nodeExtras = { ...node } as Record<string, unknown>;
                delete nodeExtras.id;
                delete nodeExtras.data;
                delete nodeExtras.type;
                delete nodeExtras.parentId;
                // delete nodeExtras.agentType;
                const waldiezAgent = agentMapper.importAgent({
                    ...agentJson,
                    ...nodeExtras,
                });
                agents.push(waldiezAgent);
            }
        }
    });
    return validateAgents(agentType, agents, modelIds, skillIds, chatIds, nodeIds);
};
const validateAgents = (
    agentType: WaldiezAgentType,
    imported: WaldiezAgent[],
    modelIds: string[],
    skillIds: string[],
    chatIds: string[],
    nodeIds: string[],
) => {
    const agents = imported
        .map(agent => {
            return filterAgentModelIds(agent, modelIds);
        })
        .map(agent => {
            return filterAgentSkills(agent, skillIds);
        })
        .map(agent => {
            return filterAgentNestedChats(agent, nodeIds, chatIds);
        });
    if (agentType === "rag_user_proxy") {
        return filterRagUserProxyAgents(agents as WaldiezAgentRagUser[], modelIds);
    }
    return agents;
};

const filterAgentModelIds = (agent: WaldiezAgent, modelIds: string[]) => {
    const currentModelIds = modelIds.filter(modelId => agent.data.modelIds.includes(modelId));
    agent.data.modelIds = currentModelIds;
    return agent;
};

const filterAgentSkills = (agent: WaldiezAgent, skillIds: string[]) => {
    const currentSkillIds = skillIds.filter(skillId => agent.data.skills.some(skill => skill.id === skillId));
    agent.data.skills = agent.data.skills.filter(skill => currentSkillIds.includes(skill.id));
    return agent;
};

const filterAgentNestedChats = (agent: WaldiezAgent, nodeIds: string[], chatIds: string[]) => {
    // old version: [{ triggeredBy: [{id: string, isReply: boolean}], messages: [{ id: string, isReply: boolean }] }]
    // new version: [{ triggeredBy: string[], messages: [{ id: string, isReply: boolean }] }]
    // in the old version, the id is the id of the Edge (agents connection)
    // in the new version, the id is the id of the Node (the agent that can trigger the nested chat)
    // let's try to handle both versions here
    agent.data.nestedChats = agent.data.nestedChats.filter(nestedChat =>
        nestedChat.triggeredBy.some(trigger => chatIds.includes(trigger) || nodeIds.includes(trigger)),
    );
    agent.data.nestedChats.forEach(nestedChat => {
        nestedChat.messages = nestedChat.messages.filter(
            message => chatIds.includes(message.id) || nodeIds.includes(message.id),
        );
    });
    return agent;
};

const filterRagUserProxyAgents = (agents: WaldiezAgentRagUser[], modelIds: string[]) => {
    return agents.map(agent => {
        if (
            "data" in agent &&
            typeof agent.data === "object" &&
            "retrieveConfig" in agent.data &&
            typeof agent.data.retrieveConfig === "object" &&
            agent.data.retrieveConfig &&
            "model" in agent.data.retrieveConfig &&
            typeof agent.data.retrieveConfig.model === "string"
        ) {
            const modelId = agent.data.retrieveConfig.model;
            if (!modelIds.includes(modelId)) {
                agent.data.retrieveConfig.model = null;
            }
        }
        return agent;
    });
};
