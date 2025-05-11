/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { Select, SingleValue } from "@waldiez/components/select";
import { TextInput } from "@waldiez/components/textInput";
import { ConditionType, WaldiezEdgeData, WaldiezHandoffCondition } from "@waldiez/types";

const conditionTypeMapping: Record<ConditionType, string> = {
    string_context: "Variable check",
    string_llm: "Static LLM prompt",
    context_str_llm: "Dynamic LLM Prompt",
    expression_context: "Expression check",
};

export const ChatAvailability: React.FC<{
    data: WaldiezEdgeData;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
}> = props => {
    const { data, onDataChange } = props;
    const [enabled, setEnabled] = useState<boolean>(!!data.handoffCondition);
    const [currentHandoffCondition, setCurrentHandoffCondition] = useState<WaldiezHandoffCondition | null>(
        data.handoffCondition,
    );
    const onHandoffConditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setEnabled(isChecked);
        if (!isChecked) {
            onDataChange({ handoffCondition: undefined });
        }
    };
    const conditionTypeOptions: { value: ConditionType; label: string }[] = [
        { value: "string_llm", label: conditionTypeMapping.string_llm },
        { value: "context_str_llm", label: conditionTypeMapping.context_str_llm },
        { value: "string_context", label: conditionTypeMapping.string_context },
        { value: "expression_context", label: conditionTypeMapping.expression_context },
    ];
    const onConditionTypeChange = (selectedOption: SingleValue<{ value: ConditionType; label: string }>) => {
        if (selectedOption) {
            const selectedConditionType = selectedOption.value;
            setCurrentHandoffCondition({
                condition_type: selectedConditionType,
            } as WaldiezHandoffCondition);
        } else {
            setCurrentHandoffCondition(null);
            onDataChange({ handoffCondition: null });
        }
    };
    const onStringLLMPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentHandoffCondition?.condition_type === "string_llm") {
            const prompt = event.target.value;
            setCurrentHandoffCondition({
                ...currentHandoffCondition,
                prompt,
            });
            onDataChange({
                handoffCondition: {
                    ...currentHandoffCondition,
                    prompt,
                } as WaldiezHandoffCondition,
            });
        }
    };
    const onVariableNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (currentHandoffCondition?.condition_type === "string_context") {
            const variableName = event.target.value;
            setCurrentHandoffCondition({
                ...currentHandoffCondition,
                variable_name: variableName,
            });
            onDataChange({
                handoffCondition: {
                    ...currentHandoffCondition,
                    variable_name: variableName,
                } as WaldiezHandoffCondition,
            });
        }
    };
    const onExpressionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentHandoffCondition?.condition_type === "expression_context") {
            const expression = event.target.value;
            setCurrentHandoffCondition({
                ...currentHandoffCondition,
                expression,
            });
            onDataChange({
                handoffCondition: {
                    ...currentHandoffCondition,
                    expression,
                } as WaldiezHandoffCondition,
            });
        }
    };
    const onContextStrLLMPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentHandoffCondition?.condition_type === "context_str_llm") {
            const contextStr = event.target.value;
            setCurrentHandoffCondition({
                ...currentHandoffCondition,
                context_str: contextStr,
            });
            onDataChange({
                handoffCondition: {
                    ...currentHandoffCondition,
                    context_str: contextStr,
                } as WaldiezHandoffCondition,
            });
        }
    };
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
                        data-testid={"availability-enabled-checkbox"}
                    />
                    <div className="checkbox"></div>
                </label>
            </div>
            {enabled && (
                <div className="flex-column margin-top-10">
                    <label className="hidden" htmlFor="select-condition-type" />
                    <Select
                        options={conditionTypeOptions}
                        value={
                            currentHandoffCondition?.condition_type
                                ? {
                                      label: conditionTypeMapping[currentHandoffCondition.condition_type],
                                      value: currentHandoffCondition.condition_type,
                                  }
                                : null
                        }
                        onChange={onConditionTypeChange}
                        inputId="select-condition-type"
                        className="flex-1 margin-right-10"
                        isClearable
                    />
                    {currentHandoffCondition?.condition_type === "string_llm" && (
                        <div className="margin-top-10">
                            <label>LLM Prompt:</label>
                            <div className="margin-top-5" />
                            <textarea
                                rows={2}
                                title="LLM Prompt"
                                placeholder="Enter the LLM prompt"
                                value={currentHandoffCondition.prompt}
                                onChange={onStringLLMPromptChange}
                                data-testid={"llm-prompt-input"}
                            />
                        </div>
                    )}
                    {currentHandoffCondition?.condition_type === "context_str_llm" && (
                        <div className="margin-top-10">
                            <label>Prompt:</label>
                            <textarea
                                rows={2}
                                className="margin-top-5"
                                title="Prompt"
                                placeholder="Enter the prompt to evaluate"
                                value={currentHandoffCondition.context_str}
                                onChange={onContextStrLLMPromptChange}
                                data-testid={"context-llm-prompt-input"}
                            />
                        </div>
                    )}
                    {currentHandoffCondition?.condition_type === "string_context" && (
                        <div className="margin-top-10">
                            <TextInput
                                label={"Variable Name:"}
                                className="margin-top-5"
                                placeholder="Enter the variable name to check"
                                value={currentHandoffCondition.variable_name}
                                onChange={onVariableNameChange}
                                dataTestId={"variable-name-input"}
                            />
                        </div>
                    )}
                    {currentHandoffCondition?.condition_type === "expression_context" && (
                        <div className="margin-top-10">
                            <label>Expression:</label>
                            <textarea
                                rows={2}
                                className="margin-top-5"
                                title="Expression"
                                placeholder="Enter the expression to evaluate"
                                value={currentHandoffCondition.expression}
                                onChange={onExpressionChange}
                                data-testid={"expression-input"}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
