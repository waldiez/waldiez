/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
type PredefinedKwargType = "string" | "boolean";

export type PredefinedKwargConfig = {
    label: string;
    key: string;
    type?: PredefinedKwargType; // default to "string" if omitted
    multi?: boolean; // if true, use a textarea
    optional?: boolean; // if true, allow empty/not-set
    info?: string; // if set, add additional info icon/message
};

export const PREDEFINED_TOOL_TYPES = [
    "wikipedia_search",
    "youtube_search",
    "google_search",
    "tavily_search",
    "duckduckgo_search",
    "perplexity_search",
    "searxng_search",
    "waldiez_flow",
];

export const DEFAULT_PREDEFINED_TOOL_DESCRIPTION: { [key: string]: string } = {
    wikipedia_search: "Search Wikipedia for a given query.",
    youtube_search: "Search YouTube for a given query.",
    google_search: "Search Google for a given query.",
    tavily_search: "Search Tavily for a given query.",
    duckduckgo_search: "Search DuckDuckGo for a given query.",
    perplexity_search: "Search Perplexity AI for a given query.",
    searxng_search: "Search SearxNG for a given query.",
    waldiez_flow: "Run a waldiez flow as tool",
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
    waldiez_flow: "waldiez_flow",
    shared: "waldiez_shared",
    custom: "new_tool",
};

export const PREDEFINED_TOOL_REQUIRED_ENVS: { [key: string]: { label: string; key: string }[] } = {
    wikipedia_search: [],
    youtube_search: [{ label: "YouTube API Key", key: "YOUTUBE_API_KEY" }],
    google_search: [
        { label: "Google Search API Key", key: "GOOGLE_SEARCH_API_KEY" },
        { label: "Google Search Engine ID", key: "GOOGLE_SEARCH_ENGINE_ID" },
    ],
    tavily_search: [{ label: "Tavily API Key", key: "TAVILY_API_KEY" }],
    duckduckgo_search: [],
    perplexity_search: [{ label: "Perplexity API Key", key: "PERPLEXITY_API_KEY" }],
    searxng_search: [],
    waldiez_flow: [],
};
export const PREDEFINED_TOOL_REQUIRED_KWARGS: Record<string, PredefinedKwargConfig[]> = {
    wikipedia_search: [],
    youtube_search: [],
    google_search: [],
    tavily_search: [],
    duckduckgo_search: [],
    perplexity_search: [],
    searxng_search: [],
    waldiez_flow: [
        {
            label: "Flow path",
            key: "flow",
            type: "string",
            info: "Enter either the path (in the runner) of the flow, or the url to download it from.",
        },
        { label: "Tool name", key: "name", type: "string" },
        { label: "Tool description", key: "description", type: "string", multi: true },
        { label: "Initial message", key: "message", type: "string", multi: true, optional: true },
        {
            label: "Skip installing flow's dependencies",
            key: "skip_deps",
            type: "boolean",
        },
    ],
};
