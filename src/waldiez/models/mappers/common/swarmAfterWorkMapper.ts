/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezSwarmAfterWork,
    WaldiezSwarmAfterWorkOption,
    WaldiezSwarmAfterWorkRecipientType,
} from "@waldiez/models/Agent";

export const swarmAfterWorkMapper = {
    importSwarmAfterWork: (json: unknown): WaldiezSwarmAfterWork | null => {
        if (typeof json !== "object" || json === null) {
            return null;
        }
        const data = { ...json } as { [key: string]: any };
        const recipientType = getRecipientType(data);
        if (recipientType === null) {
            return null;
        }
        const recipient = getRecipient(data, recipientType);
        if (recipient === null) {
            return null;
        }
        return new WaldiezSwarmAfterWork({ recipientType, recipient });
    },
    exportSwarmAfterWork: (swarmAfterWork: WaldiezSwarmAfterWork): WaldiezSwarmAfterWork => {
        return {
            recipientType: swarmAfterWork.recipientType,
            recipient: swarmAfterWork.recipient,
        };
    },
};

const getRecipientType = (json: Record<string, unknown>): WaldiezSwarmAfterWorkRecipientType | null => {
    if ("recipientType" in json || "recipient_type" in json) {
        const recipientType = json.recipientType || json.recipient_type;
        if (typeof recipientType === "string" && ["agent", "option", "callable"].includes(recipientType)) {
            return recipientType as WaldiezSwarmAfterWorkRecipientType;
        }
    }
    return null;
};

const getRecipient = (
    json: Record<string, unknown>,
    recipientType: WaldiezSwarmAfterWorkRecipientType,
): string | WaldiezSwarmAfterWorkOption | null => {
    if ("recipient" in json && typeof json.recipient === "string") {
        if (recipientType === "option") {
            if (!["TERMINATE", "REVERT_TO_USER", "STAY"].includes(json.recipient)) {
                return null;
            }
        }
        return json.recipient;
    }
    return null;
};
