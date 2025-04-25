/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { SingleValue } from "@waldiez/components";
import { WaldiezEdgeBasicTabProps } from "@waldiez/containers/edges/modal/tabs/basic/types";
import { WaldiezChatLlmSummaryMethod, WaldiezEdgeType } from "@waldiez/models";

export const useWaldiezEdgeBasicTab = (props: WaldiezEdgeBasicTabProps) => {
    const { data, edgeType, onDataChange } = props;
    const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({ description: e.target.value });
    };
    const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: e.target.value });
    };
    const onClearHistoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ clearHistory: e.target.checked });
    };
    const onMaxTurnsChange = (value: number | null) => {
        onDataChange({ maxTurns: value });
    };
    const onSummaryMethodChange = (
        option: SingleValue<{
            label: string;
            value: WaldiezChatLlmSummaryMethod;
        }>,
    ) => {
        if (option) {
            onDataChange({
                summary: {
                    method: option.value,
                    prompt: data.summary.prompt,
                    args: data.summary.args,
                },
            });
        }
    };
    const onLlmPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const currentArgs = data.summary.args;
        onDataChange({
            summary: {
                method: data.summary.method,
                prompt: e.target.value,
                args: {
                    ...currentArgs,
                },
            },
        });
    };
    const onLlmSummaryRoleChange = (
        option: SingleValue<{
            label: string;
            value: string;
        }>,
    ) => {
        if (option) {
            const currentArgs = data.summary.args;
            onDataChange({
                summary: {
                    method: data.summary.method,
                    prompt: data.summary.prompt,
                    args: {
                        ...currentArgs,
                        summary_role: option.value,
                    },
                },
            });
        }
    };
    const getEdgeSummaryLabel = () => {
        const args = data.summary.args;
        if ("summary_role" in args && ["system", "user", "assistant"].includes(args.summary_role)) {
            const role = args.summary_role;
            return role[0].toUpperCase() + role.slice(1);
        }
        return "System";
    };
    const summaryMethodLabel = summaryMethodMapping[data.summary?.method ?? "none"];
    const summaryRoleValue = data.summary?.args?.summary_role ?? "system";
    const summaryRoleLabel = getEdgeSummaryLabel();
    const chatTypeLabel = edgeTypeOptions.find(option => option.value === edgeType)?.label as string;
    const currentSelectedChatType = {
        label: chatTypeLabel,
        value: edgeType as WaldiezEdgeType,
    };
    return {
        summaryRoleOptions,
        summaryOptions,
        edgeTypeOptions,
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
const summaryRoleOptions = [
    { label: "System", value: "system" },
    { label: "User", value: "user" },
    { label: "Assistant", value: "assistant" },
];
const summaryOptions: {
    label: string;
    value: WaldiezChatLlmSummaryMethod;
}[] = [
    { label: "None", value: null },
    { label: "Reflection with LLM", value: "reflection_with_llm" },
    { label: "Last Message", value: "last_msg" },
];
const edgeTypeOptions: {
    label: string;
    value: WaldiezEdgeType;
}[] = [
    { label: "Chat", value: "chat" },
    { label: "Nested Chat", value: "nested" },
];
const summaryMethodMapping = {
    reflection_with_llm: "Reflection with LLM",
    last_msg: "Last Message",
    none: "None",
};
