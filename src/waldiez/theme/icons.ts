/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import assistantWebp from "@waldiez/assets/assistant.webp";
import captainWebp from "@waldiez/assets/captain.webp";
import generic from "@waldiez/assets/generic.webp";
import azure from "@waldiez/assets/logos/azure.svg";
import bedrock from "@waldiez/assets/logos/bedrock.svg";
import anthropic from "@waldiez/assets/logos/claude.svg";
import cohere from "@waldiez/assets/logos/cohere.svg";
import deepseek from "@waldiez/assets/logos/deepseek.svg";
import duckduckgo from "@waldiez/assets/logos/duckduckgo.svg";
import google from "@waldiez/assets/logos/gemini.svg";
import googleSearchTool from "@waldiez/assets/logos/google.svg";
import groq from "@waldiez/assets/logos/groq.svg";
import mistral from "@waldiez/assets/logos/mistral.svg";
import nim from "@waldiez/assets/logos/nim.svg";
import openai from "@waldiez/assets/logos/openai.svg";
import other from "@waldiez/assets/logos/other.svg";
import perplexity from "@waldiez/assets/logos/perplexity.svg";
import searxng from "@waldiez/assets/logos/searxng.svg";
import tavily from "@waldiez/assets/logos/tavily.svg";
import together from "@waldiez/assets/logos/together.svg";
import wikipediaSearchTool from "@waldiez/assets/logos/wikipedia.svg";
import youtubeSearchTool from "@waldiez/assets/logos/youtube.svg";
import managerWebp from "@waldiez/assets/manager.webp";
import ragWebp from "@waldiez/assets/rag.webp";
import reasoningWebp from "@waldiez/assets/reasoning.webp";
import userWebp from "@waldiez/assets/user.webp";

/**
 * A collection of logos used in Waldiez.
 * These logos represent various AI providers and are used in the UI.
 */
export const LOGOS = {
    openai,
    azure,
    bedrock,
    deepseek,
    google,
    gemini: google,
    anthropic,
    cohere,
    mistral,
    groq,
    together,
    nim,
    other,
};
/**
 * A collection of agent icons used in Waldiez.
 * These icons represent different roles in the system and are used in the UI.
 */
export const AGENT_ICONS = {
    user_proxy: userWebp,
    rag_user_proxy: ragWebp,
    doc_agent: ragWebp,
    captain: captainWebp,
    assistant: assistantWebp,
    reasoning: reasoningWebp,
    group_manager: managerWebp,
};

export const TOOL_ICONS = {
    google_search: googleSearchTool,
    wikipedia_search: wikipediaSearchTool,
    youtube_search: youtubeSearchTool,
    tavily_search: tavily,
    perplexity_search: perplexity,
    duckduckgo_search: duckduckgo,
    searxng_search: searxng,
};

export const WALDIEZ_ICON = generic;
