/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezMessageType } from "@waldiez/models/Chat/types";

/**
 * WaldiezMessage
 * Represents a message in the Waldiez chat system.
 * @param type - The type of the message
 * @param content - The content of the message
 * @param useCarryover - Whether to use carryover for the message
 * @param context - The context of the message
 * @see {@link WaldiezMessageType}
 */
export class WaldiezMessage {
    type: WaldiezMessageType;
    content: string | null;
    useCarryover?: boolean;
    context: { [key: string]: unknown };

    constructor(
        props: {
            type: WaldiezMessageType;
            useCarryover?: boolean;
            content: string | null;
            context?: { [key: string]: string };
        } = {
            type: "none",
            useCarryover: false,
            content: null,
        },
    ) {
        const { type, useCarryover, content, context } = props;
        this.type = type;
        this.useCarryover = useCarryover;
        this.content = content;
        this.context = context || {};
    }
}
