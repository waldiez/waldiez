/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { nanoid } from "nanoid";

import { WaldiezChatMessage, WaldiezChatMessageType, WaldiezMediaContent } from "@waldiez/types";

import { DataContent } from "./types";

/* eslint-disable max-statements,complexity */
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

    // Chat message creation
    const makeChatMessage = useCallback(
        (rawContent: DataContent, type: string = "text"): WaldiezChatMessage => {
            const id = nanoid();
            const timestamp = new Date().toISOString();

            const { sender, recipient } = getChatParticipants(rawContent);

            let chatData: WaldiezMediaContent[] = [];

            if (
                typeof rawContent === "object" &&
                rawContent !== null &&
                "content" in rawContent &&
                typeof rawContent.content === "object" &&
                rawContent.content !== null &&
                "content" in rawContent.content
            ) {
                // Handle nested content
                const nestedContent = (rawContent.content as any).content;

                if (typeof nestedContent === "string") {
                    // Simple text content
                    chatData = [{ type: "text", text: nestedContent }];
                } else if (Array.isArray(nestedContent)) {
                    // Array of content items
                    chatData = nestedContent.map(item => getChatContent(item));
                } else if (typeof nestedContent === "object" && nestedContent !== null) {
                    // Single content item as object
                    chatData = [getChatContent(nestedContent)];
                } else {
                    // Fallback
                    chatData = [{ type: "text", text: JSON.stringify(nestedContent) }];
                }
            }
            // Handle other cases
            else if (typeof rawContent === "object" && rawContent !== null && "content" in rawContent) {
                const inner = (rawContent as any).content;

                if (Array.isArray(inner)) {
                    chatData = inner.map(item => getChatContent(item));
                } else if (typeof inner === "string") {
                    chatData = [{ type: "text", text: inner }];
                } else if (
                    typeof inner === "object" &&
                    inner !== null &&
                    "type" in inner &&
                    typeof inner.type === "string"
                ) {
                    chatData = [getChatContent(inner)];
                } else {
                    chatData = [
                        { type: "text", text: typeof inner === "string" ? inner : JSON.stringify(inner) },
                    ];
                }
            } else if (typeof rawContent === "string") {
                chatData = [{ type: "text", text: rawContent }];
            } else {
                chatData = [{ type: "text", text: JSON.stringify(rawContent) }];
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
        (
            content: DataContent,
        ): {
            sender?: string;
            recipient?: string;
        } => {
            let sender: string | undefined;
            let recipient: string | undefined;

            // Check if content is an object with sender/recipient
            if (typeof content === "object" && content !== null) {
                if ("sender" in content && typeof content.sender === "string") {
                    sender = content.sender;
                }
                if ("recipient" in content && typeof content.recipient === "string") {
                    recipient = content.recipient;
                }
                if (sender && recipient) {
                    return { sender, recipient };
                }

                // Check nested content
                if ("content" in content && typeof content.content === "object" && content.content !== null) {
                    return getChatParticipants(content.content as DataContent);
                }
            }

            // Check if content is an array
            if (Array.isArray(content) && content.length > 0) {
                const firstItem = content[0];
                if (typeof firstItem === "object" && firstItem !== null) {
                    if ("sender" in firstItem && typeof firstItem.sender === "string") {
                        sender = firstItem.sender;
                    }
                    if ("recipient" in firstItem && typeof firstItem.recipient === "string") {
                        recipient = firstItem.recipient;
                    }
                }

                // Try to parse string as JSON
                if (typeof firstItem === "string") {
                    try {
                        const parsedContent = JSON.parse(firstItem);
                        return getChatParticipants(parsedContent);
                    } catch (_) {
                        // Ignore JSON parse errors
                    }
                }
            }

            // Try to parse string as JSON
            if (typeof content === "string") {
                try {
                    const parsedContent = JSON.parse(content);
                    return getChatParticipants(parsedContent);
                } catch (_) {
                    // Ignore JSON parse errors
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
