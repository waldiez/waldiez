/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { OnConditionAvailable, TabItem, TabItems, TextInput } from "@waldiez/components";
import { WaldiezEdgeSwarmHandoffTabProps } from "@waldiez/containers/edges/modal/tabs/swarm/tabs/types";
import { WaldiezSwarmOnConditionAvailable } from "@waldiez/types";

export const WaldiezEdgeSwarmHandoffTab = (props: WaldiezEdgeSwarmHandoffTabProps) => {
    const { activeTabIndex, flowId, edgeId, targetAgent, data, darkMode, onDataChange } = props;
    const onConditionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({ description: event.target.value });
    };
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: event.target.value });
    };
    const onConditionAvailableChange = (available: WaldiezSwarmOnConditionAvailable) => {
        onDataChange({ available });
    };
    return (
        <TabItems activeTabIndex={activeTabIndex}>
            <TabItem label="Handoff" id={`we-${flowId}-edge-handoff-${edgeId}`}>
                <div className="modal-tab-body">
                    <div className="flex-column">
                        <TextInput
                            label="Label:"
                            value={data.label}
                            placeholder={`Transfer to ${targetAgent.data.label}`}
                            onChange={onNameChange}
                            dataTestId={`edge-${edgeId}-description-input`}
                        />
                        <div className="flex-column">
                            <label>Condition:</label>
                            <textarea
                                rows={2}
                                defaultValue={data.description}
                                placeholder={`Transfer to ${targetAgent.data.label}`}
                                onChange={onConditionChange}
                                data-testid={`edge-${edgeId}-condition-input`}
                            />
                        </div>
                    </div>
                </div>
            </TabItem>
            <TabItem label="Availability" id={`we-${flowId}-edge-availability-${edgeId}`}>
                <div className="modal-tab-body">
                    <OnConditionAvailable
                        data={data.available}
                        onDataChange={onConditionAvailableChange}
                        flowId={flowId}
                        darkMode={darkMode}
                    />
                </div>
            </TabItem>
        </TabItems>
    );
};
