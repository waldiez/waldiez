/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { CheckboxInput } from "@waldiez/components/checkboxInput";
import { Editor } from "@waldiez/components/editor";
import { Select, SingleValue } from "@waldiez/components/select";
import { TextareaInput } from "@waldiez/components/textareaInput";
import { WaldiezAgentUpdateSystemMessageType, WaldiezNodeAgentData } from "@waldiez/models";

type UpdateStateProps = {
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    darkMode: boolean;
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

export const UpdateState: React.FC<UpdateStateProps> = props => {
    const { data, onDataChange, darkMode } = props;

    /**
     * Determine if update config exists
     */
    const hasUpdateConfig = useMemo(
        () => data.updateAgentStateBeforeReply.length > 0,
        [data.updateAgentStateBeforeReply],
    );

    /**
     * Get the current config or a default
     */
    const currentConfig = useMemo(
        () =>
            hasUpdateConfig
                ? data.updateAgentStateBeforeReply[0]
                : { type: "string" as WaldiezAgentUpdateSystemMessageType, content: "" },
        [hasUpdateConfig, data.updateAgentStateBeforeReply],
    );

    /**
     * Local state
     */
    const [enabled, setEnabled] = useState<boolean>(hasUpdateConfig);
    const [selectedType, setSelectedType] = useState<WaldiezAgentUpdateSystemMessageType>(
        currentConfig?.type || "string",
    );

    /**
     * Sync local state with props when props change
     */
    useEffect(() => {
        setEnabled(hasUpdateConfig);
        if (hasUpdateConfig) {
            setSelectedType(currentConfig?.type || "string");
        }
    }, [hasUpdateConfig, currentConfig?.type]);

    /**
     * Options for dropdown
     */
    const updateSystemMessageTypeOptions = useMemo(
        () => [
            { label: "Text", value: "string" as WaldiezAgentUpdateSystemMessageType },
            { label: "Function", value: "callable" as WaldiezAgentUpdateSystemMessageType },
        ],
        [],
    );

    /**
     * Current selected option
     */
    const selectedOption = useMemo(
        () => updateSystemMessageTypeOptions.find(opt => opt.value === selectedType),
        [updateSystemMessageTypeOptions, selectedType],
    );

    /**
     * Handle enable/disable toggle
     */
    const onEnabledChange = useCallback(
        (checked: boolean) => {
            setEnabled(checked);

            if (!checked) {
                // Clear configuration when disabled
                onDataChange({ updateAgentStateBeforeReply: [] });
            } else {
                // Create default configuration when enabled
                // Maintain previously selected type if toggling back on
                const type = selectedType;
                const content = type === "string" ? "" : CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT;

                onDataChange({
                    updateAgentStateBeforeReply: [{ type, content }],
                });
            }
        },
        [onDataChange, selectedType],
    );

    /**
     * Handle type change
     */
    const onUpdateSystemMessageTypeChange = useCallback(
        (option: SingleValue<{ label: string; value: WaldiezAgentUpdateSystemMessageType }>) => {
            if (!option) {
                onDataChange({
                    updateAgentStateBeforeReply: [],
                });
                return;
            }

            const newType = option.value;
            setSelectedType(newType);

            // Update content based on type
            const content = newType === "string" ? "" : CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT;

            onDataChange({
                updateAgentStateBeforeReply: [{ type: newType, content }],
            });
        },
        [onDataChange],
    );

    /**
     * Handle string content change
     */
    const onUpdateSystemMessageStringChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({
                updateAgentStateBeforeReply: [
                    {
                        type: "string",
                        content: event.target.value,
                    },
                ],
            });
        },
        [onDataChange],
    );

    /**
     * Handle function content change
     */
    const onUpdateSystemMessageCallableChange = useCallback(
        (value: string | undefined) => {
            onDataChange({
                updateAgentStateBeforeReply: [
                    {
                        type: "callable",
                        content: value ?? CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT,
                    },
                ],
            });
        },
        [onDataChange],
    );

    /**
     * Current content for string editor
     */
    const stringContent = useMemo(
        () => (hasUpdateConfig && currentConfig?.type === "string" ? currentConfig.content : ""),
        [hasUpdateConfig, currentConfig],
    );

    /**
     * Current content for callable editor
     */
    const callableContent = useMemo(
        () =>
            hasUpdateConfig && currentConfig?.type === "callable"
                ? currentConfig.content
                : CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT,
        [hasUpdateConfig, currentConfig],
    );

    return (
        <div className="agent-panel agent-update-state-panel">
            <div className="info margin-bottom-10">
                You can update the agent's system message before replying. This can be useful if you need to
                control the system message based on the current conversation context. If enabled, it can be a
                string or a function. If text, it will be used as a template and substitute the context
                variables. If a function, it should accept the agent and messages as arguments and return a
                string.
            </div>
            <div className="flex-column">
                <CheckboxInput
                    label="Update system message before reply"
                    isChecked={enabled}
                    onCheckedChange={onEnabledChange}
                    id={"enable-update-system-message"}
                    aria-label="Enable update system message"
                />
                {enabled && (
                    <>
                        <label htmlFor="update-system-message-type-select-input">Message update type</label>
                        <Select
                            options={updateSystemMessageTypeOptions}
                            value={selectedOption}
                            onChange={onUpdateSystemMessageTypeChange}
                            inputId="update-system-message-type-select-input"
                        />
                        <label htmlFor="update-system-message-string">Message update</label>
                        {selectedType === "string" ? (
                            <TextareaInput
                                rows={4}
                                value={stringContent}
                                placeholder="Enter a string template with {variable}s"
                                onChange={onUpdateSystemMessageStringChange}
                                data-testid="update-system-message-string"
                                id="update-system-message-string"
                            />
                        ) : (
                            <Editor
                                value={callableContent}
                                onChange={onUpdateSystemMessageCallableChange}
                                darkMode={darkMode}
                                data-testid="update-system-message-callable"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

UpdateState.displayName = "UpdateState";
