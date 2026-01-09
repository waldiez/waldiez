/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezAgentReasoning, WaldiezAgentReasoningData } from "@waldiez/models/Agent/Reasoning";

describe("WaldiezAgentReasoning", () => {
    it("should be created with an id and data", () => {
        const reasoningData = new WaldiezAgentReasoningData();
        const reasoning = new WaldiezAgentReasoning({
            id: "wa-1",
            agentType: "reasoning",
            name: "Reasoning Agent",
            description: "A reasoning agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: reasoningData,
        });

        expect(reasoning.id).toBe("wa-1");
        expect(reasoning.data).toBe(reasoningData);
    });

    it("should be created with an id, data and rest", () => {
        const reasoningData = new WaldiezAgentReasoningData();
        const reasoning = new WaldiezAgentReasoning({
            id: "wa-1",
            agentType: "reasoning",
            name: "Reasoning Agent",
            description: "A reasoning agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: reasoningData,
            rest: { key: "value" },
        });

        expect(reasoning.id).toBe("wa-1");
        expect(reasoning.data).toBe(reasoningData);
        expect(reasoning.rest).toEqual({ key: "value" });
    });
});
