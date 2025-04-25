/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TabItem, TabItems, TextInput } from "@waldiez/components";
import { WaldiezEdgeSwarmTriggerTabProps } from "@waldiez/containers/edges/modal/tabs/swarm/tabs/types";

export const WaldiezEdgeSwarmTriggerTab = (props: WaldiezEdgeSwarmTriggerTabProps) => {
    const { activeTabIndex, edgeId, flowId, data: edgeData, onDataChange } = props;
    const onMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({
            message: { content: event.target.value, type: "string", context: {}, use_carryover: false },
        });
    };
    const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: event.target.value });
    };
    return (
        <TabItems activeTabIndex={activeTabIndex}>
            <TabItem label="Configuration" id={`we-${flowId}-edge-properties-${edgeId}`}>
                <div className="flex-column">
                    <TextInput
                        label="Label:"
                        value={edgeData.label}
                        onChange={onLabelChange}
                        dataTestId={`edge-${edgeId}-label-input`}
                    />
                    <label>Message:</label>
                    <textarea
                        rows={2}
                        defaultValue={edgeData.message.content ?? ""}
                        placeholder="Enter the message to use when the swarm chat starts"
                        onChange={onMessageChange}
                        data-testid={`edge-${edgeId}-condition-input`}
                    />
                </div>
            </TabItem>
        </TabItems>
    );
};
