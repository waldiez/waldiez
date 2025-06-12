/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatData } from "@waldiez/models/Chat/ChatData";
import { WaldiezEdgeType } from "@waldiez/models/Chat/types";
import { getId } from "@waldiez/utils";

/**
 * Waldiez Chat
 * @param id - The ID
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezChatData}
 */
export class WaldiezChat {
    id: string;
    type: WaldiezEdgeType = "chat";
    source: string;
    target: string;
    data: WaldiezChatData;
    rest?: { [key: string]: unknown };

    constructor(props: {
        id: string;
        data: WaldiezChatData;
        type: WaldiezEdgeType;
        source: string;
        target: string;
        rest?: { [key: string]: unknown };
    }) {
        this.id = props.id;
        this.source = props.source;
        this.target = props.target;
        this.type = props.type;
        this.data = props.data;
        this.rest = props.rest || {};
    }

    /**
     * Creates a new WaldiezChat instance with default values.
     * @returns A new instance of WaldiezChat.
     */
    static create(props: { type: WaldiezEdgeType; source: string; target: string }): WaldiezChat {
        const data = new WaldiezChatData();
        return new WaldiezChat({
            id: `wc-${getId()}`,
            source: props.source,
            target: props.target,
            type: props.type,
            data,
        });
    }
}
