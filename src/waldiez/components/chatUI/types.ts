/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type WaldiezMessageBase = {
    id: string;
    timestamp: string;
    type: string; // print/error/input_request...
    request_id?: string; // if type is input_request
    password?: boolean;
};

// Content structure for structured content (text, images, etc.)
export type WaldiezContentItem = {
    type: "text" | "image_url" | string;
    text?: string;
    image_url?: {
        url: string;
    };
    [key: string]: any; // Allow for other properties
};

export type WaldiezMessageData = {
    content: string | WaldiezContentItem[];
    sender?: string;
    recipient?: string;
    [key: string]: any; // Allow for other metadata
};

export type WaldiezPreviousMessage = WaldiezMessageBase & {
    data: string | WaldiezMessageData | { [key: string]: any };
};

export type WaldiezChatMessage = WaldiezMessageBase & {
    content: string | React.ReactNode;
    sender?: string;
    recipient?: string;
};

export type ChatUIProps = {
    messages: WaldiezPreviousMessage[];
    userParticipants: Set<string>; // Names of senders considered as "user"
};
