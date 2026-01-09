/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { Fragment, type ReactNode } from "react";

import { ImageWithRetry } from "@waldiez/components/chatUI/imageWithRetry";
import { Markdown } from "@waldiez/components/markdown";

const keyOf = (path: string, idx: number, type: string, hint?: string | number) =>
    `${path}/${idx}:${type}${hint ? `#${hint}` : ""}`;
const parseStructuredContent = (
    items: any[],
    isDarkMode: boolean,
    onImageClick: (url: string) => void,
    path = "root",
) => {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const children = items
        // eslint-disable-next-line max-statements
        .map((item, idx) => {
            if (typeof item === "string") {
                return parseTextWithImages(item, isDarkMode, onImageClick);
            }
            if (!item || !item.type) {
                console.warn("Invalid item in structured content", item);
                return null;
            }
            if (item.type === "text" && typeof item.text === "string" && item.text.trim()) {
                return (
                    <Markdown
                        key={keyOf(path, idx, "text")}
                        content={item.text}
                        isDarkMode={isDarkMode}
                        onImageClick={onImageClick}
                    />
                );
            }
            if (item.type === "image_url" && item.image_url?.url) {
                const url = item.image_url.url;
                return (
                    <ImageWithRetry
                        key={keyOf(path, idx, "image_url", url)}
                        src={url}
                        className="chat-image"
                        onClick={() => onImageClick(url)}
                    />
                );
            }
            if (item.type === "image" && item.image?.url) {
                const url = item.image.url;
                return (
                    <ImageWithRetry
                        key={keyOf(path, idx, "image", url)}
                        src={url}
                        className="chat-image"
                        onClick={() => onImageClick(url)}
                    />
                );
            }
            if (Array.isArray(item.content)) {
                const nested = parseStructuredContent(
                    item.content,
                    isDarkMode,
                    onImageClick,
                    `${path}/${idx}`,
                );
                if (nested) {
                    return <Fragment key={keyOf(path, idx, "nested")}>{nested}</Fragment>;
                }
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
    const parts: ReactNode[] = [];
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
): ReactNode => {
    if (typeof data === "string") {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed)
                ? parseStructuredContent(parsed, isDarkMode, onImageClick)
                : parseStructuredContent([parsed], isDarkMode, onImageClick);
        } catch {
            return parseTextWithImages(data, isDarkMode, onImageClick);
        }
    }
    if (Array.isArray(data)) {
        return parseStructuredContent(data, isDarkMode, onImageClick);
    }
    if (typeof data === "object") {
        if ("content" in data && data.content) {
            return Array.isArray(data.content)
                ? parseStructuredContent(data.content, isDarkMode, onImageClick)
                : parseStructuredContent([data.content], isDarkMode, onImageClick);
        }
        return parseStructuredContent([data], isDarkMode, onImageClick);
    }
    return parseTextWithImages(String(data), isDarkMode, onImageClick);
};
