/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatData } from "@waldiez/models/Chat/ChatData";
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
    data: WaldiezChatData;
    rest?: { [key: string]: unknown };

    constructor(
        props: {
            id: string;
            data: WaldiezChatData;
            rest?: { [key: string]: unknown };
        } = {
            id: "1",
            data: new WaldiezChatData(),
        },
    ) {
        this.id = props.id;
        this.data = props.data;
        this.rest = props.rest || {};
    }

    get source(): string {
        return this.data.source;
    }
    get target(): string {
        return this.data.target;
    }
    static create(props: { source: string; target: string }): WaldiezChat {
        const data = new WaldiezChatData();
        data.source = props.source;
        data.target = props.target;
        return new WaldiezChat({
            id: `wc-${getId()}`,
            data,
        });
    }
}
