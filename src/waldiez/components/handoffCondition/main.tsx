/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent, type FC, useCallback, useEffect, useMemo, useState } from "react";

import { ExpressionBuilder } from "@waldiez/components/expressionBuilder";
import { Select, type SingleValue } from "@waldiez/components/select";
import { TextareaInput } from "@waldiez/components/textareaInput";
import type { ConditionType, WaldiezHandoffCondition } from "@waldiez/types";

const conditionTypeMapping: Record<ConditionType, string> = {
    string_llm: "Static LLM prompt",
    string_context: "Variable check",
    context_str_llm: "Dynamic LLM Prompt",
    expression_context: "Expression check",
};

// Pre-define options outside component to avoid recreating on every render
const conditionTypeOptions: { value: ConditionType; label: string }[] = [
    { value: "string_llm", label: conditionTypeMapping.string_llm },
    { value: "context_str_llm", label: conditionTypeMapping.context_str_llm },
    { value: "string_context", label: conditionTypeMapping.string_context },
    { value: "expression_context", label: conditionTypeMapping.expression_context },
];

type ContextOption = { value: string; label: string };

export const HandoffCondition: FC<{
    condition: WaldiezHandoffCondition;
    contextVariables: string[];
    onDataChange: (condition: WaldiezHandoffCondition) => void;
}> = props => {
    const { condition, contextVariables, onDataChange } = props;

    const [currentHandoffCondition, setCurrentHandoffCondition] =
        useState<WaldiezHandoffCondition>(condition);

    // Sync with external condition changes
    useEffect(() => {
        setCurrentHandoffCondition(condition);
    }, [condition]);

    // Generic function to update condition fields
    const updateConditionField = useCallback(
        (field: string, value: string) => {
            setCurrentHandoffCondition(prev => {
                const updated = {
                    ...prev,
                    [field]: value,
                } as WaldiezHandoffCondition;
                onDataChange(updated);
                return updated;
            });
        },
        [onDataChange],
    );

    const onConditionTypeChange = useCallback(
        (selectedOption: SingleValue<{ value: ConditionType; label: string }>) => {
            if (!selectedOption) {
                return;
            }

            const selectedConditionType = selectedOption.value;
            const newCondition: WaldiezHandoffCondition = {
                conditionType: selectedConditionType,
            } as WaldiezHandoffCondition;

            setCurrentHandoffCondition(newCondition);
            onDataChange(newCondition);
        },
        [onDataChange],
    );

    // Handlers for specific fields
    const onStaticPromptChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            updateConditionField("prompt", e.target.value);
        },
        [updateConditionField],
    );

    const onDynamicPromptChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            updateConditionField("context_str", e.target.value);
        },
        [updateConditionField],
    );

    const contextVariableOptions = useMemo<ContextOption[]>(
        () => contextVariables.map(v => ({ value: v, label: v })),
        [contextVariables],
    );

    const selectedVariableOption = useMemo<SingleValue<ContextOption>>(() => {
        if (currentHandoffCondition.conditionType !== "string_context") {
            return null;
        }
        const variableName = currentHandoffCondition.variable_name;
        return variableName
            ? {
                  value: variableName,
                  label: variableName,
              }
            : null;
    }, [currentHandoffCondition]);

    const onVariableSelectChange = useCallback(
        (option: SingleValue<ContextOption>) => {
            const value = option?.value ?? "";
            updateConditionField("variable_name", value);
        },
        [updateConditionField],
    );

    // Memoized selected condition type option
    const selectedTypeOption = useMemo(
        () =>
            currentHandoffCondition.conditionType
                ? {
                      label: conditionTypeMapping[currentHandoffCondition.conditionType],
                      value: currentHandoffCondition.conditionType,
                  }
                : null,
        [currentHandoffCondition.conditionType],
    );

    // Helper function to render the appropriate input field based on condition type
    const renderConditionInput = useCallback(() => {
        const conditionType = currentHandoffCondition.conditionType;
        if (!conditionType) {
            return null;
        }

        switch (conditionType) {
            case "string_llm":
                return (
                    <div className="margin-top-10">
                        <label>LLM Prompt:</label>
                        <div className="margin-top-5" />
                        <TextareaInput
                            rows={2}
                            title="LLM Prompt"
                            placeholder="Enter the LLM prompt"
                            value={currentHandoffCondition.prompt || ""}
                            onChange={onStaticPromptChange}
                            data-testid="llm-prompt-input"
                        />
                    </div>
                );

            case "context_str_llm":
                return (
                    <div className="margin-top-10">
                        <label>Prompt:</label>
                        <TextareaInput
                            rows={2}
                            className="margin-top-5"
                            title="Prompt"
                            placeholder="Enter the prompt to evaluate"
                            value={currentHandoffCondition.context_str || ""}
                            onChange={onDynamicPromptChange}
                            data-testid="context-llm-prompt-input"
                        />
                    </div>
                );

            case "string_context":
                return (
                    <div className="margin-top-10">
                        <label htmlFor="variable-name-select">Variable Name:</label>
                        <div className="margin-top-5" />
                        {contextVariableOptions.length > 0 ? (
                            <Select
                                options={contextVariableOptions}
                                value={selectedVariableOption}
                                onChange={onVariableSelectChange}
                                className="flex-1"
                                isClearable
                                placeholder="Select a context variable"
                                inputId="variable-name-select"
                            />
                        ) : (
                            <div className="info">
                                No context variables defined yet. Create context variables first to use this
                                condition.
                            </div>
                        )}
                    </div>
                );

            case "expression_context":
                return (
                    <ExpressionBuilder
                        value={currentHandoffCondition.expression || ""}
                        onChange={expr => updateConditionField("expression", expr)}
                        contextVariables={contextVariables}
                        label="Expression"
                        placeholder="Enter an expression, e.g. ${orders} > 3"
                    />
                );

            default:
                return null;
        }
    }, [
        contextVariableOptions,
        contextVariables,
        currentHandoffCondition,
        onDynamicPromptChange,
        onStaticPromptChange,
        onVariableSelectChange,
        selectedVariableOption,
        updateConditionField,
    ]);

    return (
        <div className="flex flex-col">
            <div className="info margin-bottom-5">
                You can control when this transition happens. Conditions allow you to check values or evaluate
                logic based on the current context. There are four types of conditions you can choose from:
                <ul className="no-margin">
                    <li>
                        <strong>Static LLM prompt</strong>: A fixed message sent to a language model (LLM) to
                        decide whether the transition should happen.
                    </li>
                    <li>
                        <strong>Dynamic LLM prompt</strong>: A message that includes context variables, like
                        the user's name or order count. It's sent to the LLM for evaluation.
                        <br />
                        <em>Example:</em>
                        <ul>
                            <li>
                                <code>
                                    "User is {"{"}user_name{"}"} and has {"{"}num_orders{"}"} orders."
                                </code>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <strong>Variable check</strong>: Simply checks if a specific variable exists and is
                        truthy.
                    </li>
                    <li>
                        <strong>Expression check</strong>: Allows you to write a small logic expression using
                        context variables. You can use operators like <code>and</code>, <code>or</code>,{" "}
                        <code>not</code>, as well as comparison signs like <code>&gt;</code>, <code>==</code>,
                        etc.
                        <br />
                        <em>Examples:</em>
                        <ul>
                            <li>
                                <code>
                                    not ${"{"}logged_in{"}"} and ${"{"}is_admin{"}"} or ${"{"}
                                    guest_checkout{"}"}
                                </code>
                            </li>
                            <li>
                                <code>
                                    len(${"{"}orders{"}"}) &gt; 0 and ${"{"}user_active{"}"}
                                </code>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
            <div className="flex flex-col margin-top-10">
                <label className="hidden" htmlFor="select-condition-type">
                    Condition Type
                </label>
                <Select
                    options={conditionTypeOptions}
                    value={selectedTypeOption}
                    onChange={onConditionTypeChange}
                    inputId="select-condition-type"
                    className="flex-1 margin-right-10"
                    isClearable
                />
                {renderConditionInput()}
            </div>
        </div>
    );
};

HandoffCondition.displayName = "HandoffCondition";
