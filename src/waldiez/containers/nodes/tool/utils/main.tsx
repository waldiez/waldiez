/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";
import { FaCode, FaRegFileCode } from "react-icons/fa6";

import { TOOL_ICONS } from "@waldiez/theme/icons";

const ICON_SIZE = 14;

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
    duckduckgo_search: undefined,
    perplexity_search: (
        <div className="info">
            <p>To use the Perplexity Search tool, you need to set up a Perplexity API key.</p>
            <p>Follow these steps:</p>
            <ol>
                <li>
                    Visit{" "}
                    <a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer">
                        Perplexity AI
                    </a>
                    .
                </li>
                <li>
                    Click <strong>Sign Up</strong> and create an account.
                </li>
                <li>
                    Navigate to{" "}
                    <a
                        href="https://www.perplexity.ai/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Perplexity API
                    </a>
                    .
                </li>
                <li>
                    Generate an API key under <strong>API Keys</strong>.
                </li>
            </ol>
        </div>
    ),
    searxng_search: undefined,
    shared: undefined,
    custom: undefined,
};

export const getToolIcon = (
    toolLabel: string,
    toolType: string,
    size: number = ICON_SIZE,
): React.JSX.Element => {
    const defaultIcon = <FaCode aria-hidden="true" size={size} style={{ width: size, height: size }} />;
    if (toolType === "custom") {
        return defaultIcon;
    }
    if (toolType === "shared") {
        return <FaRegFileCode aria-hidden="true" size={size} style={{ width: size, height: size }} />;
    }
    switch (toolLabel) {
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
        case "duckduckgo_search":
            return (
                <img
                    src={TOOL_ICONS.duckduckgo_search}
                    alt="DuckDuckGo Search Icon"
                    style={{ width: size, height: size }}
                />
            );
        case "perplexity_search":
            return (
                <img
                    src={TOOL_ICONS.perplexity_search}
                    alt="Perplexity Search Icon"
                    style={{ width: size, height: size }}
                    className="perplexity-icon"
                />
            );
        case "searxng_search":
            return (
                <img
                    src={TOOL_ICONS.searxng_search}
                    alt="SearxNG Search Icon"
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
        icon: <FaRegFileCode size={18} style={{ marginLeft: 2, width: 16, height: 16 }} />,
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
        value: "duckduckgo_search",
        label: "DuckDuckGo Search",
        icon: (
            <img
                src={TOOL_ICONS.duckduckgo_search}
                alt="DuckDuckGo Search Icon"
                style={{ width: 20, height: 20 }}
            />
        ),
    },
    {
        value: "perplexity_search",
        label: "Perplexity AI Search",
        icon: (
            <img
                src={TOOL_ICONS.perplexity_search}
                alt="Perplexity AI Search Icon"
                style={{ width: 20, height: 20 }}
                className="perplexity-icon"
            />
        ),
    },
    {
        value: "searxng_search",
        label: "SearxNG Search",
        icon: (
            <img
                src={TOOL_ICONS.searxng_search}
                alt="SearxNG Search Icon"
                style={{ width: 20, height: 20 }}
            />
        ),
    },
    {
        value: "custom",
        label: "Custom Tool",
        icon: <FaCode size={18} style={{ marginLeft: 2, width: 16, height: 16 }} />,
    },
];
