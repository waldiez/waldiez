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
            userProxyAgents: [],
            assistantAgents: [],
            ragUserProxyAgents: [],
            reasoningAgents: [],
            captainAgents: [],
            groupManagerAgents: [],
        });
    });
    it("should not import agents if agents is not in the json", () => {
        const json = {};
        const nodes: any[] = [];
        const agents = getAgents(json, nodes, [], [], []);
        expect(agents).toEqual({
            userProxyAgents: [],
            assistantAgents: [],
            ragUserProxyAgents: [],
            reasoningAgents: [],
            captainAgents: [],
            groupManagerAgents: [],
        });
    });
    it("should return empty arrays if there are no nodes", () => {
        const json = {
            agents: {
                userProxyAgents: [{ id: "wa-1", type: "agent", agentType: "user_proxy" }],
                assistantAgents: [{ id: "wa-2", type: "agent", agentType: "assistant" }],
                ragUserProxyAgents: [{ id: "wa-4", type: "agent", agentType: "rag_user_proxy" }],
                reasoningAgents: [{ id: "wa-6", type: "agent", agentType: "reasoning" }],
                captainAgents: [{ id: "wa-7", type: "agent", agentType: "captain" }],
            },
        };
        const nodes: any[] = [];
        const agents = getAgents(json, nodes, [], [], []);
        expect(agents).toEqual({
            userProxyAgents: [],
            assistantAgents: [],
            ragUserProxyAgents: [],
            reasoningAgents: [],
            captainAgents: [],
            groupManagerAgents: [],
        });
    });
    it("should not return agents if there is no match in the nodes", () => {
        const json = {
            agents: {
                userProxyAgents: [{ id: "wa-1", type: "agent", agentType: "user_proxy" }],
                ragUserProxyAgents: [{ id: "wa-4", type: "agent", agentType: "rag_user_proxy" }],
                reasoningAgents: [{ id: "wa-6", type: "agent", agentType: "reasoning" }],
                captainAgents: [{ id: "wa-7", type: "agent", agentType: "captain" }],
            },
        };
        const nodes: any[] = [{ id: "wa-2", type: "agent", data: {} }];
        const agents = getAgents(json, nodes, ["wm-1"], ["ws-1"], ["we-1"]);
        expect(agents).toEqual({
            userProxyAgents: [],
            assistantAgents: [],
            ragUserProxyAgents: [],
            reasoningAgents: [],
            captainAgents: [],
            groupManagerAgents: [],
        });
    });
});
