/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezMessageType } from "@waldiez/models/Chat/types";

export class WaldiezMessage {
    type: WaldiezMessageType;
    content: string | null;
    use_carryover: boolean;
    context: { [key: string]: string };

    constructor(
        props: {
            type: WaldiezMessageType;
            use_carryover: boolean;
            content: string | null;
            context?: { [key: string]: string };
        } = {
            type: "none",
            use_carryover: false,
            content: null,
        },
    ) {
        const { type, use_carryover, content, context } = props;
        this.type = type;
        this.use_carryover = use_carryover;
        this.content = content;
        this.context = context || {};
    }
}
