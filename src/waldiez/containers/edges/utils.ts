/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Position } from "@xyflow/react";

// eslint-disable-next-line complexity
export const getEdgeTranslations = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourcePosition: Position,
    targetPosition: Position,
) => {
    const translations = {
        edgeStart: `translate(-50%, 0%) translate(${sourceX}px,${sourceY}px)`,
        edgeEnd: `translate(-50%, 0%) translate(${targetX}px,${targetY}px)`,
    };
    if (sourcePosition === Position.Right && targetPosition === Position.Left) {
        translations.edgeStart = `translate(0%, 0%) translate(${sourceX - 10}px,${sourceY - 35}px)`;
        translations.edgeEnd = `translate(-100%, 0%) translate(${targetX}px,${targetY - 35}px)`;
        return translations;
    }
    if (sourcePosition === Position.Right && targetPosition === Position.Top) {
        translations.edgeStart = `translate(0%, 0%) translate(${sourceX - 10}px,${sourceY}px)`;
        translations.edgeEnd = `translate(-100%, 0%) translate(${targetX - 10}px,${targetY - 30}px)`;
        return translations;
    }
    if (sourcePosition === Position.Right && targetPosition === Position.Right) {
        translations.edgeStart = `translate(0%, 0%) translate(${sourceX - 10}px,${sourceY}px)`;
        translations.edgeEnd = `translate(0, 0) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Left && targetPosition === Position.Right) {
        translations.edgeStart = `translate(-100%, 0%) translate(${sourceX + 10}px,${sourceY}px)`;
        translations.edgeEnd = `translate(0, 0) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Left && targetPosition === Position.Bottom) {
        translations.edgeStart = `translate(-100%, 0%) translate(${sourceX + 10}px,${sourceY - 30}px)`;
        translations.edgeEnd = `translate(0, 0) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Left && targetPosition === Position.Left) {
        translations.edgeStart = `translate(-100%, 0%) translate(${sourceX + 10}px,${sourceY}px)`;
        translations.edgeEnd = `translate(-100%, 0%) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Top && targetPosition === Position.Bottom) {
        translations.edgeStart = `translate(-100%, 0%) translate(${sourceX}px,${sourceY - 30}px)`;
        translations.edgeEnd = `translate(-100%, 0%) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Top && targetPosition === Position.Right) {
        translations.edgeStart = `translate(-100%, 0%) translate(${sourceX}px,${sourceY - 30}px)`;
        translations.edgeEnd = `translate(0, 0) translate(${targetX}px,${targetY}px)`;
        return translations;
    }
    if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
        translations.edgeStart = `translate(0%, 0%) translate(${sourceX}px,${sourceY}px)`;
        translations.edgeEnd = `translate(-100%, 0%) translate(${targetX}px,${targetY - 30}px)`;
        return translations;
    }
    if (sourcePosition === Position.Bottom && targetPosition === Position.Top) {
        translations.edgeStart = `translate(0%, 0%) translate(${sourceX}px,${sourceY}px)`;
        translations.edgeEnd = `translate(0%, 0%) translate(${targetX}px,${targetY - 30}px)`;
        return translations;
    }
    return translations;
};
