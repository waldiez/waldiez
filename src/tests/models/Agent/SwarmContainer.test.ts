/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezAgentSwarmContainer, WaldiezAgentSwarmContainerData } from "@waldiez/models/Agent";

describe("WaldiezAgentSwarmContainer", () => {
    it("should create an instance of WaldiezAgentSwarmContainer", () => {
        const swarmContainerData = new WaldiezAgentSwarmContainerData();
        const swarmContainer = new WaldiezAgentSwarmContainer({
            id: "1",
            agentType: "swarm_container",
            name: "Swarm Container",
            description: "A Swarm Container agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: swarmContainerData,
        });
        expect(swarmContainer).toBeTruthy();
        expect(swarmContainer.id).toBe("1");
        expect(swarmContainer.data).toBe(swarmContainerData);
        expect(swarmContainer.agentType).toBe("swarm_container");
        const swarmContainer2 = WaldiezAgentSwarmContainer.create("swarm_container");
        expect(swarmContainer2).toBeTruthy();
        expect(swarmContainer2.data.humanInputMode).toBe("NEVER");
    });
    it("should create an instance of WaldiezAgentSwarmContainer with custom data", () => {
        const swarmContainerData = new WaldiezAgentSwarmContainerData({
            humanInputMode: "ALWAYS",
            systemMessage: "system_message",
            codeExecutionConfig: false,
            agentDefaultAutoReply: "auto_reply",
            maxConsecutiveAutoReply: 3,
            termination: {
                type: "none",
                keywords: [],
                criterion: null,
                methodContent: null,
            },
            modelIds: [],
            skills: [],
            parentId: null,
            nestedChats: [],
            maxRounds: 1,
            initialAgent: "1",
            contextVariables: { key: "value" },
            afterWork: {
                recipientType: "option",
                recipient: "TERMINATE",
            },
        });
        const swarmContainer = new WaldiezAgentSwarmContainer({
            id: "1",
            agentType: "swarm_container",
            name: "SwarmContainer",
            description: "SwarmContainer description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: swarmContainerData,
            rest: { key: "42" },
        });
        expect(swarmContainer).toBeTruthy();
        expect(swarmContainer.id).toBe("1");
        expect(swarmContainer.data).toBe(swarmContainerData);
        expect(swarmContainer.agentType).toBe("swarm_container");
        expect(swarmContainer.rest).toEqual({ key: "42" });
    });
});
