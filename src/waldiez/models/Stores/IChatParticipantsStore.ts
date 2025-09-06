/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export interface IWaldiezChatParticipantsStore {
    setActiveParticipants: (sender: string | null, recipient: string | null) => void;
    resetActiveParticipants: () => void;
    setActiveEventType: (activeEventType: string | null) => void;
    resetActiveEventType: () => void;
}
