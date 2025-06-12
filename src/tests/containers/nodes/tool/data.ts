/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezToolType } from "@waldiez/types";

export const createdAt = new Date().toISOString();
export const updatedAt = new Date().toISOString();

export const flowId = "wf-1";
export const toolId = "wt-1";
export const toolData = {
    label: "label",
    description: "description",
    content: "content",
    toolType: "custom" as WaldiezToolType,
    secrets: {
        toolSecretKey1: "toolSecretValue1",
        toolSecretKey2: "toolSecretValue2",
    },
    requirements: [],
    tags: [],
    createdAt,
    updatedAt,
};

export const storedNodes = [
    {
        id: toolId,
        type: "tool",
        data: toolData,
        position: { x: 0, y: 0 },
    },
];
