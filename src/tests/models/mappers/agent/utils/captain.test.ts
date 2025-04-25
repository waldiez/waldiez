/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getCaptainAgentLib,
    getCaptainMaxRound,
    getCaptainMaxTurns,
    getCaptainToolLib,
} from "@waldiez/models/mappers/agent/utils/captain";

describe("getCaptainAgentLib", () => {
    it("should return empty array if agentLib not in json", () => {
        expect(getCaptainAgentLib({})).toEqual([]);
    });
    it("should return empty array if agentLib is not an array", () => {
        expect(getCaptainAgentLib({ agentLib: 4 })).toEqual([]);
    });
    it("should return empty array if agentLib is not an array of objects", () => {
        expect(getCaptainAgentLib({ agentLib: [4] })).toEqual([]);
    });
    it("should return empty array if agentLib is not an array of objects with name, description, and systemMessage", () => {
        expect(getCaptainAgentLib({ agentLib: [{ name: "name" }] })).toEqual([]);
    });
    it("should return an array of objects with name, description, and systemMessage", () => {
        const agentLib = [
            {
                name: "name",
                description: "description",
                systemMessage: "systemMessage",
            },
        ];
        expect(getCaptainAgentLib({ agentLib })).toEqual(agentLib);
    });
});

describe("getCaptainToolLib", () => {
    it("should return null if toolLib not in json", () => {
        expect(getCaptainToolLib({})).toEqual(null);
    });
    it("should return null if toolLib is not 'default' or null", () => {
        expect(getCaptainToolLib({ toolLib: "invalid" })).toEqual(null);
    });
    it("should return 'default' if toolLib is 'default'", () => {
        expect(getCaptainToolLib({ toolLib: "default" })).toEqual("default");
    });
    it("should return null if toolLib is null", () => {
        expect(getCaptainToolLib({ toolLib: null })).toEqual(null);
    });
});

describe("getCaptainMaxRound", () => {
    it("should return 10 if maxRound not in json", () => {
        expect(getCaptainMaxRound({})).toEqual(10);
    });
    it("should return 10 if maxRound is not a number", () => {
        expect(getCaptainMaxRound({ maxRound: "invalid" })).toEqual(10);
    });
    it("should parse int if maxRound is a number", () => {
        expect(getCaptainMaxRound({ maxRound: 5.1 })).toEqual(5);
    });
    it("should not accept negative numbers", () => {
        expect(getCaptainMaxRound({ maxRound: -6 })).toEqual(10);
    });
});

describe("getCaptainMaxTurns", () => {
    it("should return 5 if maxTurns not in json", () => {
        expect(getCaptainMaxTurns({})).toEqual(5);
    });
    it("should return 5 if maxTurns is not a number", () => {
        expect(getCaptainMaxTurns({ maxTurns: "invalid" })).toEqual(5);
    });
    it("should parse int if maxTurns is a number", () => {
        expect(getCaptainMaxTurns({ maxTurns: 5.1 })).toEqual(5);
    });
    it("should not accept negative numbers", () => {
        expect(getCaptainMaxTurns({ maxTurns: -7 })).toEqual(5);
    });
});
