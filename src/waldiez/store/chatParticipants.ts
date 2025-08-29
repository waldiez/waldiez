/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { IWaldiezChatParticipantsStore } from "@waldiez/models/Stores/IChatParticipantsStore";
import type { typeOfGet, typeOfSet } from "@waldiez/types";

export class WaldiezChatParticipantsStore implements IWaldiezChatParticipantsStore {
    private readonly get: typeOfGet;
    private readonly set: typeOfSet;

    /**
     * Creates an instance of WaldiezEdgeStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    /**
     * Factory method to create a new instance of WaldiezEdgeStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     * @returns A new instance of WaldiezEdgeStore.
     */
    static create(get: typeOfGet, set: typeOfSet): WaldiezChatParticipantsStore {
        return new WaldiezChatParticipantsStore(get, set);
    }

    setActiveParticipants = (sender: string | null, recipient: string | null) => {
        const { activeSenderId, activeRecipientId } = this.get();
        if (activeSenderId === sender && activeRecipientId === recipient) {
            return;
        }
        this.set({ activeSenderId: sender, activeRecipientId: recipient });
    };

    resetActiveParticipants = () => {
        const { activeSenderId, activeRecipientId } = this.get();
        if (activeSenderId === null && activeRecipientId === null) {
            return;
        }
        this.set({ activeSenderId: null, activeRecipientId: null });
    };
}
