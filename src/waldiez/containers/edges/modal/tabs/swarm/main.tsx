/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { MessageInput, TabItem, TabItems, TextInput } from "@waldiez/components";
import { WaldiezEdgeBasicTab } from "@waldiez/containers/edges/modal/tabs/basic";
import { DEFAULT_NESTED_CHAT_MESSAGE_METHOD_CONTENT } from "@waldiez/containers/edges/modal/tabs/nested";
import {
    WaldiezEdgeSwarmHandoffTab,
    WaldiezEdgeSwarmTriggerTab,
} from "@waldiez/containers/edges/modal/tabs/swarm/tabs";
import { WaldiezEdgeSwarmTabsProps } from "@waldiez/containers/edges/modal/tabs/swarm/types";
import { WaldiezMessage, WaldiezMessageType } from "@waldiez/types";

// swarmType: "handoff" | "nested" | "source";

export const WaldiezEdgeSwarmTabs = (props: WaldiezEdgeSwarmTabsProps) => {
    const { isOpen, flowId, edgeId, sourceAgent, targetAgent, edgeData, darkMode, onDataChange } = props;
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isOpen]);
    const isHandoff = sourceAgent.data.agentType === "swarm" && targetAgent.data.agentType === "swarm";
    const isNested = sourceAgent?.data.agentType === "swarm" && targetAgent?.data.agentType !== "swarm";
    const isTrigger =
        sourceAgent.data.agentType !== "swarm" &&
        (targetAgent?.data.agentType === "swarm" || targetAgent.data.agentType === "swarm_container");
    const noOp = () => {};
    const currentMessageInput = edgeData.nestedChat?.message ?? {
        type: "string",
        use_carryover: false,
        content: "",
        context: {},
    };
    const onNestedMessageTypeChange = (type: WaldiezMessageType) => {
        onDataChange({
            nestedChat: {
                ...edgeData.nestedChat,
                message: {
                    ...currentMessageInput,
                    content: type === "string" ? "" : DEFAULT_NESTED_CHAT_MESSAGE_METHOD_CONTENT,
                    type,
                },
            },
        });
    };
    const onNestedMessageChange = (message: WaldiezMessage) => {
        onDataChange({
            nestedChat: {
                ...edgeData.nestedChat,
                message: {
                    ...currentMessageInput,
                    content: message.content,
                },
            },
        });
    };
    const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: event.target.value });
    };
    return (
        <div className="modal-body edge-modal">
            {isTrigger && (
                <WaldiezEdgeSwarmTriggerTab
                    activeTabIndex={activeTabIndex}
                    flowId={flowId}
                    edgeId={edgeId}
                    data={edgeData}
                    onDataChange={onDataChange}
                />
            )}
            {isHandoff && (
                <WaldiezEdgeSwarmHandoffTab
                    activeTabIndex={activeTabIndex}
                    flowId={flowId}
                    targetAgent={targetAgent}
                    edgeId={edgeId}
                    darkMode={darkMode}
                    data={edgeData}
                    onDataChange={onDataChange}
                />
            )}
            {isNested && (
                <TabItems activeTabIndex={0}>
                    <TabItem label="Properties" id={`we-${flowId}-edge-properties-${edgeId}`}>
                        <div className="flex-column margin-bottom-10">
                            <TextInput
                                label="Label:"
                                value={edgeData.label}
                                onChange={onLabelChange}
                                dataTestId={`edge-${edgeId}-label-input`}
                            />
                        </div>
                        <WaldiezEdgeBasicTab
                            edgeId={edgeId}
                            data={edgeData}
                            edgeType="swarm"
                            onDataChange={onDataChange}
                            onTypeChange={noOp}
                        />
                    </TabItem>
                    <TabItem label="Message" id={`we-${flowId}-edge-nested-chat-${edgeId}-message`}>
                        <div className="flex-column">
                            <MessageInput
                                darkMode={darkMode}
                                current={currentMessageInput}
                                selectLabel="Message Type:"
                                selectTestId={`select-nested-message-type-${edgeId}`}
                                defaultContent={DEFAULT_NESTED_CHAT_MESSAGE_METHOD_CONTENT}
                                notNoneLabel="Message:"
                                notNoneLabelInfo="The message to be sent from the source."
                                includeContext={false}
                                skipCarryoverOption={true}
                                skipRagOption={true}
                                skipNone={true}
                                onTypeChange={onNestedMessageTypeChange}
                                onMessageChange={onNestedMessageChange}
                                onAddContextEntry={noOp}
                                onRemoveContextEntry={noOp}
                                onUpdateContextEntries={noOp}
                            />
                        </div>
                    </TabItem>
                </TabItems>
            )}
        </div>
    );
};
