/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    WaldiezAgentGroupManager,
    WaldiezAgentGroupManagerData,
    WaldiezAgentGroupManagerSpeakers,
} from "@waldiez/models/Agent";

describe("WaldiezAgentGroupManager", () => {
    it("should create a new instance", () => {
        const groupManager = new WaldiezAgentGroupManager({
            id: "groupManagerId",
            agentType: "manager",
            name: "Manager",
            description: "A group manager agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezAgentGroupManagerData(),
        });

        expect(groupManager).toBeDefined();
        expect(groupManager.id).toBe("groupManagerId");
        const manager2 = WaldiezAgentGroupManager.create("manager");
        expect(manager2).toBeDefined();
        expect(manager2.data.humanInputMode).toBe("NEVER");
    });
    /* eslint-disable max-statements */
    it("should create a new instance with custom data", () => {
        const speakers = new WaldiezAgentGroupManagerSpeakers({
            selectionMethod: "random",
            selectionCustomMethod: "custom",
            maxRetriesForSelecting: 1,
            selectionMode: "repeat",
            allowRepeat: true,
            allowedOrDisallowedTransitions: {},
            transitionsType: "allowed",
        });
        const groupManagerData = new WaldiezAgentGroupManagerData({
            humanInputMode: "NEVER",
            systemMessage: null,
            codeExecutionConfig: false,
            agentDefaultAutoReply: null,
            maxConsecutiveAutoReply: null,
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
            maxRound: 1,
            adminName: "admin",
            speakers,
            enableClearHistory: true,
            sendIntroductions: true,
        });
        const groupManager = new WaldiezAgentGroupManager({
            id: "groupManagerId",
            agentType: "manager",
            name: "Manager",
            description: "A group manager agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: groupManagerData,
            rest: { key: "value" },
        });
        expect(groupManager).toBeDefined();
        expect(groupManager.id).toBe("groupManagerId");
        expect(groupManager.name).toBe("Manager");
        expect(groupManager.data.humanInputMode).toBe("NEVER");
        expect(groupManager.description).toBe("A group manager agent");
        expect(groupManager.data.systemMessage).toBeNull();
        expect(groupManager.data.codeExecutionConfig).toBe(false);
        expect(groupManager.data.agentDefaultAutoReply).toBeNull();
        expect(groupManager.data.maxConsecutiveAutoReply).toBeNull();
        expect(groupManager.data.termination).toEqual({
            type: "none",
            keywords: [],
            criterion: null,
            methodContent: null,
        });
        expect(groupManager.data.modelIds).toEqual([]);
        expect(groupManager.data.skills).toEqual([]);
        expect(groupManager.tags).toEqual([]);
        expect(groupManager.requirements).toEqual([]);
        expect(groupManager.data.parentId).toBeNull();
        expect(groupManager.data.maxRound).toBe(1);
        expect(groupManager.data.adminName).toBe("admin");
        expect(groupManager.data.speakers).toEqual(speakers);
        expect(groupManager.data.enableClearHistory).toBe(true);
        expect(groupManager.data.sendIntroductions).toBe(true);
        expect(groupManager.rest).toEqual({ key: "value" });
    });
});
