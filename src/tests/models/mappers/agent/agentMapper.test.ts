/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    WaldiezAgentAssistant,
    WaldiezAgentCaptain,
    WaldiezAgentCaptainData,
    WaldiezAgentData,
    WaldiezAgentRagUser,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoning,
    WaldiezAgentReasoningData,
    WaldiezAgentUserProxy,
} from "@waldiez/models/Agent";
import { agentMapper } from "@waldiez/models/mappers";

import { assistantJson, captainJson, ragUserJson, userJson } from "./data";

describe("agentMapper", () => {
    it("should throw an error when importing without a json", () => {
        expect(() => agentMapper.importAgent(undefined)).toThrow();
    });
    it("should import a user agent", () => {
        const agent = agentMapper.importAgent(userJson);
        expect(agent).toBeInstanceOf(WaldiezAgentUserProxy);
        expect(agent.data).toBeInstanceOf(WaldiezAgentData);
        expect(agent.agentType).toBe("user_proxy");
    });
    it("should import an assistant agent", () => {
        const agent = agentMapper.importAgent(assistantJson);
        expect(agent).toBeInstanceOf(WaldiezAgentAssistant);
        expect(agent.data).toBeInstanceOf(WaldiezAgentData);
        expect(agent.agentType).toBe("assistant");
    });
    it("should import a rag user agent", () => {
        const agent = agentMapper.importAgent(ragUserJson);
        expect(agent).toBeInstanceOf(WaldiezAgentRagUser);
        expect(agent.data).toBeInstanceOf(WaldiezAgentRagUserData);
        expect(agent.agentType).toBe("rag_user_proxy");
        expect((agent.data as any).retrieveConfig).toBeTruthy();
    });
    it("should import a reasoning agent", () => {
        const reasoningJson = {
            ...assistantJson,
            agentType: "reasoning",
            data: {
                ...userJson.data,
                verbose: true,
                reasonConfig: {
                    method: "beam_search",
                    max_depth: 3,
                    forest_size: 4,
                    rating_scale: 5,
                    beam_size: 6,
                    answer_approach: "pool",
                    nsim: 7,
                    exploration_constant: 1.6,
                },
            },
        };
        const agent = agentMapper.importAgent(reasoningJson);
        expect(agent).toBeInstanceOf(WaldiezAgentReasoning);
        expect(agent.data).toBeInstanceOf(WaldiezAgentReasoningData);
        expect(agent.agentType).toBe("reasoning");
        expect((agent.data as any).reasonConfig).toBeTruthy();
    });
    it("should import a captain agent", () => {
        const agent = agentMapper.importAgent(captainJson);
        expect(agent).toBeInstanceOf(WaldiezAgentCaptain);
        expect(agent.data).toBeInstanceOf(WaldiezAgentCaptainData);
        expect(agent.agentType).toBe("captain");
    });
    it("should import, convert and export a user agent node", () => {
        const agent = agentMapper.importAgent(userJson);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, false);
        expect(exported).toEqual(userJson);
    });
    it("should import, convert and export an assistant agent node", () => {
        const agent = agentMapper.importAgent(assistantJson);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, false);
        expect(exported).toEqual(assistantJson);
    });
    it("should import, convert and export a rag user agent node", () => {
        const agent = agentMapper.importAgent(ragUserJson);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, false);
        expect(exported).toEqual(ragUserJson);
    });
    it("should import, convert and export a reasoning agent node", () => {
        const reasoningJson = {
            ...assistantJson,
            agentType: "reasoning",
            data: {
                ...userJson.data,
                verbose: true,
                reasonConfig: {
                    method: "beam_search",
                    max_depth: 3,
                    forest_size: 4,
                    rating_scale: 5,
                    beam_size: 6,
                    answer_approach: "pool",
                    nsim: 7,
                    exploration_constant: 1.6,
                },
            },
        };
        const agent = agentMapper.importAgent(reasoningJson);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, false);
        expect(exported).toEqual(reasoningJson);
    });
    it("should import, convert and export a captain agent node", () => {
        const agent = agentMapper.importAgent(captainJson);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, false);
        expect(exported).toEqual(captainJson);
    });
    it("should import, convert and export a rag user without links in retrieveConfig", () => {
        const ragUserWitLinks = {
            ...ragUserJson,
            data: {
                ...ragUserJson.data,
                retrieveConfig: {
                    ...ragUserJson.data.retrieveConfig,
                    model: "wm-1",
                    docsPath: ["docs"],
                },
            },
        };
        const agent = agentMapper.importAgent(ragUserWitLinks);
        const agentNode = agentMapper.asNode(agent, undefined, false);
        const exported = agentMapper.exportAgent(agentNode, true);
        expect(exported).toEqual(ragUserJson);
    });
    // const jsonData = (json.data || json) as Record<string, unknown>;
    it("should use the json if data is not present", () => {
        const agentWithoutData = {
            ...userJson,
            ...userJson.data,
        } as any;
        delete agentWithoutData.data;
        const agent = agentMapper.importAgent(agentWithoutData);
        expect(agent).toBeInstanceOf(WaldiezAgentUserProxy);
    });
});
