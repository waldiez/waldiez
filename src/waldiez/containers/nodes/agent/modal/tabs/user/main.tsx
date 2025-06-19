/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback } from "react";

import { NumberInput, TabItem, TabItems, TextInput, TextareaInput } from "@waldiez/components";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentNestedChats } from "@waldiez/containers/nodes/agent/modal/tabs/nested";
import { WaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools";
import {
    WaldiezAgentConnections,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeTool,
} from "@waldiez/models";

export const WaldiezAgentUserTabs: React.FC<{
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    tools: WaldiezNodeTool[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    flowId: string;
    isDarkMode: boolean;
    isModalOpen: boolean;
    showNestedChatsTab: boolean;
    agentConnections: WaldiezAgentConnections;
}> = memo(props => {
    const { id, flowId, data, tools, showNestedChatsTab, onDataChange, agentConnections, agents } = props;

    const onNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ label: event.target.value });
        },
        [onDataChange],
    );

    const onMaxConsecutiveAutoReplyChange = useCallback(
        (value: number | null) => {
            onDataChange({ maxConsecutiveAutoReply: value });
        },
        [onDataChange],
    );

    const onAgentDefaultAutoReplyChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({ agentDefaultAutoReply: event.target.value });
        },
        [onDataChange],
    );

    return (
        <div className="agent-panel agent-user-panel margin-bottom-10" data-testid={`agent-user-panel-${id}`}>
            <TabItems>
                <TabItem label="User" id={`wf-${flowId}-wa-${id}-user`}>
                    <div className="modal-tab-body">
                        {/* Name input */}
                        <TextInput
                            label="Name:"
                            name="agent-name"
                            value={data.label}
                            onChange={onNameChange}
                            dataTestId={`agent-name-input-${id}`}
                            aria-label="Agent name"
                            className="margin-top-5"
                        />
                        {/* Max consecutive auto reply input */}
                        <NumberInput
                            name="max-consecutive-auto-reply"
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
                        <div className="margin-bottom-20" />
                        {/* Default auto reply input */}
                        <label htmlFor={`agent-default-auto-reply-input-${id}`}>Default Auto Reply:</label>
                        <TextareaInput
                            className="full-width margin-top-5"
                            value={data.agentDefaultAutoReply ?? ""}
                            onChange={onAgentDefaultAutoReplyChange}
                            data-testid={`agent-default-auto-reply-input-${id}`}
                            aria-label="Default auto reply message"
                            placeholder="Type your default auto reply message here..."
                        />
                    </div>
                </TabItem>
                {/* Code Execution Tab */}
                <TabItem label="Code Execution" id={`wf-${flowId}-wa-${id}-codeExecution`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentCodeExecution
                            id={id}
                            data={data}
                            tools={tools}
                            onDataChange={onDataChange}
                        />
                    </div>
                </TabItem>
                <TabItem label="Tools" id={`wf-${flowId}-wa-${id}-tools`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentTools
                            id={id}
                            data={data}
                            agents={agents}
                            tools={tools}
                            skipExecutor={false}
                            onDataChange={onDataChange}
                        />
                    </div>
                </TabItem>
                {showNestedChatsTab && (
                    <TabItem label="Nested chat" id={`wf-${flowId}-wa-${id}-nested`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentNestedChats
                                id={id}
                                data={data as WaldiezNodeAgentData}
                                onDataChange={onDataChange}
                                agentConnections={agentConnections}
                            />
                        </div>
                    </TabItem>
                )}
            </TabItems>
        </div>
    );
});

WaldiezAgentUserTabs.displayName = "WaldiezAgentUserTabs";
