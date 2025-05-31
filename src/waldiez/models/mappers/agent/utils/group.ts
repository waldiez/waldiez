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

/**
 * Get the speakers configuration from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns An object of type WaldiezAgentGroupManagerSpeakers containing the speakers configuration.
 *          If the JSON does not contain a valid speakers configuration, it returns the default configuration.
 * @see {@link WaldiezAgentGroupManagerSpeakers}
 */
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

/**
 * Get the group chat maximum round from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A number representing the maximum round for the group chat.
 *          If not specified or invalid, it returns a default value (20).
 */
export const getGroupChatMaxRound: (json: Record<string, unknown>) => number = json => {
    let maxRound: number = 20;
    if ("maxRound" in json && typeof json.maxRound === "number") {
        try {
            maxRound = parseInt(json.maxRound.toString(), 10);
        } catch (_) {
            //
        }
    }
    return maxRound;
};

/**
 * Get the group chat admin name from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A string representing the admin name for the group chat.
 *          If not specified or invalid, it returns null.
 */
export const getAdminName: (json: Record<string, unknown>) => string | null = json => {
    let adminName: string | null = null;
    if ("adminName" in json && typeof json.adminName === "string") {
        adminName = json.adminName;
    }
    return adminName;
};

/**
 * Get the group chat enable clear history setting from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A boolean indicating whether the clear history feature is enabled.
 *          If not specified or invalid, it returns false.
 */
export const getEnableClearHistory: (json: Record<string, unknown>) => boolean = json => {
    let enableClearHistory: boolean = false;
    if ("enableClearHistory" in json && typeof json.enableClearHistory === "boolean") {
        enableClearHistory = json.enableClearHistory;
    }
    return enableClearHistory;
};

/**
 * Get the group chat send introductions setting from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A boolean indicating whether sending introductions is enabled.
 *          If not specified or invalid, it returns false.
 */
export const getSendIntroductions: (json: Record<string, unknown>) => boolean = json => {
    let sendIntroductions: boolean = false;
    if ("sendIntroductions" in json && typeof json.sendIntroductions === "boolean") {
        sendIntroductions = json.sendIntroductions;
    }
    return sendIntroductions;
};

/**
 * Get the group name from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A string representing the group name.
 *          If not specified or invalid, it returns undefined.
 */
export const getGroupName: (json: Record<string, unknown>) => string | undefined = json => {
    let groupName: string | undefined = undefined;
    if ("groupName" in json && typeof json.groupName === "string") {
        groupName = json.groupName;
    }
    return groupName;
};

/**
 * Get the initial agent ID from the JSON object.
 * @param json - The JSON object containing group chat configuration.
 * @returns A string representing the initial agent ID.
 *          If not specified or invalid, it returns undefined.
 */
export const getInitialAgentId: (json: Record<string, unknown>) => string | undefined = json => {
    let initialAgentId: string | undefined = undefined;
    if ("initialAgentId" in json && typeof json.initialAgentId === "string") {
        initialAgentId = json.initialAgentId;
    }
    return initialAgentId;
};

/**
 * Get the selection method for group chat speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A string representing the selection method for speakers.
 *          If not specified or invalid, it returns "auto".
 * @see {@link GroupChatSpeakerSelectionMethodOption}
 */
const getSelectionMethod = (json: Record<string, unknown>): GroupChatSpeakerSelectionMethodOption => {
    let selectionMethod: GroupChatSpeakerSelectionMethodOption = "auto";
    if (
        "selectionMethod" in json &&
        typeof json.selectionMethod === "string" &&
        ["auto", "manual", "random", "round_robin", "default"].includes(json.selectionMethod)
    ) {
        selectionMethod = json.selectionMethod as GroupChatSpeakerSelectionMethodOption;
    }
    return selectionMethod;
};

/**
 * Get the custom method for selecting speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A string representing the custom method for selecting speakers.
 *          If not specified or invalid, it returns an empty string.
 */
const getSelectionCustomMethod = (json: Record<string, unknown>): string => {
    let selectionCustomMethod: string = "";
    if ("selectionCustomMethod" in json && typeof json.selectionCustomMethod === "string") {
        selectionCustomMethod = json.selectionCustomMethod;
    }
    return selectionCustomMethod;
};

/**
 * Get the maximum number of retries for selecting speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A number representing the maximum retries for selecting speakers.
 *          If not specified or invalid, it returns null.
 */
const getMaxRetriesForSelecting = (json: Record<string, unknown>): number | null => {
    let maxRetriesForSelecting: number | null = null;
    if ("maxRetriesForSelecting" in json && typeof json.maxRetriesForSelecting === "number") {
        maxRetriesForSelecting = json.maxRetriesForSelecting;
    }
    return maxRetriesForSelecting;
};

/**
 * Get the selection mode for group chat speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A string representing the selection mode for speakers.
 *          If not specified or invalid, it returns "repeat".
 * @see {@link GroupChatSpeakerSelectionMode}
 */
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

/**
 * Get whether to allow repeat speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A boolean indicating whether repeat speakers are allowed.
 *          If not specified or invalid, it returns true.
 */
const getAllowRepeat = (json: Record<string, unknown>): boolean => {
    let allowRepeat: boolean = true;
    if ("allowRepeat" in json && typeof json.allowRepeat === "boolean") {
        allowRepeat = json.allowRepeat;
    }
    return allowRepeat;
};

/**
 * Get the allowed or disallowed transitions for group chat speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns An object mapping transition names to lists of allowed or disallowed transitions.
 *          If not specified or invalid, it returns an empty object.
 */
const getAllowedOrDisallowedTransitions = (json: Record<string, unknown>): { [key: string]: string[] } => {
    let allowedOrDisallowedTransitions: { [key: string]: string[] } = {};
    if (
        "allowedOrDisallowedTransitions" in json &&
        typeof json.allowedOrDisallowedTransitions === "object" &&
        json.allowedOrDisallowedTransitions
    ) {
        // dist[str, list[str]]
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

/**
 * Get the transitions type for group chat speakers from the JSON object.
 * @param json - The JSON object containing group chat speakers configuration.
 * @returns A string representing the transitions type for speakers.
 *          If not specified or invalid, it returns "allowed".
 * @see {@link GroupChatSpeakerTransitionsType}
 */
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
