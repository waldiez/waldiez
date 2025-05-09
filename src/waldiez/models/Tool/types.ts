/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

export type WaldiezToolType = "shared" | "custom" | "langchain" | "crewai";

export type WaldiezToolDataCommon = {
    content: string;
    toolType: WaldiezToolType;
    description: string;
    secrets: { [key: string]: unknown };
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

export type WaldiezNodeToolData = WaldiezToolDataCommon & {
    label: string;
};

export type WaldiezNodeTool = Node<WaldiezNodeToolData, "tool">;
