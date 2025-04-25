/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    GroupChatSpeakerSelectionMethodOption,
    GroupChatSpeakerSelectionMode,
    GroupChatSpeakerTransitionsType,
    WaldiezAgentGroupManagerSpeakers,
} from "@waldiez/models/Agent/GroupManager";

export const getSpeakers: (json: Record<string, unknown>) => WaldiezAgentGroupManagerSpeakers = json => {
    let speakers: WaldiezAgentGroupManagerSpeakers = {
        selectionMethod: "auto",
        selectionCustomMethod: "",
        maxRetriesForSelecting: null,
        selectionMode: "repeat",
        allowRepeat: true,
        allowedOrDisallowedTransitions: {},
        transitionsType: "allowed",
    };
    if ("speakers" in json && typeof json.speakers === "object") {
        const data = json.speakers as Record<string, unknown>;
        speakers = {
            selectionMethod: getSelectionMethod(data),
            selectionCustomMethod: getSelectionCustomMethod(data),
            maxRetriesForSelecting: getMaxRetriesForSelecting(data),
            selectionMode: getSelectionMode(data),
            allowRepeat: getAllowRepeat(data),
            allowedOrDisallowedTransitions: getAllowedOrDisallowedTransitions(data),
            transitionsType: getTransitionsType(data),
        };
    }
    return speakers;
};

export const getGroupChatMaxRound: (json: Record<string, unknown>) => number | null = json => {
    let maxRound: number | null = null;
    if ("maxRound" in json && typeof json.maxRound === "number") {
        try {
            maxRound = parseInt(json.maxRound.toString(), 10);
        } catch (_) {
            maxRound = null;
        }
    }
    return maxRound;
};

export const getAdminName: (json: Record<string, unknown>) => string | null = json => {
    let adminName: string | null = null;
    if ("adminName" in json && typeof json.adminName === "string") {
        adminName = json.adminName;
    }
    return adminName;
};

export const getEnableClearHistory: (json: Record<string, unknown>) => boolean = json => {
    let enableClearHistory: boolean = false;
    if ("enableClearHistory" in json && typeof json.enableClearHistory === "boolean") {
        enableClearHistory = json.enableClearHistory;
    }
    return enableClearHistory;
};

export const getSendIntroductions: (json: Record<string, unknown>) => boolean = json => {
    let sendIntroductions: boolean = false;
    if ("sendIntroductions" in json && typeof json.sendIntroductions === "boolean") {
        sendIntroductions = json.sendIntroductions;
    }
    return sendIntroductions;
};

const getSelectionMethod = (json: Record<string, unknown>): GroupChatSpeakerSelectionMethodOption => {
    let selectionMethod: GroupChatSpeakerSelectionMethodOption = "auto";
    if (
        "selectionMethod" in json &&
        typeof json.selectionMethod === "string" &&
        ["auto", "manual", "random", "round_robin", "custom"].includes(json.selectionMethod)
    ) {
        selectionMethod = json.selectionMethod as GroupChatSpeakerSelectionMethodOption;
    }
    return selectionMethod;
};

const getSelectionCustomMethod = (json: Record<string, unknown>): string => {
    let selectionCustomMethod: string = "";
    if ("selectionCustomMethod" in json && typeof json.selectionCustomMethod === "string") {
        selectionCustomMethod = json.selectionCustomMethod;
    }
    return selectionCustomMethod;
};

const getMaxRetriesForSelecting = (json: Record<string, unknown>): number | null => {
    let maxRetriesForSelecting: number | null = null;
    if ("maxRetriesForSelecting" in json && typeof json.maxRetriesForSelecting === "number") {
        maxRetriesForSelecting = json.maxRetriesForSelecting;
    }
    return maxRetriesForSelecting;
};

const getSelectionMode = (json: Record<string, unknown>): GroupChatSpeakerSelectionMode => {
    let selectionMode: GroupChatSpeakerSelectionMode = "repeat";
    if (
        "selectionMode" in json &&
        typeof json.selectionMode === "string" &&
        ["repeat", "transition"].includes(json.selectionMode)
    ) {
        selectionMode = json.selectionMode as GroupChatSpeakerSelectionMode;
    }
    return selectionMode;
};

const getAllowRepeat = (json: Record<string, unknown>): boolean => {
    let allowRepeat: boolean = true;
    if ("allowRepeat" in json && typeof json.allowRepeat === "boolean") {
        allowRepeat = json.allowRepeat;
    }
    return allowRepeat;
};

const getAllowedOrDisallowedTransitions = (json: Record<string, unknown>): { [key: string]: string[] } => {
    let allowedOrDisallowedTransitions: { [key: string]: string[] } = {};
    if (
        "allowedOrDisallowedTransitions" in json &&
        typeof json.allowedOrDisallowedTransitions === "object" &&
        json.allowedOrDisallowedTransitions
    ) {
        // dist[str, List[str]]
        const transitions: { [key: string]: string[] } = {};
        for (const [key, value] of Object.entries(json.allowedOrDisallowedTransitions)) {
            if (typeof key === "string" && Array.isArray(value)) {
                transitions[key] = value.filter(v => typeof v === "string");
            }
        }
        allowedOrDisallowedTransitions = transitions;
    }
    return allowedOrDisallowedTransitions;
};

const getTransitionsType = (json: Record<string, unknown>): GroupChatSpeakerTransitionsType => {
    let transitionsType: GroupChatSpeakerTransitionsType = "allowed";

    if (
        "transitionsType" in json &&
        typeof json.transitionsType === "string" &&
        ["allowed", "disallowed"].includes(json.transitionsType)
    ) {
        transitionsType = json.transitionsType as GroupChatSpeakerTransitionsType;
    }

    return transitionsType;
};
