/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezAgentDocAgent, WaldiezAgentDocAgentData } from "@waldiez/models";

describe("WaldiezAgentDocAgent", () => {
    it("should be created with an id and data", () => {
        const docAgentData = new WaldiezAgentDocAgentData();
        const docAgent = new WaldiezAgentDocAgent({
            id: "wa-1",
            agentType: "doc_agent",
            name: "Document Agent",
            description: "A document agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: docAgentData,
        });

        expect(docAgent.id).toBe("wa-1");
        expect(docAgent.data).toBe(docAgentData);
    });

    it("should be created with an id, data and rest", () => {
        const docAgentData = new WaldiezAgentDocAgentData();
        const docAgent = new WaldiezAgentDocAgent({
            id: "wa-1",
            agentType: "doc_agent",
            name: "Document Agent",
            description: "A document agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: docAgentData,
            rest: { key: "value" },
        });

        expect(docAgent.id).toBe("wa-1");
        expect(docAgent.data).toBe(docAgentData);
        expect(docAgent.rest).toEqual({ key: "value" });
    });
});
