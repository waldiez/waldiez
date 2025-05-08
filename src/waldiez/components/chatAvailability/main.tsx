/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { Select, SingleValue } from "@waldiez/components/select";
import { TextInput } from "@waldiez/components/textInput";
import { ConditionType, WaldiezEdgeData, WaldiezHandoffCondition } from "@waldiez/types";

const conditionTypeMapping: Record<ConditionType, string> = {
    string_llm: "Static LLM prompt",
    context_str_llm: "Dynamic LLM Prompt",
    string_context: "Variable check",
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
    // const [selectedConditionType, setSelectedConditionType] = useState<ConditionType | null>(null);
    const onHandoffConditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setEnabled(isChecked);
        if (!isChecked) {
            onDataChange({ handoffCondition: undefined });
        }
    };
    const conditionOptions: { value: ConditionType; label: string }[] = [
        { value: "string_llm", label: conditionTypeMapping.string_llm },
        { value: "context_str_llm", label: conditionTypeMapping.context_str_llm },
        { value: "string_context", label: conditionTypeMapping.string_context },
        { value: "expression_context", label: conditionTypeMapping.expression_context },
    ];
    const onConditionChange = (selectedOption: SingleValue<{ value: ConditionType; label: string }>) => {
        if (selectedOption) {
            const selectedConditionType = selectedOption.value;
            setCurrentHandoffCondition({
                condition_type: selectedConditionType,
            } as WaldiezHandoffCondition);
            // setSelectedConditionType(selectedOption.value);
            // onDataChange({ handoffCondition: selectedOption.value });
        } else {
            setCurrentHandoffCondition(null);
            onDataChange({ handoffCondition: null });
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
                        <strong>Dynamic LLM prompt</strong>: A context-aware prompt that includes variables.
                    </li>
                    <li>
                        <strong>Variable check</strong>: Checks if a specific context variable exists and is
                        truthy.
                    </li>
                    <li>
                        <strong>Expression check</strong>: Evaluates a logical expression using context
                        variables.
                    </li>
                </ul>
                <p className="no-padding no-margin">
                    The selected condition type will determine how the condition is evaluated. For example, if
                    you choose "Static LLM prompt," you will need to provide a fixed prompt for the LLM to
                    evaluate. If you choose "Variable check," you will specify the context variable to check.
                </p>
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
                    <label className="hidden" htmlFor="select-condition-category" />
                    <Select
                        options={conditionOptions}
                        value={
                            currentHandoffCondition?.condition_type
                                ? {
                                      label: conditionTypeMapping[currentHandoffCondition.condition_type],
                                      value: currentHandoffCondition.condition_type,
                                  }
                                : null
                        }
                        onChange={onConditionChange}
                        inputId="select-condition-category"
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
                                onChange={e =>
                                    setCurrentHandoffCondition({
                                        ...currentHandoffCondition,
                                        prompt: e.target.value,
                                    })
                                }
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
                                placeholder="Enter the prompt"
                                value={currentHandoffCondition.context_str}
                                onChange={e =>
                                    setCurrentHandoffCondition({
                                        ...currentHandoffCondition,
                                        context_str: e.target.value,
                                    })
                                }
                                data-testid={"context-llm-prompt-input"}
                            />
                        </div>
                    )}
                    {currentHandoffCondition?.condition_type === "string_context" && (
                        <div className="margin-top-10">
                            <TextInput
                                label={"Variable Name:"}
                                className="margin-top-5"
                                placeholder="Enter the variable name"
                                value={currentHandoffCondition.variable_name}
                                onChange={e =>
                                    setCurrentHandoffCondition({
                                        ...currentHandoffCondition,
                                        variable_name: e.target.value,
                                    })
                                }
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
                                placeholder="Enter the expression"
                                value={currentHandoffCondition.expression}
                                onChange={e =>
                                    setCurrentHandoffCondition({
                                        ...currentHandoffCondition,
                                        expression: e.target.value,
                                    })
                                }
                                data-testid={"expression-input"}
                            />
                            {/* <input
                                title="Expression"
                                type="text"
                                placeholder="Enter the expression"
                                value={currentHandoffCondition.expression}
                                onChange={e =>
                                    setCurrentHandoffCondition({
                                        ...currentHandoffCondition,
                                        expression: e.target.value,
                                    })
                                }
                                data-testid={"expression-input"}
                            /> */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
