/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    GroupChatSpeakerSelectionMethodOption,
    GroupChatSpeakerSelectionMode,
    GroupChatSpeakerTransitionsType,
} from "@waldiez/models/Agent/GroupManager/types";

export class WaldiezAgentGroupManagerSpeakers {
    selectionMethod: GroupChatSpeakerSelectionMethodOption;
    selectionCustomMethod: string;
    maxRetriesForSelecting: number | null;
    selectionMode: GroupChatSpeakerSelectionMode;
    allowRepeat: boolean | string[];
    allowedOrDisallowedTransitions: { [key: string]: string[] };
    transitionsType: GroupChatSpeakerTransitionsType;
    constructor(
        props: {
            selectionMethod: GroupChatSpeakerSelectionMethodOption;
            selectionCustomMethod: string;
            maxRetriesForSelecting: number | null;
            selectionMode: GroupChatSpeakerSelectionMode;
            allowRepeat: boolean | string[];
            allowedOrDisallowedTransitions: { [key: string]: string[] };
            transitionsType: GroupChatSpeakerTransitionsType;
        } = {
            selectionMethod: "auto",
            selectionCustomMethod: "",
            maxRetriesForSelecting: null,
            selectionMode: "repeat",
            allowRepeat: true,
            allowedOrDisallowedTransitions: {},
            transitionsType: "allowed",
        },
    ) {
        this.selectionMethod = props.selectionMethod;
        this.selectionCustomMethod = props.selectionCustomMethod;
        this.maxRetriesForSelecting = props.maxRetriesForSelecting;
        this.selectionMode = props.selectionMode;
        this.allowRepeat = props.allowRepeat;
        this.allowedOrDisallowedTransitions = props.allowedOrDisallowedTransitions;
        this.transitionsType = props.transitionsType;
    }
}
