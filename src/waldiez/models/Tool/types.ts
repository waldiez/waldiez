/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

export type { WaldiezTool } from "@waldiez/models/Tool/Tool";
export type { WaldiezToolData } from "@waldiez/models/Tool/ToolData";

/**
 * WaldiezToolType
 * Represents the type of tool used in Waldiez.
 * @param shared - Shared tool
 * @param custom - Custom tool
 * @param langchain - LangChain tool
 * @param crewai - CrewAI tool
 * @param predefined - Predefined tool
 */
export type WaldiezToolType = "shared" | "custom" | "langchain" | "crewai" | "predefined";

/**
 * WaldiezToolDataCommon
 * Represents the common data structure for all tools in Waldiez.
 * @param content - The content of the tool
 * @param toolType - The type of tool
 * @param description - The description of the tool
 * @param secrets - The secrets associated with the tool
 * @param kwargs - Additional keyword arguments for the tool initialization
 * @param requirements - The requirements for the tool
 * @param tags - The tags associated with the tool
 * @param createdAt - The creation date of the tool
 * @param updatedAt - The last update date of the tool
 */
export type WaldiezToolDataCommon = {
    content: string;
    toolType: WaldiezToolType;
    description: string;
    secrets: { [key: string]: unknown };
    kwargs?: { [key: string]: unknown };
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

/**
 * WaldiezNodeToolData
 * Represents the data of a node tool.
 * @param label - The label of the tool
 * @param name - The name of the tool
 * @param content - The content of the tool
 * @param toolType - The type of tool
 * @param description - The description of the tool
 * @param secrets - The secrets associated with the tool
 * @param requirements - The requirements for the tool
 * @param tags - The tags associated with the tool
 * @param createdAt - The creation date of the tool
 * @param updatedAt - The last update date of the tool
 * @see {@link WaldiezToolDataCommon}
 */
export type WaldiezNodeToolData = WaldiezToolDataCommon & {
    label: string;
};

/**
 * WaldiezNodeTool
 * Represents a node tool in the graph.
 * @param data - The data of the tool
 * @param type - The type of the node (tool)
 * @see {@link WaldiezNodeToolData}
 */
export type WaldiezNodeTool = Node<WaldiezNodeToolData, "tool">;
