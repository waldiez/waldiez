/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useMemo } from "react";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezEdgeBasicTabProps } from "@waldiez/containers/edges/modal/tabs/basic/types";
import type { WaldiezChatLlmSummaryMethod, WaldiezEdgeType } from "@waldiez/models/types";

// Constants moved outside of the component for better performance
const SUMMARY_ROLE_OPTIONS = [
    { label: "System", value: "system" },
    { label: "User", value: "user" },
    { label: "Assistant", value: "assistant" },
];

const SUMMARY_OPTIONS: { label: string; value: WaldiezChatLlmSummaryMethod }[] = [
    { label: "None", value: null },
    { label: "Reflection with LLM", value: "reflectionWithLlm" },
    { label: "Last Message", value: "lastMsg" },
];

const EDGE_TYPE_OPTIONS: { label: string; value: WaldiezEdgeType }[] = [
    { label: "Chat", value: "chat" },
    { label: "Nested Chat", value: "nested" },
];

const SUMMARY_METHOD_MAPPING = {
    reflectionWithLlm: "Reflection with LLM",
    lastMsg: "Last Message",
    none: "None",
};

/**
 * Custom hook for managing the basic tab of the edge modal
 */
export const useWaldiezEdgeBasicTab = (props: WaldiezEdgeBasicTabProps) => {
    const { data, edgeType, onDataChange } = props;

    /**
     * Update the edge description
     */
    const onDescriptionChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({ description: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Update the edge label
     */
    const onLabelChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ label: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Toggle the clear history option
     */
    const onClearHistoryChange = useCallback(
        (checked: boolean) => {
            if (data.clearHistory === checked) {
                return; // No change, do nothing
            }
            // Ensure that the onDataChange function is defined and available
            if (typeof onDataChange !== "function") {
                return; // Exit if onDataChange is not a function
            }
            onDataChange({ clearHistory: checked });
        },
        [onDataChange, data.clearHistory],
    );
    /**
     * Update the maximum number of turns
     */
    const onMaxTurnsChange = useCallback(
        (value: number | null) => {
            onDataChange({ maxTurns: value });
        },
        [onDataChange],
    );

    /**
     * Update the summary method
     */
    const onSummaryMethodChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: WaldiezChatLlmSummaryMethod;
            }>,
        ) => {
            if (!option) {
                return;
            }

            onDataChange({
                summary: {
                    method: option.value,
                    prompt: data.summary.prompt,
                    args: data.summary.args,
                },
            });
        },
        [onDataChange, data.summary.prompt, data.summary.args],
    );

    /**
     * Update the LLM prompt for summary
     */
    const onLlmPromptChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({
                summary: {
                    method: data.summary.method,
                    prompt: e.target.value,
                    args: {
                        ...data.summary.args,
                    },
                },
            });
        },
        [onDataChange, data.summary.method, data.summary.args],
    );

    /**
     * Update the summary role
     */
    const onLlmSummaryRoleChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: string;
            }>,
        ) => {
            if (!option) {
                return;
            }

            onDataChange({
                summary: {
                    method: data.summary.method,
                    prompt: data.summary.prompt,
                    args: {
                        ...data.summary.args,
                        summary_role: option.value,
                    },
                },
            });
        },
        [onDataChange, data.summary.method, data.summary.prompt, data.summary.args],
    );

    /**
     * Get the formatted summary role label
     */
    const getEdgeSummaryLabel = useCallback(() => {
        const args = data.summary?.args || {};

        if ("summary_role" in args && ["system", "user", "assistant"].includes(args.summary_role)) {
            const role = args.summary_role;
            return role[0].toUpperCase() + role.slice(1);
        }

        return "System";
    }, [data.summary?.args]);

    // Memoized derived values
    const summaryMethodLabel = useMemo(
        () => SUMMARY_METHOD_MAPPING[data.summary?.method ?? "none"],
        [data.summary?.method],
    );

    const summaryRoleValue = useMemo(
        () => data.summary?.args?.summary_role ?? "system",
        [data.summary?.args?.summary_role],
    );

    const summaryRoleLabel = useMemo(() => getEdgeSummaryLabel(), [getEdgeSummaryLabel]);

    const currentSelectedChatType = useMemo(() => {
        const chatTypeLabel = EDGE_TYPE_OPTIONS.find(option => option.value === edgeType)?.label || "Chat";

        return {
            label: chatTypeLabel,
            value: edgeType as WaldiezEdgeType,
        };
    }, [edgeType]);

    return {
        summaryRoleOptions: SUMMARY_ROLE_OPTIONS,
        summaryOptions: SUMMARY_OPTIONS,
        edgeTypeOptions: EDGE_TYPE_OPTIONS,
        summaryMethodLabel,
        summaryRoleValue,
        summaryRoleLabel,
        currentSelectedChatType,
        onLabelChange,
        onDescriptionChange,
        onClearHistoryChange,
        onMaxTurnsChange,
        onSummaryMethodChange,
        onLlmPromptChange,
        onLlmSummaryRoleChange,
    };
};
