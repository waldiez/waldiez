/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { Select, SingleValue } from "@waldiez/components/select";
import { TextInput } from "@waldiez/components/textInput";
import { TextareaInput } from "@waldiez/components/textareaInput";
import { ConditionType, WaldiezHandoffCondition } from "@waldiez/types";

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

// Types for condition field updates
type ConditionFieldUpdater = {
    field: string;
    handler: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
};

export const HandoffCondition: React.FC<{
    condition: WaldiezHandoffCondition;
    onDataChange: (condition: WaldiezHandoffCondition) => void;
}> = props => {
    const { condition, onDataChange } = props;

    // State
    const [currentHandoffCondition, setCurrentHandoffCondition] =
        useState<WaldiezHandoffCondition>(condition);

    // Effect to sync with external condition changes
    useEffect(() => {
        setCurrentHandoffCondition(condition);
    }, [condition]);

    // Generic function to update condition fields
    const updateConditionField = useCallback(
        (field: string, value: string) => {
            if (!currentHandoffCondition) {
                return;
            }
            const updatedCondition = {
                ...currentHandoffCondition,
                [field]: value,
            } as WaldiezHandoffCondition;
            setCurrentHandoffCondition(updatedCondition);
            onDataChange(updatedCondition);
        },
        [currentHandoffCondition, onDataChange],
    );

    const onConditionTypeChange = useCallback(
        (selectedOption: SingleValue<{ value: ConditionType; label: string }>) => {
            if (selectedOption) {
                const selectedConditionType = selectedOption.value;
                const newCondition = {
                    conditionType: selectedConditionType,
                } as WaldiezHandoffCondition;

                setCurrentHandoffCondition(newCondition);
                onDataChange(newCondition);
            }
        },
        [onDataChange],
    );

    // Field updaters for each condition type
    const fieldUpdaters = useMemo<Record<ConditionType, ConditionFieldUpdater>>(
        () => ({
            string_llm: {
                field: "prompt",
                handler: e => updateConditionField("prompt", e.target.value),
            },
            context_str_llm: {
                field: "context_str",
                handler: e => updateConditionField("context_str", e.target.value),
            },
            string_context: {
                field: "variable_name",
                handler: e => updateConditionField("variable_name", e.target.value),
            },
            expression_context: {
                field: "expression",
                handler: e => updateConditionField("expression", e.target.value),
            },
        }),
        [updateConditionField],
    );

    // Memoized selected condition type option
    const selectedTypeOption = useMemo(
        () =>
            currentHandoffCondition?.conditionType
                ? {
                      label: conditionTypeMapping[currentHandoffCondition.conditionType],
                      value: currentHandoffCondition.conditionType,
                  }
                : null,
        [currentHandoffCondition?.conditionType],
    );

    // Helper function to render the appropriate input field based on condition type
    const renderConditionInput = useCallback(() => {
        if (!currentHandoffCondition?.conditionType) {
            return null;
        }

        const conditionType = currentHandoffCondition.conditionType;
        const updater = fieldUpdaters[conditionType];

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
                            onChange={updater.handler}
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
                            onChange={updater.handler}
                            data-testid="context-llm-prompt-input"
                        />
                    </div>
                );
            case "string_context":
                return (
                    <div className="margin-top-10">
                        <TextInput
                            name="variable-name"
                            label="Variable Name:"
                            className="margin-top-5"
                            placeholder="Enter the variable name to check"
                            value={currentHandoffCondition.variable_name || ""}
                            onChange={updater.handler}
                            dataTestId="variable-name-input"
                        />
                    </div>
                );
            case "expression_context":
                return (
                    <div className="margin-top-10">
                        <label>Expression:</label>
                        <TextareaInput
                            rows={2}
                            className="margin-top-5"
                            title="Expression"
                            placeholder="Enter the expression to evaluate"
                            value={currentHandoffCondition.expression || ""}
                            onChange={updater.handler}
                            data-testid="expression-input"
                        />
                    </div>
                );
            default:
                return null;
        }
    }, [currentHandoffCondition, fieldUpdaters]);

    return (
        <div className="flex-column">
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
                                    not ${"{"}logged_in{"}"} and ${"{"}is_admin{"}"} or ${"{"}guest_checkout
                                    {"}"}
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
            <div className="flex-column margin-top-10">
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
