/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    WaldiezAgentRagUser,
    WaldiezAgentRagUserData,
    defaultRetrieveConfig,
} from "@waldiez/models/Agent/RagUser";

describe("WaldiezAgentRagUser", () => {
    it("should create an instance of WaldiezAgentRagUser", () => {
        const ragUserData = new WaldiezAgentRagUserData();
        const ragUser = new WaldiezAgentRagUser({
            id: "1",
            agentType: "rag_user_proxy",
            name: "RAG User",
            description: "A RAG User agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: ragUserData,
        });
        expect(ragUser).toBeTruthy();
        expect(ragUser.id).toBe("1");
        expect(ragUser.data).toBe(ragUserData);
        expect(ragUser.agentType).toBe("rag_user_proxy");
        const ragUser2 = WaldiezAgentRagUser.create("rag_user_proxy");
        expect(ragUser2).toBeTruthy();
        expect(ragUser2.data.humanInputMode).toBe("ALWAYS");
    });
    it("should create an instance of WaldiezAgentRagUser with custom data", () => {
        const ragUserData = new WaldiezAgentRagUserData({
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
            tools: [],
            parentId: undefined,
            nestedChats: [],
            contextVariables: {},
            handoffs: [],
            retrieveConfig: defaultRetrieveConfig,
            updateAgentStateBeforeReply: [],
        });
        const ragUser = new WaldiezAgentRagUser({
            id: "1",
            agentType: "rag_user_proxy",
            name: "RagUser",
            description: "RagUser description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: ragUserData,
            rest: { key: "42" },
        });
        expect(ragUser).toBeTruthy();
        expect(ragUser.id).toBe("1");
        expect(ragUser.name).toBe("RagUser");
        expect(ragUser.description).toBe("RagUser description");
        expect(ragUser.rest).toEqual({ key: "42" });
    });
});
