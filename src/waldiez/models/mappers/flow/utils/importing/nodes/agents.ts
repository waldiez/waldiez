/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import {
    WaldiezAgent,
    WaldiezAgentAssistant,
    WaldiezAgentCaptain,
    WaldiezAgentGroupManager,
    WaldiezAgentRagUser,
    WaldiezAgentReasoning,
    WaldiezAgentSwarm,
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
            users: [],
            assistants: [],
            managers: [],
            rag_users: [],
            swarm_agents: [],
            reasoning_agents: [],
            captain_agents: [],
        };
    }
    const agentsJson = json.agents as Record<string, unknown>;
    const agents: {
        users: WaldiezAgentUserProxy[];
        assistants: WaldiezAgentAssistant[];
        managers: WaldiezAgentGroupManager[];
        rag_users: WaldiezAgentRagUser[];
        swarm_agents: WaldiezAgentSwarm[];
        reasoning_agents: WaldiezAgentReasoning[];
        captain_agents: WaldiezAgentCaptain[];
    } = {
        users: getFlowAgents(
            "user",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentUserProxy[],
        assistants: getFlowAgents(
            "assistant",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentAssistant[],
        managers: getFlowAgents(
            "manager",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentGroupManager[],
        rag_users: getFlowAgents(
            "rag_user",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentRagUser[],
        swarm_agents: getFlowAgents(
            "swarm",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentSwarm[],
        reasoning_agents: getFlowAgents(
            "reasoning",
            agentsJson,
            nodes,
            modelIds,
            skillIds,
            chatIds,
        ) as WaldiezAgentReasoning[],
        captain_agents: getFlowAgents(
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
    let keyToCheck = `${agentType}s`;
    if (["swarm", "reasoning", "captain"].includes(agentType)) {
        keyToCheck = `${agentType}_agents`;
    }
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
                const waldiezAgent = agentMapper.importAgent({ ...agentJson, ...nodeExtras });
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
    if (agentType === "rag_user") {
        return filterGroupRagUsers(agents as WaldiezAgentRagUser[], modelIds);
    }
    if (agentType === "manager") {
        return filterGroupManagerSpeakers(agents as WaldiezAgentGroupManager[], nodeIds);
    }
    if (agentType === "swarm") {
        return filterSwarmAgentFunctions(agents as WaldiezAgentSwarm[], skillIds);
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

const filterGroupRagUsers = (agents: WaldiezAgentRagUser[], modelIds: string[]) => {
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

const filterGroupManagerSpeakers = (managers: WaldiezAgentGroupManager[], agentIds: string[]) => {
    // also check the "speakers" property
    // - if allowRepeat is an array (list of allowed agent[id]s), check if all the values are in the nodeIds/agentIds
    // - if allowedOrDisallowedTransitions is an object 9agent => list[agent], check if all the keys and values are in the nodeIds/agentIds
    return managers.map(manager => {
        if (
            "data" in manager &&
            typeof manager.data === "object" &&
            "speakers" in manager.data &&
            typeof manager.data.speakers === "object" &&
            manager.data.speakers
        ) {
            if (
                "allowRepeat" in manager.data.speakers &&
                Array.isArray(manager.data.speakers.allowRepeat) &&
                manager.data.speakers.allowRepeat.length > 0
            ) {
                manager.data.speakers.allowRepeat = manager.data.speakers.allowRepeat.filter(value =>
                    agentIds.includes(value),
                );
            }
            if (
                "allowedOrDisallowedTransitions" in manager.data.speakers &&
                typeof manager.data.speakers.allowedOrDisallowedTransitions === "object"
            ) {
                const allowedOrDisallowedTransitions = manager.data.speakers.allowedOrDisallowedTransitions;
                const keys = Object.keys(allowedOrDisallowedTransitions);
                keys.forEach(key => {
                    allowedOrDisallowedTransitions[key] = allowedOrDisallowedTransitions[key].filter(value =>
                        agentIds.includes(value),
                    );
                });
            }
        }
        return manager;
    });
};

const filterSwarmAgentFunctions = (agents: WaldiezAgentSwarm[], skillIds: string[]) => {
    return agents.map(agent => {
        if (
            "data" in agent &&
            typeof agent.data === "object" &&
            "functions" in agent.data &&
            Array.isArray(agent.data.functions)
        ) {
            agent.data.functions = agent.data.functions.filter(func => skillIds.includes(func));
        }
        return agent;
    });
};
