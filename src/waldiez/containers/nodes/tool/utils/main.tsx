/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaCode, FaGoogle, FaWikipediaW, FaYoutube } from "react-icons/fa6";

export const PREDEFINED_TOOL_TYPES = ["wikipedia_search", "youtube_search", "google_search"];
export const DEFAULT_NAME: { [key: string]: string } = {
    wikipedia_search: "Wikipedia Search",
    youtube_search: "YouTube Search",
    google_search: "Google Search",
    shared: "waldiez_shared",
    custom: "tool_name",
};
export const DEFAULT_DESCRIPTION: { [key: string]: string } = {
    wikipedia_search: "Search Wikipedia for a given query.",
    youtube_search: "Search YouTube for a given query.",
    google_search: "Search Google for a given query.",
    shared: "Shared code available to all agents.",
    custom: "A custom tool that you define.",
};
export const getToolIcon = (toolType: string): React.JSX.Element => {
    switch (toolType) {
        case "wikipedia_search":
            return <FaWikipediaW aria-hidden="true" />;
        case "youtube_search":
            return <FaYoutube aria-hidden="true" />;
        case "google_search":
            return <FaGoogle aria-hidden="true" />;
        default:
            return <FaCode aria-hidden="true" />;
    }
};
export const TOOL_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "shared", label: "Shared Code" },
    { value: "wikipedia_search", label: "Wikipedia Search" },
    { value: "youtube_search", label: "YouTube Search" },
    { value: "google_search", label: "Google Search" },
    { value: "custom", label: "Custom Tool" },
];
