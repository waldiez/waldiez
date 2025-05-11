/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { Select, SingleValue } from "@waldiez/components/select";
import { TextInput } from "@waldiez/components/textInput";
import { ConditionType, WaldiezHandoffCondition } from "@waldiez/types";

const conditionTypeMapping: Record<ConditionType, string> = {
    string_context: "Variable check",
    string_llm: "Static LLM prompt",
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

export const ChatAvailability: React.FC<{
    condition: WaldiezHandoffCondition | null;
    onDataChange: (data: WaldiezHandoffCondition | null) => void;
}> = props => {
    const { condition, onDataChange } = props;

    // State
    const [enabled, setEnabled] = useState<boolean>(!!condition);
    const [currentHandoffCondition, setCurrentHandoffCondition] = useState<WaldiezHandoffCondition | null>(
        condition,
    );

    // Effect to reset condition when disabled
    useEffect(() => {
        if (!enabled) {
            setCurrentHandoffCondition(null);
        }
    }, [enabled]);

    // Effect to sync with external condition changes
    useEffect(() => {
        if (condition) {
            setCurrentHandoffCondition(condition);
            setEnabled(true);
        } else {
            setEnabled(false);
        }
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

    // Event handlers
    const onHandoffConditionChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const isChecked = event.target.checked;
            setEnabled(isChecked);

            if (!isChecked) {
                setCurrentHandoffCondition(null);
                onDataChange(null);
            }
        },
        [onDataChange],
    );

    const onConditionTypeChange = useCallback(
        (selectedOption: SingleValue<{ value: ConditionType; label: string }>) => {
            if (selectedOption) {
                const selectedConditionType = selectedOption.value;
                const newCondition = {
                    condition_type: selectedConditionType,
                } as WaldiezHandoffCondition;

                setCurrentHandoffCondition(newCondition);
                onDataChange(newCondition);
            } else {
                setCurrentHandoffCondition(null);
                onDataChange(null);
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
            currentHandoffCondition?.condition_type
                ? {
                      label: conditionTypeMapping[currentHandoffCondition.condition_type],
                      value: currentHandoffCondition.condition_type,
                  }
                : null,
        [currentHandoffCondition?.condition_type],
    );

    // Helper function to render the appropriate input field based on condition type
    const renderConditionInput = useCallback(() => {
        if (!currentHandoffCondition?.condition_type) {
            return null;
        }

        const conditionType = currentHandoffCondition.condition_type;
        const updater = fieldUpdaters[conditionType];

        switch (conditionType) {
            case "string_llm":
                return (
                    <div className="margin-top-10">
                        <label>LLM Prompt:</label>
                        <div className="margin-top-5" />
                        <textarea
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
                        <textarea
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
                        <textarea
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
                You can enable a condition to control when this transition should be triggered. Conditions can
                be based on context variables or evaluated using a language model (LLM). Choose from the
                following types:
                <ul className="no-margin">
                    <li>
                        <strong>Static LLM prompt</strong>: A fixed prompt sent to the LLM for evaluation.
                    </li>
                    <li>
                        <strong>Dynamic LLM prompt</strong>: A context-aware prompt that includes variables,
                        and will be evaluated by the LLM. The prompt can be customized based on the current
                        context. <br />
                        <em>Example:</em> (assuming user_name and num_orders exist in the context variables){" "}
                        <br />
                        <ul>
                            <li>
                                <code>
                                    "User is {"{"}user_name{"}"} and has {"{"}num_orders{"}"} orders."
                                </code>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <strong>Variable check</strong>: Checks if a specific context variable exists and is
                        truthy.
                    </li>
                    <li>
                        <strong>Expression check</strong>: Evaluates a logical expression using context
                        variables. Expressions use{" "}
                        <code>
                            ${"{"}var_name{"}"}
                        </code>{" "}
                        syntax to reference variables, and support logical operators (<code>not</code>/
                        <code>!</code>, <code>and</code>/<code>&amp;</code>, <code>or</code>/<code>|</code>),
                        comparisons (<code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>,{" "}
                        <code>&lt;=</code>, <code>==</code>, <code>!=</code>), and functions like{" "}
                        <code>
                            len(${"{"}var_name{"}"})
                        </code>
                        . Parentheses can be used for grouping.
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
                                    len(${"{"}orders{"}"}) &gt; 0 &amp; ${"{"}user_active{"}"}
                                </code>
                            </li>
                            <li>
                                <code>
                                    len(${"{"}cart_items{"}"}) == 0 | ${"{"}checkout_started{"}"}
                                </code>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
            <div>
                <label className="checkbox-label">
                    <div className="checkbox-label-view">Enable Availability Check</div>
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={onHandoffConditionChange}
                        data-testid="availability-enabled-checkbox"
                    />
                    <div className="checkbox"></div>
                </label>
            </div>
            {enabled && (
                <div className="flex-column margin-top-10">
                    <label className="hidden" htmlFor="select-condition-type" />
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
            )}
        </div>
    );
};
