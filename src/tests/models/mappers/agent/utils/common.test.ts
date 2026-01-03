/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getAgentDefaultAutoReply,
    getAgentId,
    getAgentMeta,
    getAgentName,
    getAgentType,
    getCodeExecutionConfig,
    getFallbackDescription,
    getHumanInputMode,
    getMaximumConsecutiveAutoReply,
    getModelIds,
    getNestedChats,
    getParentId,
    getSystemMessage,
    getTools,
} from "@waldiez/models/mappers/agent/utils/common";

describe("getAgentId", () => {
    it("should return a new id", () => {
        const id = getAgentId({});
        expect(id).toBeTruthy();
    });
    it("should return the id from the data", () => {
        const id = getAgentId({ id: "wa-1" }, "wa-2");
        expect(id).toBe("wa-2");
    });
});

describe("getAgentType", () => {
    it("should return the agent type", () => {
        const agentType = getAgentType({ agentType: "user_proxy" });
        expect(agentType).toBe("user_proxy");
    });
    it("should return the agent type from the data", () => {
        const agentType = getAgentType({ data: { agentType: "assistant" } });
        expect(agentType).toBe("assistant");
    });
    it("should return the default agent type", () => {
        const agentType = getAgentType({});
        expect(agentType).toBe("user_proxy");
    });
});

describe("getFallbackDescription", () => {
    it("should return the user fallback description", () => {
        const description = getFallbackDescription("user_proxy");
        expect(description).toBe("A user agent");
    });
    it("should return the assistant fallback description", () => {
        const description = getFallbackDescription("assistant");
        expect(description).toBe("An assistant agent");
    });
    it("should return the rag user fallback description", () => {
        const description = getFallbackDescription("rag_user_proxy");
        expect(description).toBe("A RAG user agent");
    });
});

describe("getAgentMeta", () => {
    it("should return the agent meta", () => {
        const meta = getAgentMeta({}, "user_proxy");
        expect(meta).toBeTruthy();
    });
});

describe("getSystemMessage", () => {
    it("should return the system message", () => {
        const message = getSystemMessage({ systemMessage: "test" });
        expect(message).toBe("test");
    });
    it("should return null", () => {
        const message = getSystemMessage({});
        expect(message).toBeNull();
    });
});

describe("getHumanInputMode", () => {
    it("should return the default human input mode if the agent is user", () => {
        const mode = getHumanInputMode({}, "user_proxy");
        expect(mode).toBe("ALWAYS");
    });
    it("should return the default human input mode if the agent is an assistant", () => {
        const mode = getHumanInputMode({}, "assistant");
        expect(mode).toBe("NEVER");
    });
    it("should return the default human input mode if the agent is a rag user", () => {
        const mode = getHumanInputMode({}, "rag_user_proxy");
        expect(mode).toBe("ALWAYS");
    });
    it("should return the human input mode from the data", () => {
        const mode = getHumanInputMode({ humanInputMode: "NEVER" }, "user_proxy");
        expect(mode).toBe("NEVER");
    });
});

describe("getCodeExecutionConfig", () => {
    it("should return the code execution config", () => {
        const config = getCodeExecutionConfig({ codeExecutionConfig: {} });
        expect(config).toBeTruthy();
    });
    it("should return false", () => {
        const config = getCodeExecutionConfig({});
        expect(config).toBe(false);
    });
});

describe("getAgentDefaultAutoReply", () => {
    it("should return the default auto reply", () => {
        const reply = getAgentDefaultAutoReply({
            agentDefaultAutoReply: "test",
        });
        expect(reply).toBe("test");
    });
    it("should return null", () => {
        const reply = getAgentDefaultAutoReply({});
        expect(reply).toBeNull();
    });
});

describe("getMaximumConsecutiveAutoReply", () => {
    it("should return the maximum consecutive auto reply", () => {
        const max = getMaximumConsecutiveAutoReply({
            maxConsecutiveAutoReply: 3,
        });
        expect(max).toBe(3);
    });
    it("should return null", () => {
        const max = getMaximumConsecutiveAutoReply({});
        expect(max).toBeNull();
    });
});

describe("getModelIds", () => {
    it("should return the model id", () => {
        const ids = getModelIds({ modelIds: ["model-1"] });
        expect(ids).toEqual(["model-1"]);
    });
    it("should return an empty array", () => {
        const ids = getModelIds({});
        expect(ids).toEqual([]);
    });
});

describe("getTools", () => {
    it("should return the tools", () => {
        const tools = getTools({
            tools: [{ id: "tool-1", executorId: "wa-1" }],
        });
        expect(tools).toEqual([{ id: "tool-1", executorId: "wa-1" }]);
    });
    it("should return an empty array", () => {
        const tools = getTools({});
        expect(tools).toEqual([]);
    });
});

describe("getAgentName", () => {
    it("should return the agent name", () => {
        const name = getAgentName({ name: "test" }, "user_proxy");
        expect(name).toBe("test");
    });
    it("should return the fallback name", () => {
        const name = getAgentName({}, "assistant");
        expect(name).toBe("Assistant");
    });
    it("should return the fallback name for a rag user", () => {
        const name = getAgentName({}, "rag_user_proxy");
        expect(name).toBe("RAG User");
    });
});

describe("getParentId", () => {
    it("should return the parent id", () => {
        const id = getParentId({ parentId: "wa-1" }, "user_proxy");
        expect(id).toBe("wa-1");
    });
    it("should return null if no parent id in the data", () => {
        const id = getParentId({}, "user_proxy");
        expect(id).toBeUndefined();
    });
});

describe("getNestedChats", () => {
    it("should return the nested chats", () => {
        const chats = getNestedChats({
            nestedChats: [
                {
                    triggeredBy: ["wa-1"],
                    messages: [{ id: "wa-2", isReply: false }],
                    condition: {
                        conditionType: "string_llm",
                        prompt: "Start a new chat",
                    },
                    available: {
                        type: "none",
                        value: "",
                    },
                },
            ],
        });
        expect(chats).toEqual([
            {
                triggeredBy: ["wa-1"],
                messages: [{ id: "wa-2", isReply: false }],
                condition: {
                    conditionType: "string_llm",
                    prompt: "Start a new chat",
                },
                available: {
                    type: "none",
                    value: "",
                },
            },
        ]);
    });
    it("should return a default nested chat structure with no messages or triggers", () => {
        const chats = getNestedChats({});
        expect(chats).toEqual([
            {
                triggeredBy: [],
                messages: [],
                condition: {
                    conditionType: "string_llm",
                    prompt: "",
                },
                available: {
                    type: "none",
                    value: "",
                },
            },
        ]);
    });
});
