/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Editor } from "@waldiez/components/editor";
import { InfoCheckbox } from "@waldiez/components/infoCheckBox";
import { Select, SingleValue } from "@waldiez/components/select";
import { OnConditionAvailableProps } from "@waldiez/components/swarm/onConditionAvailable/types";
import { TextInput } from "@waldiez/components/textInput";
import { WaldiezSwarmOnConditionAvailableCheckType } from "@waldiez/models";
import { DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT } from "@waldiez/models/Agent/Swarm/OnCondition";

export const OnConditionAvailable = (props: OnConditionAvailableProps) => {
    const { data, flowId, darkMode, onDataChange } = props;
    const onConditionAvailableEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        if (checked) {
            onDataChange({ type: "string", value: "" });
        } else {
            onDataChange({ type: "none", value: null });
        }
    };
    const onConditionAvailableTypeChange = (
        option: SingleValue<{ label: string; value: WaldiezSwarmOnConditionAvailableCheckType }>,
    ) => {
        if (option) {
            const defaultContent =
                option.value === "callable" ? DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT : "";
            onDataChange({
                type: option.value,
                value: defaultContent,
            });
        }
    };
    const onConditionAvailableStringChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({
            type: "string",
            value: event.target.value,
        });
    };
    const onConditionAvailableCallableChange = (value: string | undefined) => {
        onDataChange({
            type: "callable",
            value: value ?? DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT,
        });
    };
    return (
        <div>
            <div className="flex-column">
                <InfoCheckbox
                    label={"Enable Availability Check"}
                    info={
                        "Optional condition to determine if this handoff is available. " +
                        "Can be a custom method or a variable name. " +
                        "If a variable, it will look up the value of the context variable with that name, which should be a bool." +
                        "If a method, it will call the method with the agent and the message as arguments and expect a boolean output."
                    }
                    checked={data.type !== "none"}
                    dataTestId="onConditionAvailable"
                    onChange={onConditionAvailableEnabledChange}
                />
            </div>
            {data.type !== "none" && (
                <div>
                    <div className="margin-top-10" />
                    <label htmlFor={`wf-${flowId}-handoff-select-availability-check`}>
                        Availability Check Type:
                    </label>
                    <Select
                        options={[
                            {
                                label: "Variable",
                                value: "string" as "string" | "callable",
                            },
                            {
                                label: "Method",
                                value: "callable" as "string" | "callable",
                            },
                        ]}
                        value={{
                            label: data.type === "string" ? "Variable" : "Method",
                            value: data.type,
                        }}
                        onChange={onConditionAvailableTypeChange}
                        inputId={`wf-${flowId}-handoff-select-availability-check`}
                    />
                </div>
            )}
            {data.type === "string" && (
                <div className="margin-top-10">
                    <TextInput
                        label={"Variable to check:"}
                        value={data.value ?? ""}
                        onChange={onConditionAvailableStringChange}
                        placeholder={"Enter a variable name"}
                        dataTestId="onConditionAvailableVariableInput"
                    />
                </div>
            )}
            {data.type === "callable" && (
                <div className="margin-top-10">
                    <Editor
                        value={data.value ?? DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT}
                        onChange={onConditionAvailableCallableChange}
                        darkMode={darkMode}
                    />
                </div>
            )}
        </div>
    );
};
