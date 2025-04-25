/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    WaldiezAgentSwarm,
    WaldiezAgentSwarmData,
    WaldiezSwarmAfterWork,
    WaldiezSwarmOnCondition,
    WaldiezSwarmUpdateSystemMessage,
} from "@waldiez/models/Agent/Swarm";

describe("WaldiezAgentSwarm", () => {
    it("should create an instance of WaldiezAgentSwarm", () => {
        const swarmData = new WaldiezAgentSwarmData();
        const swarm = new WaldiezAgentSwarm({
            id: "1",
            agentType: "swarm",
            name: "Swarm Agent",
            description: "A Swarm Agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: swarmData,
        });
        expect(swarm).toBeTruthy();
        expect(swarm.id).toBe("1");
        expect(swarm.data).toBe(swarmData);
        expect(swarm.agentType).toBe("swarm");
        const swarm2 = WaldiezAgentSwarm.create("swarm");
        expect(swarm2).toBeTruthy();
        expect(swarm2.data.humanInputMode).toBe("NEVER");
    });
    it("should create an instance of WaldiezAgentSwarm with custom data", () => {
        const swarmData = new WaldiezAgentSwarmData({
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
            functions: ["function1", "function2"],
            updateAgentStateBeforeReply: [
                new WaldiezSwarmUpdateSystemMessage({
                    updateFunctionType: "string",
                    updateFunction: "agent2",
                }),
            ],
            handoffs: [
                new WaldiezSwarmOnCondition({
                    target: { id: "agent2", order: 0 },
                    targetType: "agent",
                    condition: "condition",
                    available: {
                        type: "string",
                        value: "available",
                    },
                }),
                new WaldiezSwarmAfterWork({
                    recipientType: "option",
                    recipient: "STAY",
                }),
                new WaldiezSwarmAfterWork({
                    recipientType: "callable",
                    recipient: "method",
                }),
            ],
            isInitial: false,
        });
        const swarm = new WaldiezAgentSwarm({
            id: "1",
            agentType: "swarm",
            name: "Swarm",
            description: "Swarm description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: swarmData,
            rest: { key: "42" },
        });
        expect(swarm).toBeTruthy();
        expect(swarm.id).toBe("1");
        expect(swarm.name).toBe("Swarm");
        expect(swarm.rest).toEqual({ key: "42" });
        expect(swarm.data.functions).toEqual(["function1", "function2"]);
        expect(swarm.data.updateAgentStateBeforeReply).toEqual([
            new WaldiezSwarmUpdateSystemMessage({
                updateFunctionType: "string",
                updateFunction: "agent2",
            }),
        ]);
        expect(swarm.data.handoffs).toEqual([
            new WaldiezSwarmOnCondition({
                target: { id: "agent2", order: 0 },
                targetType: "agent",
                condition: "condition",
                available: {
                    type: "string",
                    value: "available",
                },
            }),
            new WaldiezSwarmAfterWork({
                recipientType: "option",
                recipient: "STAY",
            }),
            new WaldiezSwarmAfterWork({
                recipientType: "callable",
                recipient: "method",
            }),
        ]);
    });
});
