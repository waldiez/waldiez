/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { describe, expect, it } from "vitest";

import { WaldiezFlow, WaldiezFlowData, emptyFlow } from "@waldiez/models/Flow";

describe("WaldiezFlow", () => {
    it("should create an instance", () => {
        const flowData = new WaldiezFlowData();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const flow = new WaldiezFlow({
            id: "1",
            name: "Flow",
            description: "Flow Description",
            tags: [],
            requirements: [],
            createdAt,
            updatedAt,
            data: flowData,
            storageId: "1",
        });
        expect(flow).toBeTruthy();
        expect(flow.id).toBe("1");
        expect(flow.name).toBe("Flow");
        expect(flow.description).toBe("Flow Description");
        expect(flow.tags).toEqual([]);
        expect(flow.requirements).toEqual([]);
        expect(flow.createdAt).toBe(createdAt);
        expect(flow.updatedAt).toBe(updatedAt);
        expect(flow.data.agents.users).toEqual([]);
        expect(flow.data.agents.assistants).toEqual([]);
        expect(flow.data.agents.managers).toEqual([]);
        expect(flow.data.agents.rag_users).toEqual([]);
        expect(flow.data.agents.swarm_agents).toEqual([]);
        expect(flow.data.models).toEqual([]);
        expect(flow.data.skills).toEqual([]);
        expect(flow.data.chats).toEqual([]);
        expect(flow.data.isAsync).toBe(false);
    });
    it("should create an async instance", () => {
        const tmpFlow = emptyFlow;
        const flowData = new WaldiezFlowData({
            ...tmpFlow.data,
            isAsync: true,
        });
        const flow = new WaldiezFlow({
            ...tmpFlow,
            data: flowData,
        });
        expect(flow.data.isAsync).toBe(true);
    });
});
