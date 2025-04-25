/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezSwarmAfterWork } from "@waldiez/models/Agent";
import { swarmAfterWorkMapper } from "@waldiez/models/mappers/common/swarmAfterWorkMapper";

describe("swarmAfterWorkMapper", () => {
    it("should import a swarm after work", () => {
        const swarmAfterWorkJson = {
            recipientType: "agent",
            recipient: "wa-2",
        };
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork(swarmAfterWorkJson);
        expect(swarmAfterWork).toBeTruthy();
        expect(swarmAfterWork!.recipientType).toBe("agent");
        expect(swarmAfterWork!.recipient).toBe("wa-2");
    });
    it("should accept recipient_type as a json key for recipientType", () => {
        const swarmAfterWorkJson = {
            recipient_type: "agent",
            recipient: "wa-2",
        };
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork(swarmAfterWorkJson);
        expect(swarmAfterWork).toBeTruthy();
        expect(swarmAfterWork!.recipientType).toBe("agent");
        expect(swarmAfterWork!.recipient).toBe("wa-2");
    });
    it("should import a swarm after work with invalid json", () => {
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork(4);
        expect(swarmAfterWork).toBeNull();
    });
    it("should import a swarm after work with no data in json", () => {
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork({
            recipientType: "agent",
        });
        expect(swarmAfterWork).toBeNull();
    });
    it("should import a swarm after work with invalid recipient type", () => {
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork({
            recipientType: "invalid",
            recipient: "wa-2",
        });
        expect(swarmAfterWork).toBeNull();
    });
    it("should import a swarm after work with invalid recipient", () => {
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork({
            recipientType: "agent",
            recipient: 4,
        });
        expect(swarmAfterWork).toBeNull();
    });
    it("should import a swarm after work with invalid recipient option", () => {
        const swarmAfterWork = swarmAfterWorkMapper.importSwarmAfterWork({
            recipientType: "option",
            recipient: "invalid",
        });
        expect(swarmAfterWork).toBeNull();
    });
    it("should export a swarm after work", () => {
        const swarmAfterWork: WaldiezSwarmAfterWork = {
            recipientType: "agent",
            recipient: "wa-2",
        };
        const json = swarmAfterWorkMapper.exportSwarmAfterWork(swarmAfterWork);
        expect(json).toBeTruthy();
        expect(json.recipientType).toBe("agent");
        expect(json.recipient).toBe("wa-2");
    });
    it("should export a swarm after work with option recipient", () => {
        const swarmAfterWork: WaldiezSwarmAfterWork = {
            recipientType: "option",
            recipient: "TERMINATE",
        };
        const json = swarmAfterWorkMapper.exportSwarmAfterWork(swarmAfterWork);
        expect(json).toBeTruthy();
        expect(json.recipientType).toBe("option");
        expect(json.recipient).toBe("TERMINATE");
    });
});
