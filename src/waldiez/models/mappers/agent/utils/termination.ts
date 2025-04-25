/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgentTerminationMessageCheck } from "@waldiez/models/Agent/Common";

export const getTermination = (data: Record<string, unknown>): WaldiezAgentTerminationMessageCheck => {
    if ("termination" in data && typeof data.termination === "object" && data.termination) {
        const termination = data.termination as Record<string, unknown>;
        const type = getTerminationType(termination);
        const keywords = getTerminationKeywords(termination);
        const criterion = getTerminationCriterion(termination);
        const methodContent = getTerminationMethodContent(termination);
        return {
            type,
            keywords,
            criterion,
            methodContent,
        };
    }
    return {
        type: "none",
        keywords: [],
        criterion: null,
        methodContent: null,
    };
};

const getTerminationType = (data: Record<string, unknown>): "none" | "keyword" | "method" => {
    if (
        "type" in data &&
        typeof data.type === "string" &&
        ["none", "keyword", "method"].includes(data.type)
    ) {
        return data.type as "none" | "keyword" | "method";
    }
    return "none";
};

const getTerminationKeywords = (data: Record<string, unknown>): string[] => {
    let keywords: string[] = [];
    if ("keywords" in data && Array.isArray(data.keywords)) {
        keywords = data.keywords.filter(k => typeof k === "string") as string[];
    }
    return keywords;
};

const getTerminationCriterion = (data: Record<string, unknown>): "found" | "ending" | "exact" | null => {
    if (
        "criterion" in data &&
        typeof data.criterion === "string" &&
        ["found", "ending", "exact"].includes(data.criterion)
    ) {
        return data.criterion as "found" | "ending" | "exact";
    }
    return null;
};

const getTerminationMethodContent = (data: Record<string, unknown>): string | null => {
    if ("methodContent" in data && typeof data.methodContent === "string") {
        return data.methodContent;
    }
    return null;
};
