/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { emptyFlow } from "@waldiez/models/Flow";
import { flowMapper } from "@waldiez/models/mappers";

/* cspell: disable */
const flowLinksBaseUrl = "https://raw.githubusercontent.com/waldiez/examples/refs/heads/main";
const flowLinks = [
    `${flowLinksBaseUrl}/01 - Standup Comedians/Standup Comedians 1.waldiez`,
    `${flowLinksBaseUrl}/01 - Standup Comedians/Standup Comedians 2.waldiez`,
    `${flowLinksBaseUrl}/01 - Standup Comedians/Standup Comedians 3.waldiez`,
    `${flowLinksBaseUrl}/02 - On-boarding/On-boarding.waldiez`,
    `${flowLinksBaseUrl}/02 - On-boarding/On-boarding Async.waldiez`,
    `${flowLinksBaseUrl}/03 - Reflection/Reflection.waldiez`,
    `${flowLinksBaseUrl}/04 - Tools/Tool Use.waldiez`,
    `${flowLinksBaseUrl}/05 - Coding/Coding.waldiez`,
    `${flowLinksBaseUrl}/06 - Planning/Planning 1.waldiez`,
    `${flowLinksBaseUrl}/06 - Planning/Planning 2.waldiez`,
    `${flowLinksBaseUrl}/07 - Group chat with RAG/RAG.waldiez`,
    `${flowLinksBaseUrl}/08 - ReAct using Tavily/ReAct.waldiez`,
    `${flowLinksBaseUrl}/09 - AutoDefence/AutoDefense Flow.waldiez`,
    `${flowLinksBaseUrl}/10 - Travel Planning/Travel Planning.waldiez`,
    `${flowLinksBaseUrl}/11 - Swarm/Swarm.waldiez`,
    `${flowLinksBaseUrl}/12 - Reasoning/Chain-of-Thought Reasoning with DFS.waldiez`,
];

// we removed "teachability"
const deprecatedAgentDataKeys = ["teachability"];
const newAgents = ["reasoning_agents", "captain_agents"];
// flowAfterWork, added with swarm, "prerequisites" added with async
const newChatKeys = ["prerequisites", "flowAfterWork"];
// these keys are not necessarily in the exported flows
// "hidden" is determined by the source, the target and the parenntId (if any)
const edgeKeysToIgnore: string[] = ["hidden"];
// id: either missing, or overridden when importing/exporting
const flowKeysToRemove: string[] = ["id"];
// new (flow.data) keys that were not in the exported flows
const flowDataKeysToRemove: string[] = [];
// skillType is new
const skillDataKeysToIgnore: string[] = ["skillType"];

const getFlowStringFromUrl = (url: string) => {
    return fetch(url).then(response => response.text());
};

describe("flowMapper", () => {
    it("should return an empty flow if no json is provided", () => {
        const flow = flowMapper.importFlow("'");
        expect(flow).toEqual(emptyFlow);
    });
    it("is compatible with exported flows", async () => {
        for (const flowLink of flowLinks) {
            const flowString = await getFlowStringFromUrl(flowLink);
            const jsonFlow = JSON.parse(flowString);
            const flow = flowMapper.importFlow(flowString);
            const rfFlow = flowMapper.toReactFlow(flow);
            const flowJson = flowMapper.exportFlow(rfFlow, false, false) as any;
            flowKeysToRemove.forEach(key => {
                delete flowJson[key];
            });
            flowDataKeysToRemove.forEach(key => {
                delete flowJson.data[key];
            });
            jsonFlow.data.agents.users = jsonFlow.data.agents.users.map(updateAgent);
            jsonFlow.data.agents.assistants = jsonFlow.data.agents.assistants.map(updateAgent);
            jsonFlow.data.agents.managers = jsonFlow.data.agents.managers.map(updateAgent);
            jsonFlow.data.agents.rag_users = jsonFlow.data.agents.rag_users.map(updateAgent);
            jsonFlow.data.chats.forEach((chat: any) => updateChat(chat, flowJson));
            jsonFlow.data.edges.forEach((edge: any) => updateEdge(edge, flowJson));
            jsonFlow.data.models.forEach((model: any) => updateModel(model, flowJson));
            jsonFlow.data.skills.forEach((skill: any) => updateSkill(skill, flowJson));
            newAgents.forEach((newAgent: any) => {
                jsonFlow.data.agents[newAgent] = [];
            });
            expect(flow.data.cacheSeed).toEqual(41);
            // console.error(flowLink);
            compareObjects(jsonFlow, flowJson);
        }
    });
});

