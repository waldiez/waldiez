/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { Editor, Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentSwarmUpdateStateProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";
import { WaldiezSwarmUpdateSystemMessageType } from "@waldiez/models";

export const WaldiezAgentSwarmUpdateState = (props: WaldiezAgentSwarmUpdateStateProps) => {
    const { data, onDataChange, darkMode } = props;
    const [selectedUpdateSystemMessageType, setSelectedUpdateSystemMessageType] =
        useState<WaldiezSwarmUpdateSystemMessageType>(
            data.updateAgentStateBeforeReply.length > 0
                ? data.updateAgentStateBeforeReply[0].updateFunctionType
                : "string",
        );
    const [enabled, setEnabled] = useState<boolean>(data.updateAgentStateBeforeReply.length > 0);
    // just one for now.
    const updateSystemMessageTypeOptions: {
        label: string;
        value: WaldiezSwarmUpdateSystemMessageType;
    }[] = [
        { label: "String", value: "string" },
        { label: "Function", value: "callable" },
    ];
    const updateSystemMessageTypeOptionsLabel: Record<WaldiezSwarmUpdateSystemMessageType, string> = {
        string: "String",
        callable: "Function",
    };
    const onEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEnabled(event.target.checked);
        if (!event.target.checked) {
            onDataChange({ updateAgentStateBeforeReply: [] });
        } else {
            onDataChange({
                updateAgentStateBeforeReply: [{ updateFunctionType: "string", updateFunction: "" }],
            });
        }
    };
    const currentUpdateAgentStateBeforeReply =
        data.updateAgentStateBeforeReply.length > 0
            ? data.updateAgentStateBeforeReply[0]
            : {
                  updateFunctionType: "string" as WaldiezSwarmUpdateSystemMessageType,
                  updateFunction: "",
              };
    const onUpdateSystemMessageTypeChange = (
        option: SingleValue<{ label: string; value: WaldiezSwarmUpdateSystemMessageType }>,
    ) => {
        if (option) {
            setSelectedUpdateSystemMessageType(option.value);
            onDataChange({
                updateAgentStateBeforeReply: [
                    {
                        updateFunctionType: option.value,
                        updateFunction:
                            option.value === "string" ? "" : CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT,
                    },
                ],
            });
        }
    };
    const onUpdateSystemMessageStringChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({
            updateAgentStateBeforeReply: [
                {
                    updateFunctionType: "string",
                    updateFunction: event.target.value,
                },
            ],
        });
    };
    const onUpdateSystemMessageCallableChange = (value: string | undefined) => {
        onDataChange({
            updateAgentStateBeforeReply: [
                {
                    updateFunctionType: "callable",
                    updateFunction: value ?? "",
                },
            ],
        });
    };
    return (
        <div className="agent-panel agent-swarm-update-state-panel">
            <div className="info margin-bottom-10">
                You can update the agent's system message before replying. This can be useful if you need to
                control the system message based on the current conversation context. If enabled, it can be a
                string or a function. If a string, it will be used as a template and substitute the context
                variables. If a function, it should accept the agent and messages as arguments and return a
                string.
            </div>
            <div className="flex-column">
                <label className="checkbox-label enable-checkbox">
                    <div className="checkbox-label-view">Update system message before reply</div>
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={onEnabledChange}
                        data-testid="enable-update-system-message"
                    />
                    <div className="checkbox"></div>
                </label>
                {enabled && (
                    <>
                        <label>Message update type</label>
                        <Select
                            options={updateSystemMessageTypeOptions}
                            value={{
                                label: updateSystemMessageTypeOptionsLabel[selectedUpdateSystemMessageType],
                                value: selectedUpdateSystemMessageType,
                            }}
                            onChange={onUpdateSystemMessageTypeChange}
                        />
                        <label>Message update</label>
                        {currentUpdateAgentStateBeforeReply.updateFunctionType === "string" && (
                            <textarea
                                rows={4}
                                defaultValue={currentUpdateAgentStateBeforeReply.updateFunction}
                                placeholder="Enter a string template with {variable}s"
                                onChange={onUpdateSystemMessageStringChange}
                                data-testid="update-system-message-string"
                            />
                        )}
                        {currentUpdateAgentStateBeforeReply.updateFunctionType === "callable" && (
                            <Editor
                                value={currentUpdateAgentStateBeforeReply.updateFunction}
                                onChange={onUpdateSystemMessageCallableChange}
                                darkMode={darkMode}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export const CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT = `"""Custom update system message function."""

# provide the function to define the system message before replying
# complete the \`custom_update_system_message\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the final message.
# the function should accept the agent and the messages as arguments.
# example:
# def custom_update_system_message(
#     agent: ConversableAgent,
#     messages: List[Dict[str, Any]]
# ) -> str:
#     return "Hello, I am a custom system message"

def custom_update_system_message(
     agent: ConversableAgent,
     messages: List[Dict[str, Any]]
) -> str:
    ...
`;
