/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Editor, InfoLabel, Select, StringList } from "@waldiez/components";
import { useWaldiezAgentTermination } from "@waldiez/containers/nodes/agent/modal/tabs/termination/hooks";
import { WaldiezAgentTerminationProps } from "@waldiez/containers/nodes/agent/modal/tabs/termination/types";

export const WaldiezAgentTermination = (props: WaldiezAgentTerminationProps) => {
    const { id } = props;
    const {
        data,
        isDarkMode,
        terminationCriterionOptions,
        terminationTypeOptions,
        defaultTerminationMethodContent,
        onTerminationTypeChange,
        onTerminationMethodChange,
        onTerminationCriterionChange,
        onAddTerminationKeyword,
        onDeleteTerminationKeyword,
        onTerminationKeywordChange,
    } = useWaldiezAgentTermination(props);
    return (
        <div className="agent-panel agent-termination-panel margin-bottom-10 margin-top--10">
            <InfoLabel
                label="Termination condition:"
                info="After receiving each message, the agent will send a reply to the sender unless the termination condition is met. A termination condition can be a keyword or a custom method."
            />
            <label className="hidden" htmlFor={`termination-type-${id}`}>
                Termination Type:
            </label>
            <Select
                options={terminationTypeOptions}
                value={{
                    label:
                        terminationTypeOptions.find(option => option.value === data.termination.type)
                            ?.label ?? "None",
                    value: data.termination?.type ?? "none",
                }}
                onChange={onTerminationTypeChange}
                inputId={`termination-type-${id}`}
            />
            {data.termination && data.termination.type === "method" && (
                <>
                    <label>Termination Method:</label>
                    <Editor
                        darkMode={isDarkMode}
                        value={defaultTerminationMethodContent}
                        onChange={onTerminationMethodChange}
                    />
                </>
            )}
            {data.termination && data.termination.type === "keyword" && (
                <div className="margin-top-10">
                    <label htmlFor={`termination-criterion-${id}`}>Termination Criterion:</label>
                    <Select
                        options={terminationCriterionOptions}
                        value={{
                            label:
                                terminationCriterionOptions.find(
                                    option => option.value === data.termination?.criterion,
                                )?.label ?? "Keyword is found",
                            value: data.termination.criterion ?? "found",
                        }}
                        onChange={onTerminationCriterionChange}
                        inputId={`termination-criterion-${id}`}
                    />
                    <StringList
                        viewLabel="Termination Keywords:"
                        viewLabelInfo="List of keywords to check for termination."
                        items={data.termination?.keywords ?? []}
                        itemsType="termination-keyword"
                        onItemAdded={onAddTerminationKeyword}
                        onItemDeleted={onDeleteTerminationKeyword}
                        onItemChange={onTerminationKeywordChange}
                    />
                </div>
            )}
        </div>
    );
};
