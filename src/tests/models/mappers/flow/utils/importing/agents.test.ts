/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getAgents } from "@waldiez/models/mappers/flow/utils";

describe("getAgents", () => {
    it("should not import agents if agents is not an object", () => {
        const json = {};
        const nodes: any[] = [];
        const agents = getAgents(json, nodes, [], [], []);
        expect(agents).toEqual({
            users: [],
            assistants: [],
            rag_users: [],
            reasoning_agents: [],
            captain_agents: [],
        });
    });
    it("should not import agents if agents is not in the json", () => {
        const json = {};
        const nodes: any[] = [];
        const agents = getAgents(json, nodes, [], [], []);
        expect(agents).toEqual({
            users: [],
            assistants: [],
            rag_users: [],
            reasoning_agents: [],
            captain_agents: [],
        });
    });
    it("should return empty arrays if there are no nodes", () => {
        const json = {
            agents: {
                users: [{ id: "wa-1", type: "agent", agentType: "user" }],
                assistants: [{ id: "wa-2", type: "agent", agentType: "assistant" }],
                rag_users: [{ id: "wa-4", type: "agent", agentType: "rag_user" }],
                reasoning_agents: [{ id: "wa-6", type: "agent", agentType: "reasoning" }],
                captain_agents: [{ id: "wa-7", type: "agent", agentType: "captain" }],
            },
        };
        const nodes: any[] = [];
        const agents = getAgents(json, nodes, [], [], []);
        expect(agents).toEqual({
            users: [],
            assistants: [],
            rag_users: [],
            reasoning_agents: [],
            captain_agents: [],
        });
    });
    it("should not return agents if there is no match in the nodes", () => {
        const json = {
            agents: {
                users: [{ id: "wa-1", type: "agent", agentType: "user" }],
                rag_users: [{ id: "wa-4", type: "agent", agentType: "rag_user" }],
                reasoning_agents: [{ id: "wa-6", type: "agent", agentType: "reasoning" }],
                captain_agents: [{ id: "wa-7", type: "agent", agentType: "captain" }],
            },
        };
        const nodes: any[] = [{ id: "wa-2", type: "agent", data: {} }];
        const agents = getAgents(json, nodes, ["wm-1"], ["ws-1"], ["we-1"]);
        expect(agents).toEqual({
            users: [],
            assistants: [],
            rag_users: [],
            reasoning_agents: [],
            captain_agents: [],
        });
    });
});
