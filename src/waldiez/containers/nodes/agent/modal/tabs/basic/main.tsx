/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { InfoCheckbox, InfoLabel, NumberInput, Select, TextInput, TextareaInput } from "@waldiez/components";
import { useWaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic/hooks";
import {
    WaldiezAgentHumanInputMode,
    WaldiezNodeAgentAssistantData,
    WaldiezNodeAgentData,
} from "@waldiez/types";

type WaldiezAgentBasicProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    onAgentTypeChange: (agentType: "user_proxy" | "rag_user_proxy") => void;
};

/**
 * Component for configuring basic agent settings
 * Handles name, description, system message, and various behavior options
 */
export const WaldiezAgentBasic = memo((props: WaldiezAgentBasicProps) => {
    const { id, data } = props;

    const {
        onRagChange,
        onMultimodalChange,
        onNameChange,
        onDescriptionChange,
        onSystemMessageChange,
        onHumanInputModeChange,
        onMaxConsecutiveAutoReplyChange,
        onAgentDefaultAutoReplyChange,
    } = useWaldiezAgentBasic(props);

    /**
     * Human input mode options and mapping
     */
    const inputMethodsMapping = useMemo(
        () => ({
            ALWAYS: "Always",
            NEVER: "Never",
            TERMINATE: "Terminate",
        }),
        [],
    );

    const inputMethodOptions = useMemo(
        () => [
            { label: "Always", value: "ALWAYS" as WaldiezAgentHumanInputMode },
            { label: "Never", value: "NEVER" as WaldiezAgentHumanInputMode },
            { label: "Terminate", value: "TERMINATE" as WaldiezAgentHumanInputMode },
        ],
        [],
    );

    /**
     * Current human input mode selection
     */
    const currentHumanInputMode = useMemo(
        () => ({
            label: inputMethodsMapping[data.humanInputMode],
            value: data.humanInputMode,
        }),
        [data.humanInputMode, inputMethodsMapping],
    );

    return (
        <div className="agent-panel agent-basic-panel">
            {/* RAG toggle for user proxy agents */}
            {(data.agentType === "user_proxy" || data.agentType === "rag_user_proxy") && (
                <InfoCheckbox
                    label="Use RAG"
                    info="If checked, the agent will use Retrieval Augmented Generation (RAG) for generating responses."
                    checked={data.agentType === "rag_user_proxy"}
                    onChange={onRagChange}
                    dataTestId={`agent-rag-toggle-${id}`}
                />
            )}

            {/* Multimodal toggle for assistant agents */}
            {data.agentType === "assistant" && (
                <InfoCheckbox
                    label="Multimodal"
                    info="If checked, the agent will handle uploaded images from the user. NOTE: Make sure you use a compatible LLM model that supports multimodal inputs (e.g. GPT-4o-mini)."
                    checked={(data as WaldiezNodeAgentAssistantData).isMultimodal ?? false}
                    onChange={onMultimodalChange}
                    dataTestId={`agent-multimodal-toggle-${id}`}
                />
            )}

            {/* Name input */}
            <TextInput
                label="Name:"
                value={data.label}
                onChange={onNameChange}
                dataTestId={`agent-name-input-${id}`}
                aria-label="Agent name"
            />

            {/* Description textarea */}
            <label htmlFor={`agent-description-input-${id}`}>Description:</label>
            <TextareaInput
                id={`agent-description-input-${id}`}
                title="Agent description"
                rows={2}
                value={data.description}
                onChange={onDescriptionChange}
                data-testid={`agent-description-input-${id}`}
                aria-label="Agent description"
            />

            {/* System message textarea */}
            <label htmlFor={`agent-system-message-input-${id}`}>System Message:</label>
            <TextareaInput
                id={`agent-system-message-input-${id}`}
                title="System message"
                rows={2}
                value={data.systemMessage ?? ""}
                onChange={onSystemMessageChange}
                data-testid={`agent-system-message-input-${id}`}
                aria-label="System message"
            />

            {/* Human input mode selection */}
            <InfoLabel
                label="Human Input mode:"
                info={() => (
                    <div>
                        Whether to ask for human inputs every time a message is received. <br />
                        Possible values are: <br />
                        <ul>
                            <li>
                                <b>Always:</b> the agent prompts for human input every time a message is
                                received. Under this mode, the conversation stops when the human input is
                                "exit", or when is_termination_msg is True and there is no human input.
                            </li>
                            <li>
                                <b>Terminate:</b> the agent only prompts for human input only when a
                                termination message is received or the number of auto reply reaches the
                                max_consecutive_auto_reply.
                            </li>
                            <li>
                                <b>Never:</b> the agent will never prompt for human input. Under this mode,
                                the conversation stops when the number of auto reply reaches the
                                max_consecutive_auto_reply or when is_termination_msg is True.
                            </li>
                        </ul>
                    </div>
                )}
            />

            <label htmlFor={`agent-human-input-mode-select-${id}`} className="hidden">
                Human Input mode:
            </label>
            <Select
                options={inputMethodOptions}
                value={currentHumanInputMode}
                onChange={onHumanInputModeChange}
                inputId={`agent-human-input-mode-select-${id}`}
                aria-label="Human input mode"
            />

            {/* Max consecutive auto reply input */}
            <NumberInput
                label="Max consecutive auto reply: "
                value={data.maxConsecutiveAutoReply}
                onChange={onMaxConsecutiveAutoReplyChange}
                min={0}
                max={1001}
                step={1}
                setNullOnUpper={true}
                setNullOnLower={false}
                onLowerLabel="No auto reply"
                onUpperLabel="Unset"
                labelInfo="The maximum number of consecutive auto replies (i.e., when no code execution or llm-based reply is generated). Default is None (no limit provided). When set to 0, no auto reply will be generated."
                dataTestId={`agent-max-consecutive-auto-reply-input-${id}`}
                aria-label="Maximum consecutive auto replies"
            />

            {/* Default auto reply input */}
            <TextInput
                className="full-width"
                label="Agent Default Auto Reply:"
                value={data.agentDefaultAutoReply ?? ""}
                onChange={onAgentDefaultAutoReplyChange}
                dataTestId={`agent-default-auto-reply-input-${id}`}
                aria-label="Default auto reply message"
            />

            <div className="margin-bottom-10" />
        </div>
    );
});

WaldiezAgentBasic.displayName = "WaldiezAgentBasic";
