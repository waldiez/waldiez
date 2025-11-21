/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent, type FC, useCallback, useMemo } from "react";

import type { SingleValue } from "@waldiez/components";
import { CodeEditor, InfoLabel, Select, TextareaInput } from "@waldiez/components";
import {
    DEFAULT_CUSTOM_SUMMARY_CONTENT,
    type WaldiezChatLlmSummaryMethod,
    type WaldiezEdgeData,
} from "@waldiez/models";

const SUMMARY_METHOD_MAPPING = {
    reflectionWithLlm: "Reflection with LLM",
    lastMsg: "Last Message",
    none: "None",
    custom: "Custom function",
};

const SUMMARY_ROLE_OPTIONS = [
    { label: "System", value: "system" },
    { label: "User", value: "user" },
    { label: "Assistant", value: "assistant" },
];

const SUMMARY_OPTIONS: { label: string; value: WaldiezChatLlmSummaryMethod }[] = [
    { label: "None", value: null },
    { label: "Reflection with LLM", value: "reflectionWithLlm" },
    { label: "Last Message", value: "lastMsg" },
    { label: "Custom function", value: "custom" },
];

type WaldiezEdgeSummaryTabProps = {
    edgeId: string;
    data: WaldiezEdgeData;
    darkMode: boolean;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};

export const WaldiezEdgeSummaryTab: FC<WaldiezEdgeSummaryTabProps> = props => {
    const { edgeId, data, darkMode, onDataChange } = props;
    // Memoized derived values
    const summaryMethodLabel = useMemo(
        () => SUMMARY_METHOD_MAPPING[data.summary?.method ?? "none"],
        [data.summary?.method],
    );

    const summaryRoleValue = useMemo(
        () => data.summary?.args?.summary_role ?? "system",
        [data.summary?.args?.summary_role],
    );

    const onMethodContentUpdate = useCallback(
        (value?: string) => {
            if (!value) {
                return;
            }
            onDataChange({
                summary: {
                    method: "custom",
                    prompt: "",
                    args: {
                        ...data.summary.args,
                    },
                    content: value,
                },
            });
        },
        [onDataChange, data.summary.args],
    );

    const getEdgeSummaryLabel = useCallback(() => {
        const args = data.summary?.args || {};

        if ("summary_role" in args && ["system", "user", "assistant"].includes(args.summary_role)) {
            const role = args.summary_role;
            return role[0].toUpperCase() + role.slice(1);
        }

        return "System";
    }, [data.summary?.args]);
    const summaryRoleLabel = useMemo(() => getEdgeSummaryLabel(), [getEdgeSummaryLabel]);

    const onLlmPromptChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({
                summary: {
                    method: data.summary.method,
                    prompt: e.target.value,
                    args: {
                        ...data.summary.args,
                    },
                    content: "",
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
                    content: "",
                },
            });
        },
        [onDataChange, data.summary.method, data.summary.prompt, data.summary.args],
    );

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
                    content: option.value !== "custom" ? "" : DEFAULT_CUSTOM_SUMMARY_CONTENT,
                },
            });
        },
        [onDataChange, data.summary.prompt, data.summary.args],
    );
    return (
        <div className="flex flex-col">
            <div className="margin-top-10">
                <InfoLabel
                    htmlFor={`select-summary-method-${edgeId}`}
                    label="Summary Method:"
                    // info="The method to be used to summarize the conversation."
                    info={() => (
                        <div>
                            The method to be used to summarize the conversation. <br />
                            Possible values are: <br />
                            <ul>
                                <li>
                                    <b>Reflection with LLM:</b> the summary is generated by reflecting on the
                                    conversation and using the Language Model (LLM) to generate the summary.
                                </li>
                                <li>
                                    <b>Last Message:</b> the last message of the conversation is used as the
                                    summary.
                                </li>
                                <li>
                                    <b>None:</b> no summary is generated.
                                </li>
                            </ul>
                        </div>
                    )}
                />
                <div className="margin-bottom-5" />
                <Select
                    options={SUMMARY_OPTIONS}
                    value={{
                        label: summaryMethodLabel,
                        value: data.summary.method,
                    }}
                    onChange={onSummaryMethodChange}
                    inputId={`select-summary-method-${edgeId}`}
                />
                {data.summary.method === "reflectionWithLlm" && (
                    <>
                        <InfoLabel
                            htmlFor={`edge-${edgeId}-llm-prompt-input`}
                            label="Summary Prompt:"
                            info="The prompt to be used for the summary generation."
                        />
                        <TextareaInput
                            placeholder="Enter the summary prompt"
                            rows={2}
                            value={data.summary.prompt}
                            onChange={onLlmPromptChange}
                            data-testid={`edge-${edgeId}-llm-prompt-input`}
                        />
                        <label htmlFor={`select-summary-role-${edgeId}`}>Summary Role:</label>
                        <Select
                            options={SUMMARY_ROLE_OPTIONS}
                            value={{
                                label: summaryRoleLabel,
                                value: summaryRoleValue,
                            }}
                            onChange={onLlmSummaryRoleChange}
                            inputId={`select-summary-role-${edgeId}`}
                        />
                    </>
                )}
                {data.summary.method === "custom" && (
                    <div className="margin-top-10">
                        <CodeEditor
                            value={data.summary.content ?? DEFAULT_CUSTOM_SUMMARY_CONTENT}
                            onChange={onMethodContentUpdate}
                            darkMode={darkMode}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
