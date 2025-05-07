/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

/**
 * WaldiezMessageBase
 * @param id - The id of the message
 * @param timestamp - The timestamp of the message
 * @param type - The type of the message (print/error/input_request...)
 * @param request_id - The request id of the message (if type is input_request)
 * @param password - The password of the message (if type is input_request)
 */
export type WaldiezMessageBase = {
    id: string;
    timestamp: string;
    type: string; // print/error/input_request...
    request_id?: string; // if type is input_request
    password?: boolean;
};

// Content structure for structured content (text, images, etc.)
/**
 * WaldiezContentItem
 * @param type - The type of the content item (text, image_url, etc.)
 * @param text - The text content (if type is "text")
 * @param image_url - The image URL (if type is "image_url")
 * @param rest - ([key: string]: any) - Any other data
 */
export type WaldiezContentItem = {
    type: "text" | "image_url" | string;
    text?: string;
    image_url?: {
        url: string;
    };
    [key: string]: any; // Allow for other properties
};

/**
 * WaldiezMessageData
 * @param content - The content of the message (string or array of WaldiezContentItem)
 * @param sender - The sender of the message
 * @param recipient - The recipient of the message
 * @param rest - ([key: string]: any) - Any other data
 * @see {@link WaldiezContentItem}
 */
export type WaldiezMessageData = {
    content: string | WaldiezContentItem[];
    sender?: string;
    recipient?: string;
    [key: string]: any; // Allow for other metadata
};

/**
 * WaldiezPreviousMessage
 * @param id - The id of the message
 * @param timestamp - The timestamp of the message
 * @param type - The type of the message (print/error/input_request...)
 * @param request_id - The request id of the message (if type is input_request)
 * @param password - The password of the message (if type is input_request)
 * @param data - The data of the message (if type is print)
 * @param content - The content of the message (if type is print)
 * @param sender - The sender of the message (if type is print)
 * @param recipient - The recipient of the message (if type is print)
 * @param rest - ([key: string]: any) - Any other data
 * @see {@link WaldiezMessageBase}
 * @see {@link WaldiezMessageData}
 */
export type WaldiezPreviousMessage = WaldiezMessageBase & {
    data: string | WaldiezMessageData | { [key: string]: any };
};

/**
 * WaldiezChatMessage
 * @param id - The id of the message
 * @param timestamp - The timestamp of the message
 * @param type - The type of the message (print/error/input_request...)
 * @param request_id - The request id of the message (if type is input_request)
 * @param password - The password of the message (if type is input_request)
 * @param content - The content of the message (string or React.ReactNode)
 * @param sender - The sender of the message
 * @param recipient - The recipient of the message
 * @see {@link WaldiezMessageBase}
 * @see {@link WaldiezPreviousMessage}
 * @see {@link WaldiezContentItem}
 * @see {@link WaldiezMessageData}
 */
export type WaldiezChatMessage = WaldiezMessageBase & {
    content: string | React.ReactNode;
    sender?: string;
    recipient?: string;
};

/**
 * WaldiezChatUIProps
 * @param messages - The messages to display in the chat UI
 * @param userParticipants - The set of user participants (names of senders considered as "user_proxy")
 * @see {@link WaldiezPreviousMessage}
 */
export type ChatUIProps = {
    messages: WaldiezPreviousMessage[];
    userParticipants: Set<string>; // Names of senders considered as "user_proxy"
};
