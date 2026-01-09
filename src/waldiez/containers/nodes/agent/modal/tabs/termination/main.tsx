/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { CodeEditor, Select, StringList } from "@waldiez/components";
import { useWaldiezAgentTermination } from "@waldiez/containers/nodes/agent/modal/tabs/termination/hooks";
import type { WaldiezNodeAgentData } from "@waldiez/models/types";

type WaldiezAgentTerminationProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for configuring agent termination conditions
 * Handles termination types, criteria, keywords, and custom method implementation
 */
export const WaldiezAgentTermination = memo((props: WaldiezAgentTerminationProps) => {
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

    /**
     * Current selected termination type value
     */
    const terminationTypeValue = useMemo(
        () => ({
            label:
                terminationTypeOptions.find(option => option.value === data.termination.type)?.label ??
                "None",
            value: data.termination?.type ?? "none",
        }),
        [data.termination.type, terminationTypeOptions],
    );

    /**
     * Current selected termination criterion value
     */
    const terminationCriterionValue = useMemo(() => {
        const entry = terminationCriterionOptions.find(option => option.value === data.termination.criterion);
        if (!entry) {
            return undefined;
        }
        return {
            label: entry.label,
            value: entry.value,
        };
    }, [data.termination.criterion, terminationCriterionOptions]);

    /**
     * Flag to show method editor
     */
    const showMethodEditor = data.termination && data.termination.type === "method";

    /**
     * Flag to show keyword settings
     */
    const showKeywordSettings = data.termination && data.termination.type === "keyword";

    return (
        <div className="agent-panel agent-termination-panel">
            {/* Termination Condition Header */}
            <div className="info">
                After receiving each message, the agent will send a reply to the sender unless the termination
                condition is met. A termination condition can be a keyword or a custom method.
            </div>
            {/* Termination Type Selector */}
            <label htmlFor={`termination-type-${id}`}>Termination Type:</label>
            <div className="margin-top-10" />
            <Select
                options={terminationTypeOptions}
                value={terminationTypeValue}
                onChange={onTerminationTypeChange}
                inputId={`termination-type-${id}`}
                aria-label="Select termination type"
            />

            {/* Method Editor (shown when type is 'method') */}
            {showMethodEditor && (
                <>
                    <label htmlFor={`termination-method-editor-${id}`}>Termination Method:</label>
                    <div className="margin-top-10" />
                    <CodeEditor
                        data-testid={`termination-method-editor-${id}`}
                        darkMode={isDarkMode}
                        value={defaultTerminationMethodContent}
                        onChange={onTerminationMethodChange}
                        aria-label="Edit termination method code"
                    />
                </>
            )}

            {/* Keyword Settings (shown when type is 'keyword') */}
            {showKeywordSettings && (
                <div className="margin-top-10">
                    <label htmlFor={`termination-criterion-${id}`}>Termination Criterion:</label>
                    <div className="margin-top-10" />
                    <Select
                        options={terminationCriterionOptions}
                        value={terminationCriterionValue}
                        onChange={onTerminationCriterionChange}
                        inputId={`termination-criterion-${id}`}
                        aria-label="Select termination criterion"
                    />

                    <StringList
                        viewLabel="Termination Keywords:"
                        viewLabelInfo="List of keywords to check for termination."
                        items={data.termination?.keywords ?? []}
                        itemsType="termination-keyword"
                        onItemAdded={onAddTerminationKeyword}
                        onItemDeleted={onDeleteTerminationKeyword}
                        onItemChange={onTerminationKeywordChange}
                        aria-label="Termination keywords list"
                    />
                </div>
            )}
        </div>
    );
});

WaldiezAgentTermination.displayName = "WaldiezAgentTermination";
