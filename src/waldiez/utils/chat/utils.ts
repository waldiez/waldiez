/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatContent, WaldiezMediaContent } from "@waldiez/types";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import type { WaldiezChatBaseMessageData } from "@waldiez/utils/chat/types";

// Utility functions
export class MessageUtils {
    static isPasswordPrompt(data: any): boolean {
        if (!data.password || (typeof data.password !== "string" && typeof data.password !== "boolean")) {
            return false;
        }

        if (typeof data.password === "boolean") {
            return data.password;
        }

        return data.password.toLowerCase() === "true";
    }

    static normalizePrompt(prompt: string): string {
        return (MESSAGE_CONSTANTS.GENERIC_PROMPTS as string[]).includes(prompt)
            ? MESSAGE_CONSTANTS.DEFAULT_PROMPT
            : prompt;
    }

    static generateMessageId(data: WaldiezChatBaseMessageData): string {
        return data.id || data.uuid || nanoid();
    }

    static generateTimestamp(data: WaldiezChatBaseMessageData): string {
        return data.timestamp || new Date().toISOString();
    }

    // eslint-disable-next-line max-statements
    static replaceImageUrls(content: unknown, imageUrl: string): WaldiezChatContent {
        const imgRegex = /<img\s+(?!.*src=)([^"'>\s]+)\s*\/?>/g;

        // Helper function to process text content with image replacements
        const processTextContent = (text: string) => {
            const matched = text.match(imgRegex);
            if (matched && matched.length === 1) {
                const mediaUrl = matched[0].replace(imgRegex, `<img alt="Image" src="${imageUrl}" />`);
                return {
                    type: "image_url" as const,
                    image_url: { url: mediaUrl, alt: "Image" },
                };
            }
            return null;
        };

        // Helper function to update existing image_url content
        const updateImageUrl = (item: any) => ({
            ...item,
            image_url: {
                ...item.image_url,
                url: imageUrl,
            },
        });

        // Handle arrays
        if (Array.isArray(content)) {
            return content
                .map(item => {
                    if (typeof item === "string") {
                        const processed = processTextContent(item);
                        if (!processed) {
                            return { type: "text", text: item };
                        }
                        return processed;
                    }
                    if (typeof item !== "object" || item === null || !("type" in item)) {
                        return null;
                    }
                    if (item.type === "image_url" && item.image_url?.url) {
                        return updateImageUrl(item);
                    }
                    /* c8 ignore next 5 */
                    if (item.type === "text" && item.text) {
                        const processed = processTextContent(item.text);
                        return processed || item;
                    }
                    return item;
                })
                .filter(Boolean);
        }

        // Handle objects with type property
        if (typeof content === "object" && content !== null && "type" in content) {
            // Handle image_url type
            if (
                content.type === "image_url" &&
                "image_url" in content &&
                content.image_url &&
                typeof content.image_url === "object" &&
                "url" in content.image_url &&
                content.image_url?.url
            ) {
                return updateImageUrl(content) as WaldiezChatContent;
            }

            // Handle text type
            if (content.type === "text" && "text" in content && typeof content.text === "string") {
                const processed = processTextContent(content.text);
                return (processed || content) as WaldiezChatContent;
            }
        }

        // Handle strings
        if (typeof content === "string") {
            const processed = processTextContent(content);
            if (!processed) {
                return [{ type: "text", text: content }] as WaldiezChatContent;
            }
            return processed as WaldiezChatContent;
        }
        return content as WaldiezChatContent;
    }

    // eslint-disable-next-line max-statements
    static normalizeContent(content: WaldiezChatContent, imageUrl?: string): WaldiezChatContent {
        if (typeof content === "string") {
            if (imageUrl) {
                const imgRegex = /<img\s+(?!.*src=)([^"'>\s]+)\s*\/?>/g;
                const matched = content.match(imgRegex);
                if (matched && matched.length === 1) {
                    const imgurlContent = matched[0].replace(
                        imgRegex,
                        `<img alt="Image" src="${imageUrl}" />`,
                    );
                    return [
                        {
                            type: "image_url",
                            image_url: { url: imgurlContent, alt: "Image" },
                        },
                    ];
                }
            }
            return [{ type: "text", text: content }];
        }

        if (Array.isArray(content)) {
            return content.map(item => {
                const normalized = MessageUtils.normalizeContent(item, imageUrl);
                /* c8 ignore next 3 */
                if (Array.isArray(normalized) && normalized.length === 1) {
                    return normalized[0];
                }
                /* c8 ignore next */
                return normalized;
            }) as WaldiezChatContent;
        }
        if (typeof content === "object" && content !== null && "type" in content) {
            // noinspection SuspiciousTypeOfGuard
            if (content.type === "text" && typeof content.text === "string") {
                return [{ type: "text", text: content.text }];
            }
            if (content.type === "image_url" && content.image_url?.url) {
                return [
                    {
                        type: "image_url",
                        image_url: { url: content.image_url.url, alt: content.image_url.alt || "Image" },
                    },
                ];
            }
        }
        return [content] as WaldiezMediaContent[];
    }

    static generateSpeakerSelectionMarkdown(agents: string[]): string {
        const agentList = agents.map((agent, index) => `- [${index + 1}] ${agent}`).join("\n");

        return [
            MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_HEADER,
            "",
            MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_PROMPT,
            "",
            agentList,
            "",
            MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_NOTE,
        ].join("\n");
    }
}
