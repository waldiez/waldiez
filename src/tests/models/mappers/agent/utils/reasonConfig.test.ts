/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { defaultReasonConfig } from "@waldiez/models/Agent/Reasoning";
import { getReasonConfig, getVerbose } from "@waldiez/models/mappers/agent/utils/reasonConfig";

describe("getReasonConfig", () => {
    it("should return default reason config", () => {
        expect(getReasonConfig(4 as any)).toEqual(defaultReasonConfig);
    });
    it("should return default reason config if key not in json", () => {
        expect(getReasonConfig({})).toEqual(defaultReasonConfig);
    });
    it("should return default reason config if data.reasonConfig is not an object", () => {
        expect(getReasonConfig({ data: { reasonConfig: 4 } })).toEqual(defaultReasonConfig);
    });
    it("should return a reason config", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual(reasonConfig);
    });
    it("should return a reason config from data.reasonConfig", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ data: { reasonConfig } })).toEqual(reasonConfig);
    });
    it("should use a default method if invalid", () => {
        const reasonConfig = {
            method: "invalid",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            method: "beam_search",
        });
    });
    it("should use a default maxDepth if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: "invalid",
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            maxDepth: 3,
        });
    });
    it("should use a default forestSize if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: "invalid",
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            forestSize: 1,
        });
    });
    it("should use a default ratingScale if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: "invalid",
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            ratingScale: 10,
        });
    });
    it("should use a default beamSize if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: "invalid",
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            beamSize: 3,
        });
    });
    it("should use a default answerApproach if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "invalid",
            nsim: 7,
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            answerApproach: "pool",
        });
    });
    it("should use a default nsim if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: "invalid",
            explorationConstant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            nsim: 3,
        });
    });
    it("should use a default explorationConstant if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            maxDepth: 3,
            forestSize: 4,
            ratingScale: 5,
            beamSize: 6,
            answerApproach: "pool",
            nsim: 7,
            explorationConstant: "invalid",
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            explorationConstant: 1.41,
        });
    });
});

describe("getVerbose", () => {
    it("should return true if data is not an object", () => {
        expect(getVerbose(4 as any)).toBe(true);
    });
    it("should return true if verbose is not in data", () => {
        expect(getVerbose({})).toBe(true);
    });
    it("should return true if verbose is not a boolean", () => {
        expect(getVerbose({ data: { verbose: 4 } })).toBe(true);
    });
    it("should return verbose", () => {
        expect(getVerbose({ data: { verbose: false } })).toBe(false);
    });
    it("should return verbose", () => {
        expect(getVerbose({ verbose: false })).toBe(false);
    });
});
