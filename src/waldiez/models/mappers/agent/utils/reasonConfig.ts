/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezReasoningAgentReasonConfig, defaultReasonConfig } from "@waldiez/models/Agent/Reasoning";

export const getVerbose: (json: { [key: string]: any }) => boolean = json => {
    if (typeof json !== "object") {
        return true;
    }
    if ("verbose" in json && typeof json.verbose === "boolean") {
        return json.verbose;
    }
    if (
        "data" in json &&
        typeof json.data === "object" &&
        "verbose" in json.data &&
        typeof json.data.verbose === "boolean"
    ) {
        return json.data.verbose;
    }
    return true;
};

export const getReasonConfig: (json: { [key: string]: any }) => WaldiezReasoningAgentReasonConfig = json => {
    if (typeof json !== "object") {
        return defaultReasonConfig;
    }
    let jsonData = null;
    if ("reasonConfig" in json && typeof json.reasonConfig === "object" && json.reasonConfig) {
        jsonData = json.reasonConfig;
    } else if (
        "data" in json &&
        typeof json.data === "object" &&
        json.data &&
        "reasonConfig" in json.data &&
        typeof json.data.reasonConfig === "object" &&
        json.data.reasonConfig
    ) {
        jsonData = json.data.reasonConfig;
    }
    if (!jsonData) {
        return defaultReasonConfig;
    }
    return {
        method: getReasoningConfigMethod(jsonData),
        max_depth: getReasoningConfigMaxDepth(jsonData),
        forest_size: getReasoningConfigForestSize(jsonData),
        rating_scale: getReasoningConfigRatingScale(jsonData),
        beam_size: getReasoningConfigBeamSize(jsonData),
        answer_approach: getReasoningConfigAnswerApproach(jsonData),
        nsim: getReasoningConfigNsim(jsonData),
        exploration_constant: getReasoningConfigExplorationConstant(jsonData),
    };
};

const getReasoningConfigMethod = (data: Record<string, unknown>): "beam_search" | "mcts" | "lats" | "dfs" => {
    if (
        "method" in data &&
        typeof data.method === "string" &&
        ["beam_search", "mcts", "lats", "dfs"].includes(data.method)
    ) {
        return data.method as "beam_search" | "mcts" | "lats" | "dfs";
    }
    return "beam_search";
};

const getReasoningConfigMaxDepth = (data: Record<string, unknown>): number => {
    if ("max_depth" in data && typeof data.max_depth === "number") {
        return data.max_depth;
    }
    return 3;
};

const getReasoningConfigForestSize = (data: Record<string, unknown>): number => {
    if ("forest_size" in data && typeof data.forest_size === "number") {
        return data.forest_size;
    }
    return 1;
};

const getReasoningConfigRatingScale = (data: Record<string, unknown>): number => {
    if ("rating_scale" in data && typeof data.rating_scale === "number") {
        return data.rating_scale;
    }
    return 10;
};

const getReasoningConfigBeamSize = (data: Record<string, unknown>): number => {
    if ("beam_size" in data && typeof data.beam_size === "number") {
        return data.beam_size;
    }
    return 3;
};

const getReasoningConfigAnswerApproach = (data: Record<string, unknown>): "pool" | "best" => {
    if (
        "answer_approach" in data &&
        typeof data.answer_approach === "string" &&
        ["pool", "best"].includes(data.answer_approach)
    ) {
        return data.answer_approach as "pool" | "best";
    }
    return "pool";
};

const getReasoningConfigNsim = (data: Record<string, unknown>): number => {
    if ("nsim" in data && typeof data.nsim === "number") {
        return data.nsim;
    }
    return 3;
};

const getReasoningConfigExplorationConstant = (data: Record<string, unknown>): number => {
    if ("exploration_constant" in data && typeof data.exploration_constant === "number") {
        return data.exploration_constant;
    }
    return 1.41;
};
