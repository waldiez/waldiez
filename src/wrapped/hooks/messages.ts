/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { nanoid } from "nanoid";

import { WaldiezChatMessage, WaldiezChatMessageType, WaldiezMediaContent } from "@waldiez/types";

import { DataContent } from "./types";

export const useWaldiezMessages = ({
    inputRequestId,
}: {
    inputRequestId: React.RefObject<string | undefined>;
}) => {
    const processImagePlaceholders = useCallback((chatMessage: WaldiezChatMessage) => {
        if (!chatMessage.content || !Array.isArray(chatMessage.content)) {
            return;
        }
        const serverBaseUrl = window.location.protocol + "//" + window.location.host;
        const imageUrl = `${serverBaseUrl}/uploads/${inputRequestId.current}.png`;

        // Process each content item
        for (let i = 0; i < chatMessage.content.length; i++) {
            const item = chatMessage.content[i];

            // Check for image content
            if (item.type === "image" && item.image && item.image.url === "<image>") {
                // Replace the placeholder with default image URL
                item.image.url = imageUrl;
            }

            // Check for the image_url type (which should be converted to image type)
            if (
                item.type === "image_url" &&
                (item as any).image_url &&
                (item as any).image_url.url === "<image>"
            ) {
                // Convert the image_url type to a proper image type
                chatMessage.content[i] = {
                    type: "image",
                    image: {
                        url: imageUrl,
                        alt: (item as any).image_url.alt || "Image",
                    },
                };
            }
        }
    }, []);

    const extractChatData = (input: unknown): WaldiezMediaContent[] => {
        if (typeof input === "string") {
            return [{ type: "text", text: input }];
        }

        if (Array.isArray(input)) {
            return input.map(item => getChatContent(item));
        }

        if (typeof input === "object" && input !== null) {
            // If already a known media content object
            if ("type" in input && typeof (input as any).type === "string") {
                return [getChatContent(input)];
            }

            // Unknown object → JSON stringified
            return [{ type: "text", text: JSON.stringify(input) }];
        }

        return [{ type: "text", text: JSON.stringify(input) }];
    };

    // Chat message creation
    const makeChatMessage = useCallback(
        (rawContent: DataContent, type: string = "text"): WaldiezChatMessage => {
            const id = nanoid();
            const timestamp = new Date().toISOString();

            const { sender, recipient } = getChatParticipants(rawContent);

            let chatData: WaldiezMediaContent[] = [];

            if (typeof rawContent === "string") {
                chatData = extractChatData(rawContent);
            } else if (typeof rawContent === "object" && rawContent !== null && "content" in rawContent) {
                const inner = (rawContent as any).content;

                if (typeof inner === "object" && inner !== null && "content" in inner) {
                    chatData = extractChatData(inner.content);
                } else {
                    chatData = extractChatData(inner);
                }
            } else {
                chatData = extractChatData(rawContent);
            }

            return {
                id,
                timestamp,
                type,
                sender,
                recipient,
                request_id: inputRequestId.current || "",
                content: chatData,
            };
        },
        [],
    );

    const getChatParticipants = useCallback(
        (content: DataContent): { sender?: string; recipient?: string } => {
            const extract = (obj: any): { sender?: string; recipient?: string } => {
                const sender = typeof obj?.sender === "string" ? obj.sender : undefined;
                const recipient = typeof obj?.recipient === "string" ? obj.recipient : undefined;
                return { sender, recipient };
            };

            // Handle string: try to parse as JSON
            if (typeof content === "string") {
                try {
                    return getChatParticipants(JSON.parse(content));
                } catch {
                    return { sender: undefined, recipient: undefined };
                }
            }

            // Handle array: look at first item
            if (Array.isArray(content) && content.length > 0) {
                return getChatParticipants(content[0]);
            }

            // Handle object
            if (typeof content === "object" && content !== null) {
                const { sender, recipient } = extract(content);
                if (sender || recipient) {
                    return { sender, recipient };
                }

                // Recurse into `content` property if present
                if ("content" in content && typeof content.content === "object" && content.content !== null) {
                    return getChatParticipants(content.content as DataContent);
                }
            }

            return { sender: undefined, recipient: undefined };
        },
        [],
    );

    const getChatContent = useCallback((item: any): WaldiezMediaContent => {
        if (typeof item !== "object" || item === null || typeof item.type !== "string") {
            return { type: "text", text: JSON.stringify(item) };
        }

        switch (item.type) {
            case "text":
                return { type: "text", text: item.text ?? "" };
            case "image":
                return { type: "image", image: item.image };
            case "image_url":
                return { type: "image_url", image_url: item.image_url };
            case "video":
                return { type: "video", video: item.video };
            case "audio":
                return { type: "audio", audio: item.audio };
            case "file":
            case "document":
            case "markdown":
                return { type: item.type, file: item.file };
            default:
                return { type: "text", text: `[Unknown type: ${item.type}]` };
        }
    }, []);

    const getNewChatMessage = useCallback((data: DataContent, type: WaldiezChatMessageType) => {
        const chatMessage = makeChatMessage(data, type);
        processImagePlaceholders(chatMessage);
        return chatMessage;
    }, []);
    return {
        getNewChatMessage,
    };
};
