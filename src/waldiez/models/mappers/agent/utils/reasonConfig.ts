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
        method: getreasonConfigMethod(jsonData),
        maxDepth: getreasonConfigMaxDepth(jsonData),
        forestSize: getreasonConfigForestSize(jsonData),
        ratingScale: getreasonConfigRatingScale(jsonData),
        beamSize: getreasonConfigBeamSize(jsonData),
        answerApproach: getreasonConfigAnswerApproach(jsonData),
        nsim: getreasonConfigNsim(jsonData),
        explorationConstant: getreasonConfigExplorationConstant(jsonData),
    };
};

const getreasonConfigMethod = (data: Record<string, unknown>): "beam_search" | "mcts" | "lats" | "dfs" => {
    if (
        "method" in data &&
        typeof data.method === "string" &&
        ["beam_search", "mcts", "lats", "dfs"].includes(data.method)
    ) {
        return data.method as "beam_search" | "mcts" | "lats" | "dfs";
    }
    return "beam_search";
};

const getreasonConfigMaxDepth = (data: Record<string, unknown>): number => {
    if ("maxDepth" in data && typeof data.maxDepth === "number") {
        return data.maxDepth;
    }
    return 3;
};

const getreasonConfigForestSize = (data: Record<string, unknown>): number => {
    if ("forestSize" in data && typeof data.forestSize === "number") {
        return data.forestSize;
    }
    return 1;
};

const getreasonConfigRatingScale = (data: Record<string, unknown>): number => {
    if ("ratingScale" in data && typeof data.ratingScale === "number") {
        return data.ratingScale;
    }
    return 10;
};

const getreasonConfigBeamSize = (data: Record<string, unknown>): number => {
    if ("beamSize" in data && typeof data.beamSize === "number") {
        return data.beamSize;
    }
    return 3;
};

const getreasonConfigAnswerApproach = (data: Record<string, unknown>): "pool" | "best" => {
    if (
        "answerApproach" in data &&
        typeof data.answerApproach === "string" &&
        ["pool", "best"].includes(data.answerApproach)
    ) {
        return data.answerApproach as "pool" | "best";
    }
    return "pool";
};

const getreasonConfigNsim = (data: Record<string, unknown>): number => {
    if ("nsim" in data && typeof data.nsim === "number") {
        return data.nsim;
    }
    return 3;
};

const getreasonConfigExplorationConstant = (data: Record<string, unknown>): number => {
    if ("explorationConstant" in data && typeof data.explorationConstant === "number") {
        return data.explorationConstant;
    }
    return 1.41;
};
