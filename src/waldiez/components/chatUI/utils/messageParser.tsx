/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

import { ImageWithRetry } from "@waldiez/components/chatUI/imageWithRetry";
import { Markdown } from "@waldiez/components/markdown";

const parseStructuredContent = (items: any[], isDarkMode: boolean, onImageClick: (url: string) => void) => {
    const children = items
        .map((item, idx) => {
            if (!item || !item.type) {
                console.warn("Invalid item in structured content", item);
                return null;
            }
            if (item.type === "text" && item.text.trim().length > 0) {
                return (
                    <Markdown
                        key={`text-${idx}`}
                        content={item.text}
                        isDarkMode={isDarkMode}
                        onImageClick={onImageClick}
                    />
                );
            }
            if (item.type === "image_url" && item.image_url?.url) {
                return (
                    <ImageWithRetry
                        key={`img-${idx}`}
                        src={item.image_url.url}
                        className="chat-image"
                        onClick={() => onImageClick(item.image_url.url)}
                    />
                );
            }
            if (item.type === "image" && item.image?.url) {
                return (
                    <ImageWithRetry
                        key={`img-${idx}`}
                        src={item.image.url}
                        className="chat-image"
                        onClick={() => onImageClick(item.image.url)}
                    />
                );
            }
            console.warn("Unsupported item type in structured content", item);
            return null;
        })
        .filter(Boolean);

    if (children.length === 0) {
        return null;
    }

    return <div className="structured-content">{children}</div>;
};

// eslint-disable-next-line max-statements
const parseTextWithImages = (text: string, isDarkMode: boolean, onImageClick: (url: string) => void) => {
    // noinspection RegExpRedundantEscape
    const regex = /\[Image:\s*(.+?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text))) {
        const [_placeholder, url] = match;
        const textBefore = text.slice(lastIdx, match.index);
        if (textBefore) {
            parts.push(
                <Markdown
                    key={`text-${lastIdx}`}
                    content={textBefore}
                    isDarkMode={isDarkMode}
                    onImageClick={onImageClick}
                />,
            );
            // parts.push(<span key={`text-${lastIdx}`}>{textBefore}</span>);
        }

        if (url) {
            parts.push(
                <ImageWithRetry
                    key={`img-${match.index}`}
                    src={url}
                    className="chat-image"
                    onClick={() => onImageClick(url)}
                />,
            );
            lastIdx = regex.lastIndex;
        }
    }

    const remainingText = text.slice(lastIdx);
    if (remainingText) {
        parts.push(<span key={"text-end"}>{remainingText}</span>);
    }

    return <div className="content-with-images">{parts}</div>;
};

export const parseMessageContent = (
    data: any,
    isDarkMode: boolean,
    onImageClick: (url: string) => void,
): React.ReactNode => {
    if (typeof data === "string") {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed)
                ? parseStructuredContent(parsed, isDarkMode, onImageClick)
                : parseTextWithImages(data, isDarkMode, onImageClick);
        } catch {
            return parseTextWithImages(data, isDarkMode, onImageClick);
        }
    } else if ("content" in data && data.content) {
        return Array.isArray(data.content)
            ? parseStructuredContent(data.content, isDarkMode, onImageClick)
            : parseTextWithImages(String(data.content), isDarkMode, onImageClick);
    } else if (Array.isArray(data)) {
        return parseStructuredContent(data, isDarkMode, onImageClick);
    }
    return parseTextWithImages(String(data.content), isDarkMode, onImageClick);
};