const compareObjects = (json1: any, json2: any) => {
    Object.keys(json1).forEach(key => {
        if (key !== "data" && key !== "id") {
            expect(json1[key]).toEqual(json2[key]);
        }
    });
    const agentTypes = ["users", "assistants", "managers", "rag_users", "swarm_agents", "reasoning_agents"];
    agentTypes.forEach((agentType: any) => {
        json1.data.agents[agentType].forEach((agent1: any) => {
            const agentId = agent1.id;
            const agent2 = json2.data.agents[agentType].find((a: any) => a.id === agentId);
            expect(agent2).toBeDefined();
            expect(agent1).toEqual(agent2);
        });
    });
    json1.data.models.forEach((model1: any) => {
        const modelId = model1.id;
        const model2 = json2.data.models.find((m: any) => m.id === modelId);
        expect(model2).toBeDefined();
        expect(model1).toEqual(model2);
    });
    json1.data.skills.forEach((skill1: any) => {
        const skillId = skill1.id;
        const skill2 = json2.data.skills.find((s: any) => s.id === skillId);
        expect(skill2).toBeDefined();
        expect(skill1).toEqual(skill2);
    });
    json1.data.chats.forEach((chat1: any) => {
        const chatId = chat1.id;
        const chat2 = json2.data.chats.find((c: any) => c.id === chatId);
        expect(chat2).toBeDefined();
        expect(chat1).toEqual(chat2);
    });
    json1.data.nodes.forEach((node1: any) => {
        const nodeId = node1.id;
        const node2 = json2.data.nodes.find((n: any) => n.id === nodeId);
        expect(node2).toBeDefined();
        expect(node1).toEqual(node2);
    });
    json1.data.edges.forEach((edge1: any) => {
        const edgeId = edge1.id;
        const edge2 = json2.data.edges.find((e: any) => e.id === edgeId);
        expect(edge2).toBeDefined();
        if (edge1.type === "group" && edge2.type === "hidden") {
            edge1.type = "hidden";
        } else if (edge1.type === "hidden" && edge2.type === "group") {
            edge2.type = "hidden";
        }
        expect(edge1).toEqual(edge2);
    });
};

const updateAgent = (agent: any) => {
    // "agentType" should not be in "data" it must be one level up
    if (!agent.agentType && typeof agent.data.agentType === "string") {
        agent.agentType = agent.data.agentType;
    }
    deprecatedAgentDataKeys.forEach(key => {
        delete agent.data[key];
    });
    return agent;
};

const updateChat = (chat: any, oldJson: any) => {
    newChatKeys.forEach(key => {
        chat.data[key] = oldJson.data.chats.find((c: any) => c.id === chat.id).data[key];
    });
};

const updateEdge = (edge: any, oldJson: any) => {
    edgeKeysToIgnore.forEach(key => {
        oldJson.data.edges.find((e: any) => e.id === edge.id)[key] = edge[key];
    });
};

const updateModel = (model: any, oldJson: any) => {
    if (model.data.apiVersion === null || model.data.apiVersion === undefined) {
        // we might not have apiVersion in the exported flow (if null)
        oldJson.data.models = oldJson.data.models.map((m: any) => {
            if (m.id === model.id) {
                m.data.apiVersion = model.data.apiVersion;
            }
            return m;
        });
    }
};

const updateSkill = (skill: any, oldJson: any) => {
    skillDataKeysToIgnore.forEach(key => {
        oldJson.data.skills.find((s: any) => s.id === skill.id).data[key] = skill[key];
    });
};
