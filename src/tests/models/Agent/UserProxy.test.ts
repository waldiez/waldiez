/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { describe, expect, it } from "vitest";

import { WaldiezAgentUserProxy, WaldiezAgentUserProxyData } from "@waldiez/models/Agent/UserProxy";

describe("WaldiezAgentUserProxy", () => {
    it("should create a new instance of WaldiezAgentUserProxy", () => {
        const userProxyData = new WaldiezAgentUserProxyData();
        const userProxy = new WaldiezAgentUserProxy({
            id: "1",
            name: "user_proxy",
            description: "User description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            agentType: "user_proxy",
            data: userProxyData,
        });
        expect(userProxy).toBeTruthy();
        expect(userProxy.id).toBe("1");
        expect(userProxy.name).toBe("user_proxy");
        expect(userProxy.data.humanInputMode).toBe("ALWAYS");
        const userProxy2 = WaldiezAgentUserProxy.create("user_proxy");
        expect(userProxy2).toBeTruthy();
        expect(userProxy2.data.humanInputMode).toBe("ALWAYS");
    });
    it("should create a new instance of WaldiezAgentUserProxy with custom data", () => {
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const userProxyData = new WaldiezAgentUserProxyData({
            humanInputMode: "ALWAYS",
            systemMessage: "system_message",
            codeExecutionConfig: {
                workDir: "code",
                useDocker: true,
                timeout: 30,
                lastNMessages: "auto",
            },
            agentDefaultAutoReply: "auto_reply",
            maxConsecutiveAutoReply: 5,
            termination: {
                type: "none",
                keywords: [],
                criterion: null,
                methodContent: null,
            },
            modelIds: ["1", "2"],
            skills: [
                {
                    id: "1",
                    executorId: "2",
                },
            ],
            parentId: null,
            nestedChats: [
                {
                    triggeredBy: ["1", "2"],
                    messages: [
                        { id: "1", isReply: false },
                        { id: "2", isReply: true },
                    ],
                },
            ],
        });
        const userProxy = new WaldiezAgentUserProxy({
            id: "1",
            agentType: "user_proxy",
            name: "custom_user",
            description: "custom_description",
            tags: ["tag1", "tag2"],
            requirements: ["req1", "req2"],
            createdAt,
            updatedAt,
            data: userProxyData,
            rest: { key: "42" },
        });
        expect(userProxy).toBeTruthy();
        expect(userProxy.id).toBe("1");
        expect(userProxy.name).toBe("custom_user");
        expect(userProxy.description).toBe("custom_description");
        expect(userProxy.data.humanInputMode).toBe("ALWAYS");
        expect(userProxy.data.systemMessage).toBe("system_message");
        expect(userProxy.data.codeExecutionConfig).toEqual({
            workDir: "code",
            useDocker: true,
            timeout: 30,
            lastNMessages: "auto",
        });
        expect(userProxy.data.agentDefaultAutoReply).toBe("auto_reply");
        expect(userProxy.data.maxConsecutiveAutoReply).toBe(5);
        expect(userProxy.data.termination).toEqual({
            type: "none",
            keywords: [],
            criterion: null,
            methodContent: null,
        });
        expect(userProxy.data.modelIds).toEqual(["1", "2"]);
        expect(userProxy.data.skills).toEqual([
            {
                id: "1",
                executorId: "2",
            },
        ]);
        expect(userProxy.tags).toEqual(["tag1", "tag2"]);
        expect(userProxy.requirements).toEqual(["req1", "req2"]);
        expect(userProxy.createdAt).toBe(createdAt);
        expect(userProxy.updatedAt).toBe(updatedAt);
        expect(userProxy.data.parentId).toBeNull();
        expect(userProxy.data.nestedChats).toEqual([
            {
                triggeredBy: ["1", "2"],
                messages: [
                    { id: "1", isReply: false },
                    { id: "2", isReply: true },
                ],
            },
        ]);
    });
});
