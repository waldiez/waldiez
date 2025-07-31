/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const PREDEFINED_TOOL_TYPES = [
    "wikipedia_search",
    "youtube_search",
    "google_search",
    "tavily_search",
    "duckduckgo_search",
    "perplexity_search",
    "searxng_search",
];

export const DEFAULT_PREDEFINED_TOOL_DESCRIPTION: { [key: string]: string } = {
    wikipedia_search: "Search Wikipedia for a given query.",
    youtube_search: "Search YouTube for a given query.",
    google_search: "Search Google for a given query.",
    tavily_search: "Search Tavily for a given query.",
    duckduckgo_search: "Search DuckDuckGo for a given query.",
    perplexity_search: "Search Perplexity AI for a given query.",
    searxng_search: "Search SearxNG for a given query.",
    shared: "Shared code available to all agents.",
    custom: "A custom tool that you define.",
};

export const DEFAULT_PREDEFINED_TOOL_NAME: { [key: string]: string } = {
    wikipedia_search: "Wikipedia Search",
    youtube_search: "YouTube Search",
    google_search: "Google Search",
    tavily_search: "Tavily Search",
    duckduckgo_search: "DuckDuckGo Search",
    perplexity_search: "Perplexity AI Search",
    searxng_search: "SearxNG Search",
    shared: "waldiez_shared",
    custom: "new_tool",
};

export const PREDEFINED_TOOL_REQUIRED_ENVS: { [key: string]: { label: string; key: string }[] } = {
    wikipedia_search: [],
    youtube_search: [{ label: "YouTube API Key", key: "YOUTUBE_API_KEY" }],
    google_search: [{ label: "Google Search API Key", key: "GOOGLE_SEARCH_API_KEY" }],
    tavily_search: [{ label: "Tavily API Key", key: "TAVILY_API_KEY" }],
    duckduckgo_search: [],
    perplexity_search: [{ label: "Perplexity API Key", key: "PERPLEXITY_API_KEY" }],
    searxng_search: [],
};
export const PREDEFINED_TOOL_REQUIRED_KWARGS: { [key: string]: { label: string; key: string }[] } = {
    wikipedia_search: [],
    youtube_search: [],
    google_search: [{ label: "Google Search Engine ID", key: "google_search_engine_id" }],
    tavily_search: [],
    duckduckgo_search: [],
    perplexity_search: [],
    searxng_search: [],
};
