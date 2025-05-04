/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSkillType } from "@waldiez/models/Skill/types";

/**
 * Skill data.
 * @param content - The content of the skill
 * @param skillType - The type of the skill: shared, custom, langchain, crewai
 * @param secrets - The secrets (environment variables) of the skill
 */
export class WaldiezSkillData {
    content: string;
    skillType: WaldiezSkillType;
    secrets: { [key: string]: unknown };
    constructor(
        props: {
            content: string;
            skillType: WaldiezSkillType;
            secrets: { [key: string]: unknown };
        } = {
            content: DEFAULT_CUSTOM_SKILL_CONTENT,
            skillType: "custom",
            secrets: {},
        },
    ) {
        const { content, skillType, secrets } = props;
        this.skillType = skillType;
        this.content = content;
        this.secrets = secrets;
    }
}

export const DEFAULT_CUSTOM_SKILL_CONTENT = `
"""Replace this with your code.

make sure a function with the same name
as the skill is defined in the code.
"""

# Example:
# skill name: 'new_skill'
#
# def new_skill() -> str:
#     """Skill entry point."""
#     return "Hello, world!"
#
# Add your code below

def new_skill() -> None:
    """Skill entry point."""
    ...
`;

export const DEFAULT_SHARED_SKILL_CONTENT = `
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

export const DEFAULT_LANGCHAIN_SKILL_CONTENT = `
"""Replace this with your code.

You can define any of the tools available in the langchain_community package.
You can explore the available tools in the LangChain Community Tools folder:
https://github.com/langchain-ai/langchain/tree/master/libs/community/langchain_community/tools

Make sure you have a variable named with the same name as the skill
"""

# Example:
# # skill name: 'wiki_tool'
#
# from langchain_community.tools import WikipediaQueryRun
# from langchain_community.utilities import WikipediaAPIWrapper
#
# api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
# wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
#
# Add your code below

`;

export const DEFAULT_CREWAI_SKILL_CONTENT = `
"""Replace this with your code.

You can define any of the tools available in the crewai_tools package.
You can explore the full list of available tools in the CrewAI Tools repository:
https://github.com/crewAIInc/crewAI-tools/tree/main

Make sure you have a variable named with the same name as the skill.
"""

# Example:
# # skill name: 'scrape_tool'
#
# from crewai_tools import ScrapeWebsiteTool
# scrape_tool = ScrapeWebsiteTool()
#
# Add your code below

`;

export const DEFAULT_SKILL_CONTENT_MAP: Record<WaldiezSkillType, string> = {
    shared: DEFAULT_SHARED_SKILL_CONTENT,
    custom: DEFAULT_CUSTOM_SKILL_CONTENT,
    langchain: DEFAULT_LANGCHAIN_SKILL_CONTENT,
    crewai: DEFAULT_CREWAI_SKILL_CONTENT,
};
