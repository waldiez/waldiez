/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { InfoCheckbox, InfoLabel, NumberInput, Select, TextInput } from "@waldiez/components";
import { useWaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic/hooks";
import { WaldiezAgentBasicProps } from "@waldiez/containers/nodes/agent/modal/tabs/basic/types";
import { WaldiezAgentHumanInputMode } from "@waldiez/types";

export const WaldiezAgentBasic = (props: WaldiezAgentBasicProps) => {
    const { id } = props;
    const {
        data,
        onRagChange,
        onNameChange,
        onDescriptionChange,
        onSystemMessageChange,
        onHumanInputModeChange,
        onMaxConsecutiveAutoReplyChange,
        onAgentDefaultAutoReplyChange,
    } = useWaldiezAgentBasic(props);
    return (
        <div className="agent-panel agent-basic-panel">
            {(data.agentType === "user" || data.agentType === "rag_user") && (
                <InfoCheckbox
                    label={"Use RAG"}
                    info={
                        "If checked, the agent will use Retrieval augmented generation (RAG) for generating responses."
                    }
                    checked={data.agentType === "rag_user"}
                    onChange={onRagChange}
                    dataTestId={`agent-rag-toggle-${id}`}
                />
            )}
            <TextInput
                label="Name:"
                value={data.label}
                onChange={onNameChange}
                dataTestId={`agent-name-input-${id}`}
            />
            <label>Description:</label>
            <textarea
                title="Agent description"
                rows={2}
                value={data.description}
                onChange={onDescriptionChange}
                data-testid={`agent-description-input-${id}`}
            />
            <label>System Message:</label>
            <textarea
                title="System message"
                rows={2}
                value={data.systemMessage ?? ""}
                onChange={onSystemMessageChange}
                data-testid={`agent-system-message-input-${id}`}
            />
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
            <label className="hidden" htmlFor={`agent-human-input-mode-select-${id}`}>
                Human Input mode:
            </label>
            <Select
                options={inputMethodOptions}
                value={{
                    label: inputMethodsMapping[data.humanInputMode],
                    value: data.humanInputMode,
                }}
                onChange={onHumanInputModeChange}
                inputId={`agent-human-input-mode-select-${id}`}
            />
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
            />
            <TextInput
                label="Agent Default Auto Reply:"
                value={data.agentDefaultAutoReply ?? ""}
                onChange={onAgentDefaultAutoReplyChange}
                dataTestId={`agent-default-auto-reply-input-${id}`}
            />
            <div className="margin-bottom-10" />
        </div>
    );
};
const inputMethodsMapping = {
    ALWAYS: "Always",
    NEVER: "Never",
    TERMINATE: "Terminate",
};
const inputMethodOptions: {
    label: string;
    value: WaldiezAgentHumanInputMode;
}[] = [
    { label: "Always", value: "ALWAYS" },
    { label: "Never", value: "NEVER" },
    { label: "Terminate", value: "TERMINATE" },
];
