/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { AfterWork, Select, TabItem, TabItems, WaldiezAgentUpdateState } from "@waldiez/components";
import { useWaldiezAgentGroup } from "@waldiez/containers/nodes/agent/modal/tabs/group/hooks";
import { WaldiezAgentGroupProps } from "@waldiez/containers/nodes/agent/modal/tabs/group/types";

export const WaldiezAgentGroup = (props: WaldiezAgentGroupProps) => {
    const { id, data, darkMode, onDataChange } = props;
    const {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        groupMembers,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
    } = useWaldiezAgentGroup(props);
    return (
        <TabItems activeTabIndex={0}>
            <TabItem id={`wa-${id}-group-membership`} label="Membership">
                <div className="agent-panel agent-group-panel margin-top-10 margin-bottom-10">
                    <div className="info margin-bottom-10">Should this agent be part of a group chat?</div>
                    {!currentGroupManager ? (
                        <div className="agent-panel-select-group">
                            <label className="hidden" htmlFor={`agent-select-group-${id}`}>
                                Select Group
                            </label>
                            <div className="flex space-between">
                                <Select
                                    options={groupOptions}
                                    value={
                                        selectedGroup
                                            ? {
                                                  label: selectedGroup.data.label,
                                                  value: selectedGroup,
                                              }
                                            : null
                                    }
                                    onChange={onSelectGroupChange}
                                    inputId={`agent-select-group-${id}`}
                                    className="flex-1 margin-right-10"
                                />
                                <button
                                    type="button"
                                    title="Join group"
                                    className="agent-panel-select-group-action"
                                    onClick={onJoinGroup}
                                    disabled={selectedGroup === null}
                                    data-testid={`join-group-button-agent-${id}`}
                                >
                                    Join group
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex space-between">
                            <div className="agent-panel-group-label" data-testid={`group-label-agent-${id}`}>
                                {currentGroupManager.data.label}
                            </div>
                            <div className="agent-panel-group-actions">
                                <button
                                    title="Leave group"
                                    type="button"
                                    className="agent-panel-group-action"
                                    onClick={onLeaveGroup}
                                    data-testid={`leave-group-button-agent-${id}`}
                                >
                                    Leave group
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </TabItem>
            {currentGroupManager && (
                <TabItem id={`wa-${id}-group-handoffs`} label="Handoffs">
                    Handoffs
                </TabItem>
            )}
            {currentGroupManager && (
                <TabItem id={`wa-${id}-group-update-state`} label="State">
                    <WaldiezAgentUpdateState data={data} darkMode={darkMode} onDataChange={onDataChange} />
                </TabItem>
            )}
            {currentGroupManager && (
                <TabItem label={"Afterwards"} id={`wa-${id}-after-work`}>
                    <div className="modal-body">
                        <AfterWork
                            target={undefined}
                            agents={groupMembers}
                            onChange={() => {}}
                            isForGroupChat
                        />
                    </div>
                </TabItem>
            )}
        </TabItems>
    );
};
