/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain/types";

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

export const getCaptainToolLib: (json: { [key: string]: any }) => "default" | null = json => {
    if ("toolLib" in json && (json.toolLib === "default" || json.toolLib === null)) {
        return json.toolLib;
    }
    return null;
};

export const getCaptainMaxRound: (json: { [key: string]: any }) => number = json => {
    if ("maxRound" in json && typeof json.maxRound === "number") {
        const parsed = parseInt(json.maxRound.toString(), 10);
        if (parsed > 0) {
            return parsed;
        }
    }
    return 10;
};

export const getCaptainMaxTurns: (json: { [key: string]: any }) => number = json => {
    if ("maxTurns" in json && typeof json.maxTurns === "number") {
        const parsed = parseInt(json.maxTurns.toString(), 10);
        if (parsed > 0) {
            return parsed;
        }
    }
    return 5;
};
