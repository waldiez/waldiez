/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatLlmSummaryMethod, WaldiezChatSummary } from "@waldiez/models/Chat";

export const summaryMapper = {
    importSummary: (json: { [key: string]: any }): WaldiezChatSummary => {
        if ("summary" in json) {
            return getEdgeSummary(json);
        }
        return {
            method: null,
            prompt: "",
            args: {},
        };
    },
    exportSummary: (summary: WaldiezChatSummary) => {
        return {
            method: summary.method,
            prompt: summary.prompt,
            args: summary.args,
        };
    },
};

const getEdgeSummary: (data: { [key: string]: any }) => {
    method: WaldiezChatLlmSummaryMethod;
    prompt: string;
    args: { [key: string]: any };
} = data => {
    const summary = {
        method: null as WaldiezChatLlmSummaryMethod,
        prompt: "",
        args: {},
    } as WaldiezChatSummary;
    if ("summary" in data && data.summary) {
        summary.method = getEdgeSummaryMethod(data);
        summary.prompt = getEdgeSummaryPrompt(data);
        summary.args = getEdgeSummaryArgs(data);
    }
    return summary;
};

const getEdgeSummaryMethod: (data: { [key: string]: any }) => WaldiezChatLlmSummaryMethod = data => {
    let method: WaldiezChatLlmSummaryMethod = null;
    if ("method" in data.summary && data.summary.method) {
        if (data.summary.method === "reflectionWithLlm" || data.summary.method === "reflectionWithLlm") {
            method = "reflectionWithLlm";
        } else if (data.summary.method === "lastMsg" || data.summary.method === "lastMsg") {
            method = "lastMsg";
        }
    }
    return method;
};

const getEdgeSummaryPrompt = (data: { [key: string]: any }) => {
    let prompt = "";
    if ("prompt" in data.summary && typeof data.summary.prompt === "string") {
        prompt = data.summary.prompt;
    }
    return prompt;
};

const getEdgeSummaryArgs = (data: { [key: string]: any }) => {
    let args = {} as { [key: string]: string };
    if ("args" in data.summary && data.summary.args) {
        if (typeof data.summary.args === "object") {
            args = Object.keys(data.summary.args).reduce(
                (acc, key) => {
                    acc[key.toString()] = data.summary.args[key];
                    return acc;
                },
                {} as { [key: string]: string },
            );
        }
    }
    return args;
};
