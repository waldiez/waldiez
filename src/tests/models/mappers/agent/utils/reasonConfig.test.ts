/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { defaultReasonConfig } from "@waldiez/models/Agent/Reasoning";
import { getReasonConfig, getVerbose } from "@waldiez/models/mappers/agent/utils";

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
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual(reasonConfig);
    });
    it("should return a reason config from data.reasonConfig", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ data: { reasonConfig } })).toEqual(reasonConfig);
    });
    it("should use a default method if invalid", () => {
        const reasonConfig = {
            method: "invalid",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            method: "beam_search",
        });
    });
    it("should use a default max_depth if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: "invalid",
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            max_depth: 3,
        });
    });
    it("should use a default forest_size if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: "invalid",
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            forest_size: 1,
        });
    });
    it("should use a default rating_scale if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: "invalid",
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            rating_scale: 10,
        });
    });
    it("should use a default beam_size if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: "invalid",
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            beam_size: 3,
        });
    });
    it("should use a default answer_approach if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "invalid",
            nsim: 7,
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            answer_approach: "pool",
        });
    });
    it("should use a default nsim if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: "invalid",
            exploration_constant: 1.6,
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            nsim: 3,
        });
    });
    it("should use a default exploration_constant if invalid", () => {
        const reasonConfig = {
            method: "beam_search",
            max_depth: 3,
            forest_size: 4,
            rating_scale: 5,
            beam_size: 6,
            answer_approach: "pool",
            nsim: 7,
            exploration_constant: "invalid",
        };
        expect(getReasonConfig({ reasonConfig })).toEqual({
            ...reasonConfig,
            exploration_constant: 1.41,
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
