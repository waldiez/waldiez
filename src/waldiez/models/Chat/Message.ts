/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezMessageType } from "@waldiez/models/Chat/types";

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
