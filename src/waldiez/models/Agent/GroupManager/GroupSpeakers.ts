/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type {
    GroupChatSpeakerSelectionMethodOption,
    GroupChatSpeakerSelectionMode,
    GroupChatSpeakerTransitionsType,
} from "@waldiez/models/Agent/GroupManager/types";

/**
 * Default configuration for group chat speakers.
 * @see {@link GroupChatSpeakerSelectionMethodOption}
 * @see {@link GroupChatSpeakerSelectionMode}
 * @see {@link GroupChatSpeakerTransitionsType}
 */
export const defaultGroupChatSpeakers = {
    selectionMethod: "auto" as GroupChatSpeakerSelectionMethodOption,
    selectionCustomMethod: "",
    maxRetriesForSelecting: null,
    selectionMode: "repeat" as GroupChatSpeakerSelectionMode,
    allowRepeat: true,
    allowedOrDisallowedTransitions: {},
    transitionsType: "allowed" as GroupChatSpeakerTransitionsType,
    order: [],
};

/**
 * WaldiezAgentGroupManagerSpeakers
 * @param selectionMethod - The method for selecting speakers
 * @param selectionCustomMethod - The custom method for selecting speakers
 * @param maxRetriesForSelecting - The maximum number of retries for selecting speakers
 * @param selectionMode - The mode for selecting speakers
 * @param allowRepeat - Whether to allow repeat speakers
 * @param allowedOrDisallowedTransitions - The allowed or disallowed transitions for speakers
 * @param transitionsType - The type of transitions for speakers
 * @see {@link GroupChatSpeakerSelectionMethodOption}
 * @see {@link GroupChatSpeakerSelectionMode}
 * @see {@link GroupChatSpeakerTransitionsType}
 * @see {@link defaultGroupChatSpeakers}
 */
export class WaldiezAgentGroupManagerSpeakers {
    selectionMethod: GroupChatSpeakerSelectionMethodOption;
    selectionCustomMethod: string;
    maxRetriesForSelecting: number | null;
    selectionMode: GroupChatSpeakerSelectionMode;
    allowRepeat: boolean | string[];
    allowedOrDisallowedTransitions: { [key: string]: string[] };
    transitionsType: GroupChatSpeakerTransitionsType;
    order: string[] = [];
    constructor(
        props: {
            selectionMethod: GroupChatSpeakerSelectionMethodOption;
            selectionCustomMethod: string;
            maxRetriesForSelecting: number | null;
            selectionMode: GroupChatSpeakerSelectionMode;
            allowRepeat: boolean | string[];
            allowedOrDisallowedTransitions: { [key: string]: string[] };
            transitionsType: GroupChatSpeakerTransitionsType;
            order: string[];
        } = {
            selectionMethod: "auto",
            selectionCustomMethod: "",
            maxRetriesForSelecting: null,
            selectionMode: "repeat",
            allowRepeat: true,
            allowedOrDisallowedTransitions: {},
            transitionsType: "allowed",
            order: [],
        },
    ) {
        this.selectionMethod = props.selectionMethod;
        this.selectionCustomMethod = props.selectionCustomMethod;
        this.maxRetriesForSelecting = props.maxRetriesForSelecting;
        this.selectionMode = props.selectionMode;
        this.allowRepeat = props.allowRepeat;
        this.allowedOrDisallowedTransitions = props.allowedOrDisallowedTransitions;
        this.transitionsType = props.transitionsType;
        this.order = props.order;
    }
}
