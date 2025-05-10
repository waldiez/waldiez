/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData } from "@waldiez/models";
import { useWaldiezTheme } from "@waldiez/theme";

export const useWaldiezAgentTermination = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { data, onDataChange } = props;
    const { isDark } = useWaldiezTheme();
    const [localData, setLocalData] = useState<WaldiezNodeAgentData>(data);
    const onTerminationTypeChange = (
        option: SingleValue<{
            label: string;
            value: "none" | "keyword" | "method";
        }>,
    ) => {
        if (option) {
            setLocalData({
                ...localData,
                termination: {
                    ...localData.termination,
                    type: option.value,
                },
            });
            onDataChange({
                termination: {
                    ...data.termination,
                    type: option.value,
                },
            });
        }
    };
    const onTerminationMethodChange = (content?: string) => {
        if (content) {
            setLocalData({
                ...localData,
                termination: {
                    ...localData.termination,
                    methodContent: content,
                },
            });
            onDataChange({
                termination: {
                    ...data.termination,
                    methodContent: content,
                },
            });
        }
    };
    const onTerminationCriterionChange = (
        option: SingleValue<{
            label: string;
            value: "found" | "ending" | "starting" | "exact";
        }>,
    ) => {
        if (option) {
            setLocalData({
                ...localData,
                termination: {
                    ...localData.termination,
                    criterion: option.value,
                },
            });
            onDataChange({
                termination: {
                    ...data.termination,
                    criterion: option.value,
                },
            });
        }
    };
    const onAddTerminationKeyword = (keyword: string) => {
        setLocalData({
            ...localData,
            termination: {
                ...localData.termination,
                keywords: [...localData.termination.keywords, keyword],
            },
        });
        onDataChange({
            termination: {
                ...data.termination,
                keywords: [...data.termination.keywords, keyword],
            },
        });
    };
    const onDeleteTerminationKeyword = (keyword: string) => {
        setLocalData({
            ...localData,
            termination: {
                ...localData.termination,
                keywords: localData.termination.keywords.filter(k => k !== keyword),
            },
        });
        onDataChange({
            termination: {
                ...data.termination,
                keywords: data.termination.keywords.filter(k => k !== keyword),
            },
        });
    };
    const onTerminationKeywordChange = (oldKeyword: string, newKeyword: string) => {
        setLocalData({
            ...localData,
            termination: {
                ...localData.termination,
                keywords: localData.termination.keywords.map(keyword =>
                    keyword === oldKeyword ? newKeyword : keyword,
                ),
            },
        });
        onDataChange({
            termination: {
                ...data.termination,
                keywords: data.termination.keywords.map(keyword =>
                    keyword === oldKeyword ? newKeyword : keyword,
                ),
            },
        });
    };
    const defaultTerminationMethodContent =
        data.termination.methodContent && data.termination.methodContent.length > 1
            ? data.termination.methodContent
            : DEFAULT_IS_TERMINATION_MESSAGE_METHOD_CONTENT;
    return {
        data: localData,
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

const terminationCriterionOptions: {
    label: string;
    value: "found" | "ending" | "starting" | "exact";
}[] = [
    { label: "Keyword is found", value: "found" },
    {
        label: "Keyword is the last word",
        value: "ending",
    },
    { label: "Keyword is the first word", value: "starting" },
    { label: "Exact match", value: "exact" },
];

const terminationTypeOptions: {
    label: string;
    value: "none" | "keyword" | "method";
}[] = [
    { label: "None", value: "none" },
    { label: "Keyword", value: "keyword" },
    { label: "Method", value: "method" },
];

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
