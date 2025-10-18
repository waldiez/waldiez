/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezChatMessage, WaldiezMediaContent } from "@waldiez/components/chatUI/types";

/* eslint-disable complexity */
export const getContentString = (
    content: WaldiezMediaContent,
    onPreview?: (type: "image" | "video" | "audio" | "file", url: string) => string,
) => {
    if (typeof content === "string") {
        return content;
    }
    switch (content.type) {
        case "text":
            return content.text;
        case "image":
            if (content.image.url) {
                return onPreview?.("image", content.image.url) || content.image.url;
            }
            return content.image.alt || content.image.file?.name || "<image>";
        case "image_url":
            if (content.image_url.url) {
                return onPreview?.("image", content.image_url.url) || content.image_url.url;
            }
            return content.image_url.alt || content.image_url.file?.name || "<image_url>";
        case "video":
            if (content.video.url) {
                return onPreview?.("video", content.video.url) || content.video.url;
            }
            return content.video.file?.name || content.video.thumbnailUrl || "<video>";
        case "audio":
            if (content.audio.url) {
                return onPreview?.("audio", content.audio.url) || content.audio.url;
            }
            return content.audio.file?.name || content.audio.transcript || "<audio>";
        case "file":
            if (content.file.previewUrl) {
                return onPreview?.("file", content.file.previewUrl) || content.file.previewUrl;
            }
            if (content.file.url) {
                return onPreview?.("file", content.file.url) || content.file.url;
            }
            return content.file.name;
    }
};

export const getMessageString = (
    message: WaldiezChatMessage,
    onPreview?: (type: "image" | "video" | "audio" | "file", url: string) => string,
) => {
    if (typeof message === "string") {
        return message;
    }
    if (typeof message.content === "string") {
        return message.content;
    }
    if (Array.isArray(message.content)) {
        return message.content.map(entry => getContentString(entry, onPreview)).join(" ");
    }
    if ("content" in message.content) {
        if (typeof message.content.content === "string") {
            return message.content.content;
        }
        if (Array.isArray(message.content.content)) {
            return message.content.content.map(entry => getContentString(entry, onPreview)).join(" ");
        }
        return getContentString(message.content.content);
    }
    return getContentString(message.content);
};
