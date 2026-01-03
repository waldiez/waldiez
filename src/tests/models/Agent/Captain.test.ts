/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezAgentCaptain, WaldiezAgentCaptainData } from "@waldiez/models/Agent/Captain";

describe("WaldiezAgentCaptain", () => {
    it("should be created with an id and data", () => {
        const captainData = new WaldiezAgentCaptainData();
        const captain = new WaldiezAgentCaptain({
            id: "wa-1",
            agentType: "captain",
            name: "Captain",
            description: "A captain agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: captainData,
        });

        expect(captain.id).toBe("wa-1");
        expect(captain.data).toBe(captainData);
        const captain2 = WaldiezAgentCaptain.create("captain");
        expect(captain2).toBeTruthy();
        expect(captain2.data.humanInputMode).toBe("NEVER");
    });

    it("should be created with an id, data and rest", () => {
        const captainData = new WaldiezAgentCaptainData();
        const captain = new WaldiezAgentCaptain({
            id: "wa-1",
            agentType: "captain",
            name: "Captain",
            description: "A captain agent",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: captainData,
            rest: { key: "value" },
        });

        expect(captain.id).toBe("wa-1");
        expect(captain.data).toBe(captainData);
        expect(captain.rest).toEqual({ key: "value" });
    });
});
