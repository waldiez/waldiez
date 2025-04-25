/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Select } from "@waldiez/components";
import { useWaldiezAgentGroup } from "@waldiez/containers/nodes/agent/modal/tabs/group/hooks";
import { WaldiezAgentGroupProps } from "@waldiez/containers/nodes/agent/modal/tabs/group/types";

export const WaldiezAgentGroup = (props: WaldiezAgentGroupProps) => {
    const { id } = props;
    const {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
    } = useWaldiezAgentGroup(props);
    return (
        <div className="agent-panel agent-group-panel margin-top-20 margin-bottom-10">
            <div className="info margin-bottom-20">
                Whether this agent will become member of a group chat. If a manager agent is selected, the
                current agent is placed inside the group manager box.
            </div>
            {!currentGroupManager ? (
                <div className="agent-panel-select-group">
                    <label className="hidden" htmlFor={`agent-select-group-${id}`}>
                        Group
                    </label>
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
            ) : (
                <div className="agent-panel-current-group">
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
    );
};
