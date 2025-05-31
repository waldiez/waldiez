/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain/types";

/**
 * Utility functions to extract captain agent library entries and configurations from a JSON object.
 * @param json - The JSON object containing captain agent configurations.
 * @returns An array of WaldiezCaptainAgentLibEntry objects representing the agent library entries.
 *          If the JSON does not contain a valid agent library, an empty array is returned.
 */
export const getCaptainAgentLib: (json: { [key: string]: any }) => WaldiezCaptainAgentLibEntry[] = json => {
    const agentLib: WaldiezCaptainAgentLibEntry[] = [];
    if ("agentLib" in json && Array.isArray(json.agentLib)) {
        for (const entry of json.agentLib) {
            if (
                typeof entry === "object" &&
                "name" in entry &&
                "description" in entry &&
                "systemMessage" in entry
            ) {
                agentLib.push(entry);
            }
        }
    }
    return agentLib;
};

/**
 * Utility functions to extract captain agent tool library configuration from a JSON object.
 * @param json - The JSON object containing captain agent configurations.
 * @returns A string representing the tool library configuration, or null if not specified.
 *          If the tool library is set to "default" or null, it returns "default" or null respectively.
 *          Otherwise, it returns null.
 */
export const getCaptainToolLib: (json: { [key: string]: any }) => "default" | null = json => {
    if ("toolLib" in json && (json.toolLib === "default" || json.toolLib === null)) {
        return json.toolLib;
    }
    return null;
};

/**
 * Utility function to extract captain agent maximum round configuration from a JSON object.
 * @param json - The JSON object containing captain agent configurations.
 * @returns A number representing the maximum round configuration.
 *          If not specified or invalid, it returns a default value (10).
 */
export const getCaptainMaxRound: (json: { [key: string]: any }) => number = json => {
    if ("maxRound" in json && typeof json.maxRound === "number") {
        const parsed = parseInt(json.maxRound.toString(), 10);
        if (parsed > 0) {
            return parsed;
        }
    }
    return 10;
};

/**
 * Utility function to extract captain agent maximum turns configuration from a JSON object.
 * @param json - The JSON object containing captain agent configurations.
 * @returns A number representing the maximum turns configuration.
 *          If not specified or invalid, it returns a default value (5).
 */
export const getCaptainMaxTurns: (json: { [key: string]: any }) => number = json => {
    if ("maxTurns" in json && typeof json.maxTurns === "number") {
        const parsed = parseInt(json.maxTurns.toString(), 10);
        if (parsed > 0) {
            return parsed;
        }
    }
    return 5;
};
