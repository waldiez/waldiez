/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import { WaldiezChatContent, WaldiezMediaContent } from "@waldiez/types";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { IBaseMessageData, IInputRequestData } from "@waldiez/utils/chat/types";

// Utility functions
export class MessageUtils {
    static isPasswordPrompt(data: IInputRequestData): boolean {
        if (!data.password) {
            return false;
        }

        if (typeof data.password === "boolean") {
            return data.password;
        }

        if (typeof data.password === "string") {
            return data.password.toLowerCase() === "true";
        }

        return false;
    }

    static normalizePrompt(prompt: string): string {
        return (MESSAGE_CONSTANTS.GENERIC_PROMPTS as string[]).includes(prompt)
            ? MESSAGE_CONSTANTS.DEFAULT_PROMPT
            : prompt;
    }

    static generateMessageId(data: IBaseMessageData): string {
        return data.id || nanoid();
    }

    static generateTimestamp(data: IBaseMessageData): string {
        return data.timestamp || new Date().toISOString();
    }

    static replaceImageUrls(content: unknown, imageUrl: string): WaldiezChatContent {
        if (Array.isArray(content)) {
            return content.map(item => {
                if (item.type === "image_url" && item.image_url?.url) {
                    return {
                        ...item,
                        image_url: {
                            ...item.image_url,
                            url: imageUrl,
                        },
                    };
                }
                return item;
            });
        }

        if (
            typeof content === "object" &&
            content !== null &&
            "type" in content &&
            content.type === "image_url" &&
            "image_url" in content &&
            content.image_url &&
            typeof content.image_url === "object" &&
            "url" in content.image_url &&
            content.image_url?.url
        ) {
            return {
                ...content,
                image_url: {
                    ...content.image_url,
                    url: imageUrl,
                },
            } as WaldiezChatContent;
        }

        return content as WaldiezChatContent;
    }

    static normalizeContent(content: WaldiezChatContent): WaldiezChatContent {
        if (typeof content === "string") {
            return [{ type: "text", text: content }];
        }

        if (Array.isArray(content)) {
            return content;
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
