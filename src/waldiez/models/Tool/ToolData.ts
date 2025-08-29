/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezToolType } from "@waldiez/models/Tool/types";

/**
 * Tool data.
 * @param content - The content of the tool
 * @param toolType - The type of the tool: shared, custom, langchain, crewai
 * @param secrets - The secrets (environment variables) of the tool
 */
export class WaldiezToolData {
    content: string;
    toolType: WaldiezToolType;
    secrets: { [key: string]: unknown };
    kwargs?: { [key: string]: unknown } = {};
    constructor(
        props: {
            content: string;
            toolType: WaldiezToolType;
            secrets: { [key: string]: unknown };
            kwargs?: { [key: string]: unknown };
        } = {
            content: DEFAULT_SHARED_TOOL_CONTENT,
            toolType: "shared",
            secrets: {},
            kwargs: {},
        },
    ) {
        const { content, toolType, secrets, kwargs } = props;
        this.toolType = toolType;
        this.content = content;
        this.secrets = secrets;
        this.kwargs = kwargs || {};
    }
}

export const DEFAULT_CUSTOM_TOOL_CONTENT = `
"""Replace this with your code.

make sure a function with the same name
as the tool is defined in the code.
"""

# Example:
# tool name: 'new_tool'
#
# def new_tool() -> str:
#     """Tool entry point."""
#     return "Hello, world!"
#
# Add your code below

def new_tool() -> None:
    """Tool entry point."""
    ...
`;

export const DEFAULT_SHARED_TOOL_CONTENT = `
"""Replace this with your code.

Add any code here that will be placed at the top of the whole flow.
"""

# Example:
# global variable
# DATABASE = {
#     "users": [
#         {"id": 1, "name": "Alice"},
#         {"id": 2, "name": "Bob"},
#     ],
#     "posts": [
#         {"id": 1, "title": "Hello, world!", "author_id": 1},
#         {"id": 2, "title": "Another post", "author_id": 2},
#     ],
# }
#
# Add your code below

`;

export const DEFAULT_LANGCHAIN_TOOL_CONTENT = `
"""Replace this with your code.

You can define any of the tools available in the langchain_community package.
You can explore the available tools in the LangChain Community Tools folder:
https://github.com/langchain-ai/langchain/tree/master/libs/community/langchain_community/tools

Make sure you have a variable named with the same name as the tool
"""

# Example:
# # tool name: 'wiki_tool'
#
# from langchain_community.tools import WikipediaQueryRun
# from langchain_community.utilities import WikipediaAPIWrapper
#
# api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
# wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
#
# Add your code below

`;

export const DEFAULT_CREWAI_TOOL_CONTENT = `
"""Replace this with your code.

You can define any of the tools available in the crewai_tools package.
You can explore the full list of available tools in the CrewAI Tools repository:
https://github.com/crewAIInc/crewAI-tools/tree/main

Make sure you have a variable named with the same name as the tool.
"""

# Example:
# # tool name: 'scrape_tool'
#
# from crewai_tools import ScrapeWebsiteTool
# scrape_tool = ScrapeWebsiteTool()
#
# Add your code below

`;

/**
 * Default tool content map for different tool types.
 * This map provides default content for each tool type.
 * @see {@link WaldiezToolType}
 */
export const DEFAULT_TOOL_CONTENT_MAP: Record<WaldiezToolType, string> = {
    shared: DEFAULT_SHARED_TOOL_CONTENT,
    custom: DEFAULT_CUSTOM_TOOL_CONTENT,
    langchain: DEFAULT_LANGCHAIN_TOOL_CONTENT,
    crewai: DEFAULT_CREWAI_TOOL_CONTENT,
    predefined: "",
};
