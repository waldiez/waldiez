/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezNodeAgentData } from "@waldiez/models/types";
import { useWaldiezTheme } from "@waldiez/theme";

/**
 * Default content for the termination method editor
 */
const DEFAULT_IS_TERMINATION_MESSAGE_METHOD_CONTENT = `"""Custom termination message function."""
# provide the function to check if the message is a termination message
# complete the \`is_termination_message\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return True if the message is a termination message, False otherwise.
# example:
# def is_termination_message(message):
#    # type: (dict[str, any]) -> bool
#    return message.get("content", "").lower() == "terminate"
#
def is_termination_message(message):
    """Complete the termination message function"""
    ...
`;

/**
 * Options for termination criterion dropdown
 */
const terminationCriterionOptions = [
    { label: "Keyword is found", value: "found" as const },
    { label: "Keyword is the last word", value: "ending" as const },
    { label: "Keyword is the first word", value: "starting" as const },
    { label: "Exact match", value: "exact" as const },
];

/**
 * Options for termination type dropdown
 */
const terminationTypeOptions = [
    { label: "None", value: "none" as const },
    { label: "Keyword", value: "keyword" as const },
    { label: "Method", value: "method" as const },
];

/**
 * Custom hook for managing Waldiez Agent Termination functionality
 * Handles termination conditions, keywords, and custom method configuration
 */
export const useWaldiezAgentTermination = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { data, onDataChange } = props;

    // Get theme settings
    const { isDark } = useWaldiezTheme();

    /**
     * Get the default termination method content
     */
    const defaultTerminationMethodContent = useMemo(
        () =>
            data.termination.methodContent && data.termination.methodContent.length > 1
                ? data.termination.methodContent
                : DEFAULT_IS_TERMINATION_MESSAGE_METHOD_CONTENT,
        [data.termination.methodContent],
    );

    /**
     * Handle termination type change
     */
    const onTerminationTypeChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: "none" | "keyword" | "method";
            }>,
        ) => {
            if (!option) {
                return;
            }
            const type = option.value;
            onDataChange({
                termination: {
                    ...data.termination,
                    keywords: type === "keyword" ? data.termination.keywords : [],
                    methodContent: type === "method" ? defaultTerminationMethodContent : "",
                    criterion: type === "keyword" ? data.termination.criterion : "found",
                    type,
                },
            });
        },
        [data.termination, onDataChange, defaultTerminationMethodContent],
    );

    /**
     * Handle termination method content change
     */
    const onTerminationMethodChange = useCallback(
        (content?: string) => {
            if (!content) {
                return;
            }

            onDataChange({
                termination: {
                    ...data.termination,
                    methodContent: content,
                },
            });
        },
        [data.termination, onDataChange],
    );

    /**
     * Handle termination criterion change
     */
    const onTerminationCriterionChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: "found" | "ending" | "starting" | "exact";
            }>,
        ) => {
            if (!option) {
                return;
            }

            const criterion = option.value;

            onDataChange({
                termination: {
                    ...data.termination,
                    criterion,
                },
            });
        },
        [data.termination, onDataChange],
    );

    /**
     * Add a new termination keyword
     */
    const onAddTerminationKeyword = useCallback(
        (keyword: string) => {
            onDataChange({
                termination: {
                    ...data.termination,
                    keywords: [...data.termination.keywords, keyword],
                },
            });
        },
        [data.termination, onDataChange],
    );

    /**
     * Delete a termination keyword
     */
    const onDeleteTerminationKeyword = useCallback(
        (keyword: string) => {
            onDataChange({
                termination: {
                    ...data.termination,
                    keywords: data.termination.keywords.filter(k => k !== keyword),
                },
            });
        },
        [data.termination, onDataChange],
    );

    /**
     * Update an existing termination keyword
     */
    const onTerminationKeywordChange = useCallback(
        (oldKeyword: string, newKeyword: string) => {
            onDataChange({
                termination: {
                    ...data.termination,
                    keywords: data.termination.keywords.map(keyword =>
                        keyword === oldKeyword ? newKeyword : keyword,
                    ),
                },
            });
        },
        [data.termination, onDataChange],
    );

    return {
        data,
        terminationCriterionOptions,
        terminationTypeOptions,
        defaultTerminationMethodContent,
        isDarkMode: isDark,
        onTerminationTypeChange,
        onTerminationMethodChange,
        onTerminationCriterionChange,
        onAddTerminationKeyword,
        onDeleteTerminationKeyword,
        onTerminationKeywordChange,
    };
};
