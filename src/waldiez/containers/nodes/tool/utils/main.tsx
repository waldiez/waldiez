/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaCode } from "react-icons/fa6";

import { TOOL_ICONS } from "@waldiez/theme/icons";

const ICON_SIZE = 14;

export const PREDEFINED_TOOL_TYPES = ["wikipedia_search", "youtube_search", "google_search", "tavily_search"];
export const PREDEFINED_TOOL_REQUIRED_ENVS: { [key: string]: { label: string; key: string }[] } = {
    wikipedia_search: [],
    youtube_search: [{ label: "YouTube API Key", key: "YOUTUBE_API_KEY" }],
    google_search: [{ label: "Google Search API Key", key: "GOOGLE_SEARCH_API_KEY" }],
    tavily_search: [{ label: "Tavily API Key", key: "TAVILY_API_KEY" }],
};
export const PREDEFINED_TOOL_REQUIRED_KWARGS: { [key: string]: { label: string; key: string }[] } = {
    wikipedia_search: [],
    youtube_search: [],
    google_search: [{ label: "Google Search Engine ID", key: "google_search_engine_id" }],
    tavily_search: [],
};
export const DEFAULT_NAME: { [key: string]: string } = {
    wikipedia_search: "Wikipedia Search",
    youtube_search: "YouTube Search",
    google_search: "Google Search",
    tavily_search: "Tavily Search",
    shared: "waldiez_shared",
    custom: "tool_name",
};

export const PREDEFINED_TOOL_INSTRUCTIONS: { [key: string]: React.ReactNode | undefined } = {
    wikipedia_search: undefined,
    youtube_search: (
        <div className="info">
            <p>To use the YouTube Search tool, you need to set up a YouTube Data API key.</p>
            <p> Follow these steps:</p>
            <ol>
                <li>
                    Go to the{" "}
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                        Google Cloud Console
                    </a>
                    .
                </li>
                <li>Create a new project or select an existing one.</li>
                <li>
                    Navigate to <strong>APIs & Services &gt; Library</strong>.
                </li>
                <li>
                    Search for <strong>YouTube Data API v3</strong> and enable it.
                </li>
                <li>
                    Go to <strong>APIs & Services &gt; Credentials</strong>.
                </li>
                <li>
                    Click on <strong>Create Credentials &gt; API key</strong> and copy your API key.
                </li>
            </ol>
        </div>
    ),
    google_search: (
        <div className="info">
            <p>
                To use the Google Search tool, you need to set up a Google Custom Search Engine (CSE) and
                obtain an API key.
            </p>
            <p>Follow these steps:</p>
            <ol>
                <li>
                    Go to{" "}
                    <a
                        href="https://programmablesearchengine.google.com/about/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google Programmable Search Engine
                    </a>
                    .
                </li>
                <li>
                    Click <strong>Get Started</strong> and create a search engine.
                </li>
                <li>
                    Under <strong>Sites to Search</strong>, select <strong>Search the entire web</strong> if
                    you want global search.
                </li>
                <li>
                    Copy the <strong>Search Engine ID</strong> from the CSE dashboard (the `cx` parameter from
                    the URL).
                </li>
                <li>
                    Go to the{" "}
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                        Google Cloud Console
                    </a>
                    .
                </li>
                <li>Create a new project.</li>
                <li>
                    Navigate to <strong>APIs & Services &gt; Library</strong>, search for{" "}
                    <strong>Custom Search API</strong>, and enable it.
                </li>
                <li>
                    Go to <strong>APIs & Services &gt; Credentials</strong>, click on{" "}
                    <strong>Create Credentials &gt; API key</strong>, and copy your API key.
                </li>
            </ol>
        </div>
    ),
    tavily_search: (
        <div className="info">
            <p>To use the Tavily Search tool, you need to set up a Tavily API key.</p>
            <p>Follow these steps:</p>
            <ol>
                <li>
                    Visit{" "}
                    <a href="https://tavily.com/" target="_blank" rel="noopener noreferrer">
                        Tavily AI
                    </a>
                    .
                </li>
                <li>
                    Click <strong>Sign Up</strong> and create an account.
                </li>
                <li>
                    Navigate to{" "}
                    <a href="https://app.tavily.com/" target="_blank" rel="noopener noreferrer">
                        Tavily API
                    </a>
                    .
                </li>
                <li>
                    Generate an API key under <strong>API Keys</strong>.
                </li>
            </ol>
        </div>
    ),
    shared: undefined,
    custom: undefined,
};

export const DEFAULT_DESCRIPTION: { [key: string]: string } = {
    wikipedia_search: "Search Wikipedia for a given query.",
    youtube_search: "Search YouTube for a given query.",
    google_search: "Search Google for a given query.",
    tavily_search: "Search Tavily for a given query.",
    shared: "Shared code available to all agents.",
    custom: "A custom tool that you define.",
};

export const getToolIcon = (toolType: string, size: number = ICON_SIZE): React.JSX.Element => {
    switch (toolType) {
        case "wikipedia_search":
            return (
                <img
                    src={TOOL_ICONS.wikipedia_search}
                    alt="Wikipedia Search Icon"
                    style={{ width: size, height: size }}
                />
            );
        case "youtube_search":
            return (
                <img
                    src={TOOL_ICONS.youtube_search}
                    alt="YouTube Search Icon"
                    style={{ width: size, height: size }}
                />
            );
        case "google_search":
            return (
                <img
                    src={TOOL_ICONS.google_search}
                    alt="Google Search Icon"
                    style={{ width: size, height: size }}
                />
            );
        case "tavily_search":
            return (
                <img
                    src={TOOL_ICONS.tavily_search}
                    alt="Tavily Search Icon"
                    style={{ width: size, height: size }}
                />
            );
        default:
            return <FaCode aria-hidden="true" size={size} style={{ width: size, height: size }} />;
    }
};

export const TOOL_TYPE_OPTIONS: { value: string; label: string; icon?: React.JSX.Element }[] = [
    {
        value: "shared",
        label: "Shared Code",
        icon: <FaCode size={20} style={{ width: 20, height: 20 }} />,
    },
    {
        value: "wikipedia_search",
        label: "Wikipedia Search",
        icon: (
            <img
                src={TOOL_ICONS.wikipedia_search}
                alt="Wikipedia Search Icon"
                style={{ width: 20, height: 20 }}
            />
        ),
    },
    {
        value: "youtube_search",
        label: "YouTube Search",
        icon: (
            <img
                src={TOOL_ICONS.youtube_search}
                alt="YouTube Search Icon"
                style={{ width: 20, height: 20 }}
            />
        ),
    },
    {
        value: "tavily_search",
        label: "Tavily Search",
        icon: (
            <img src={TOOL_ICONS.tavily_search} alt="Tavily Search Icon" style={{ width: 20, height: 20 }} />
        ),
    },
    {
        value: "google_search",
        label: "Google Search",
        icon: (
            <img src={TOOL_ICONS.google_search} alt="Google Search Icon" style={{ width: 20, height: 20 }} />
        ),
    },
    {
        value: "custom",
        label: "Custom Tool",
        icon: <FaCode size={20} style={{ width: 20, height: 20 }} />,
    },
];
