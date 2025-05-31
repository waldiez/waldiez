/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatLlmSummaryMethod, WaldiezChatSummary } from "@waldiez/models/Chat";

/**
 * summaryMapper
 * A utility to map chat summaries between JSON format and WaldiezChatSummary format.
 * It provides methods to import and export summaries.
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezChatLlmSummaryMethod}
 */
export const summaryMapper = {
    /**
     * Imports a chat summary from JSON.
     * If the JSON is invalid or missing, it returns a default summary.
     * @param json - The JSON representation of the chat summary.
     * @returns An object representing the imported chat summary.
     */
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

    /**
     * Exports a WaldiezChatSummary to a format suitable for JSON.
     * @param summary - The WaldiezChatSummary to export.
     * @returns An object representing the exported chat summary.
     */
    exportSummary: (summary: WaldiezChatSummary) => {
        return {
            method: summary.method,
            prompt: summary.prompt,
            args: summary.args,
        };
    },
};

/**
 * Utility functions to extract summary properties from edge data.
 * @param data - The edge data containing the summary.
 * @returns An object representing the summary with method, prompt, and args.
 *          If the data does not contain a valid summary, it returns default values.
 */
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
