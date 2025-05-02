/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

import { ImageWithRetry } from "@waldiez/components/chatUI/imageWithRetry";

const parseStructuredContent = (items: any[], onImageClick: (url: string) => void) => (
    <div className="structured-content">
        {items.map((item, idx) => {
            if (item.type === "text") {
                return <span key={`text-${idx}`}>{item.text}</span>;
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
            return null;
        })}
    </div>
);

// eslint-disable-next-line max-statements
const parseTextWithImages = (text: string, onImageClick: (url: string) => void) => {
    const regex = /\[Image:\s*(.+?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text))) {
        const [_placeholder, url] = match;
        const textBefore = text.slice(lastIdx, match.index);
        if (textBefore) {
            parts.push(<span key={`text-${lastIdx}`}>{textBefore}</span>);
        }

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

    const remainingText = text.slice(lastIdx);
    if (remainingText) {
        parts.push(<span key={"text-end"}>{remainingText}</span>);
    }

    return <div className="content-with-images">{parts}</div>;
};

export const parseMessageContent = (data: any, onImageClick: (url: string) => void): React.ReactNode => {
    if (typeof data === "string") {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed)
                ? parseStructuredContent(parsed, onImageClick)
                : parseTextWithImages(data, onImageClick);
        } catch {
            return parseTextWithImages(data, onImageClick);
        }
    } else if (data.content) {
        return Array.isArray(data.content)
            ? parseStructuredContent(data.content, onImageClick)
            : parseTextWithImages(String(data.content), onImageClick);
    }
    return JSON.stringify(data);
};
