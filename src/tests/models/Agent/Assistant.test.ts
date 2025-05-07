/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezAgentAssistant, WaldiezAgentAssistantData } from "@waldiez/models/Agent/Assistant";

describe("WaldiezAgentAssistant", () => {
    it("should be created with an id and data", () => {
        const assistantData = new WaldiezAgentAssistantData();
        const assistant = new WaldiezAgentAssistant({
            id: "wa-1",
            agentType: "assistant",
            name: "Assistant",
            description: "An assistant agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: assistantData,
        });

        expect(assistant.id).toBe("wa-1");
        expect(assistant.data).toBe(assistantData);
        const assistant2 = WaldiezAgentAssistant.create("assistant");
        expect(assistant2).toBeTruthy();
        expect(assistant2.data.humanInputMode).toBe("NEVER");
    });
    it("should be created with an id, data and rest", () => {
        const assistantData = new WaldiezAgentAssistantData();
        const assistant = new WaldiezAgentAssistant({
            id: "wa-1",
            agentType: "assistant",
            name: "Assistant",
            description: "An assistant agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: assistantData,
            rest: { key: "value" },
        });

        expect(assistant.id).toBe("wa-1");
        expect(assistant.data).toBe(assistantData);
        expect(assistant.rest).toEqual({ key: "value" });
    });
    it("should be created with custom data", () => {
        const assistantData = new WaldiezAgentAssistantData({
            humanInputMode: "NEVER",
            systemMessage: null,
            codeExecutionConfig: {
                workDir: "code",
                useDocker: undefined,
                timeout: 30,
                lastNMessages: "auto",
            },
            agentDefaultAutoReply: "auto_reply",
            maxConsecutiveAutoReply: 5,
            termination: {
                type: "keyword",
                keywords: ["TERMINATE", "OK"],
                criterion: "ending",
                methodContent: null,
            },
            modelIds: ["1", "2"],
            skills: [
                {
                    id: "1",
                    executorId: "2",
                },
            ],
            parentId: undefined,
            nestedChats: [
                {
                    triggeredBy: ["1", "2"],
                    messages: [
                        { id: "1", isReply: false },
                        { id: "2", isReply: true },
                    ],
                },
            ],
            contextVariables: {},
            handoffs: [],
            isMultimodal: false,
        });
        const assistant = new WaldiezAgentAssistant({
            id: "assistant",
            name: "assistant",
            description: "description",
            tags: ["tag1", "tag2"],
            requirements: ["req1", "req2"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            agentType: "assistant",
            data: assistantData,
        });

        expect(assistant.id).toBe("assistant");
        expect(assistant.name).toBe("assistant");
        expect(assistant.description).toBe("description");
        expect(assistant.data.humanInputMode).toBe("NEVER");
        expect(assistant.data.systemMessage).toBe(null);
        expect(assistant.data.codeExecutionConfig).toEqual({
            workDir: "code",
            useDocker: undefined,
            timeout: 30,
            lastNMessages: "auto",
        });
        expect(assistant.data.agentDefaultAutoReply).toBe("auto_reply");
        expect(assistant.data.maxConsecutiveAutoReply).toBe(5);
        expect(assistant.data.termination).toEqual({
            type: "keyword",
            keywords: ["TERMINATE", "OK"],
            criterion: "ending",
            methodContent: null,
        });
        expect(assistant.data.modelIds).toEqual(["1", "2"]);
        expect(assistant.data.skills).toEqual([
            {
                id: "1",
                executorId: "2",
            },
        ]);
        expect(assistant.tags).toEqual(["tag1", "tag2"]);
        expect(assistant.requirements).toEqual(["req1", "req2"]);
    });
});
