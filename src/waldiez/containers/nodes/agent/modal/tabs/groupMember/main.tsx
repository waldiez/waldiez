/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { AfterWork, Handoffs, Select, TabItem, TabItems, UpdateState } from "@waldiez/components";
import { useWaldiezAgentGroupMember } from "@waldiez/containers/nodes/agent/modal/tabs/groupMember/hooks";
import type { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/types";

type WaldiezAgentGroupProps = {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    edges: WaldiezEdge[];
    darkMode: boolean;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for managing agent group membership and related settings
 * Handles joining/leaving groups and configuring group-specific behavior
 */
export const WaldiezAgentGroupMember = memo((props: WaldiezAgentGroupProps) => {
    const { id, data, darkMode, agents, edges, onDataChange } = props;

    const isDocAgent = data.agentType === "doc_agent";

    // Use the hook for group-related state and handlers
    const {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        groupMembers,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
        onAfterWorkChange,
    } = useWaldiezAgentGroupMember(props);

    /**
     * Current selected group value for the dropdown
     */
    const selectedGroupValue = useMemo(
        () =>
            selectedGroup
                ? {
                      label: selectedGroup.data.label,
                      value: selectedGroup,
                  }
                : null,
        [selectedGroup],
    );

    /**
     * Determine if group tabs should be shown
     */
    const showGroupTabs = !!currentGroupManager;

    /**
     * Join button disabled state
     */
    const isJoinButtonDisabled = selectedGroup === null;

    return (
        <div className="agent-panel agent-group-panel">
            <TabItems activeTabIndex={0}>
                {/* Membership Tab */}
                <TabItem id={`wa-${id}-group-membership`} label="Membership">
                    <div style={{ padding: "1rem" }} data-testid={`agent-group-panel-${id}`}>
                        <div className="info margin-bottom-10">
                            Should this agent be part of a group chat?
                        </div>
                        {/* Not in a group: Show group selection dropdown and join button */}
                        {!showGroupTabs ? (
                            <div>
                                <label htmlFor={`agent-select-group-${id}`}>Group:</label>
                                <div className="margin-top-10" />
                                <div className="flex space-between">
                                    <Select
                                        options={groupOptions}
                                        value={selectedGroupValue}
                                        onChange={onSelectGroupChange}
                                        inputId={`agent-select-group-${id}`}
                                        className="flex-1 margin-right-10"
                                        aria-label="Select a group to join"
                                    />

                                    <button
                                        type="button"
                                        title="Join group"
                                        className="agent-panel-select-group-action"
                                        onClick={onJoinGroup}
                                        disabled={isJoinButtonDisabled}
                                        data-testid={`join-group-button-agent-${id}`}
                                        aria-label="Join selected group"
                                    >
                                        Join group
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* In a group: Show group info and leave button */
                            <div className="flex space-between current-group-info">
                                <div
                                    className="agent-panel-group-label"
                                    data-testid={`group-label-agent-${id}`}
                                >
                                    {currentGroupManager.data.label}
                                </div>

                                <div className="agent-panel-group-actions">
                                    <button
                                        title="Leave group"
                                        type="button"
                                        className="agent-panel-group-action"
                                        onClick={onLeaveGroup}
                                        data-testid={`leave-group-button-agent-${id}`}
                                        aria-label="Leave current group"
                                    >
                                        Leave group
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabItem>

                {/* Handoffs Tab - Only shown when in a group */}
                {showGroupTabs && (
                    <TabItem id={`wa-${id}-group-handoffs`} label="Handoffs">
                        <Handoffs
                            agents={agents}
                            edges={edges}
                            id={id}
                            data={data}
                            onDataChange={onDataChange}
                        />
                    </TabItem>
                )}

                {/* State Tab - Only shown when in a group */}
                {showGroupTabs && !isDocAgent && (
                    <TabItem id={`wa-${id}-group-update-state`} label="State">
                        <UpdateState data={data} darkMode={darkMode} onDataChange={onDataChange} />
                    </TabItem>
                )}

                {/* Afterwards Tab - Only shown when in a group */}
                {showGroupTabs && (
                    <TabItem label="Afterwards" id={`wa-${id}-group-after-work`}>
                        <div
                            style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                            data-testid={`after-work-panel-${id}`}
                        >
                            <AfterWork
                                target={data.afterWork}
                                agents={groupMembers}
                                onChange={onAfterWorkChange}
                                isForGroupChat={false}
                                aria-label="After work configuration"
                            />
                        </div>
                    </TabItem>
                )}
            </TabItems>
        </div>
    );
});

WaldiezAgentGroupMember.displayName = "WaldiezAgentGroupMember";
