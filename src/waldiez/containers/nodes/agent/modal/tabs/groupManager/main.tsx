/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TabItem, TabItems } from "@waldiez/components";
import {
    GroupManagerConfig,
    GroupManagerSpeakers,
} from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/tabs";
import { WaldiezAgentGroupManagerProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import { WaldiezNodeAgentGroupManagerData } from "@waldiez/models";

export const WaldiezAgentGroupManager = (props: WaldiezAgentGroupManagerProps) => {
    const { id, flowId, isDarkMode, data, agentConnections, onDataChange } = props;
    const managerData = data as WaldiezNodeAgentGroupManagerData;
    const defaultSpeakerSelectionMethodContent =
        managerData.speakers?.selectionCustomMethod && managerData.speakers?.selectionCustomMethod.length > 1
            ? managerData.speakers.selectionCustomMethod
            : DEFAULT_CUSTOM_SPEAKER_SELECTION_CONTENT;
    return (
        <div className="agent-panel agent-groupManager-panel margin-bottom-10">
            <TabItems activeTabIndex={0}>
                <TabItem id={`wf-${flowId}-agent-groupManager-${id}-config`} label="Config">
                    <GroupManagerConfig id={id} data={managerData} onDataChange={onDataChange} />
                </TabItem>
                <TabItem id={`wf-${flowId}-agent-groupManager-${id}-speakers`} label="Speakers">
                    <GroupManagerSpeakers
                        id={id}
                        data={managerData}
                        isDarkMode={isDarkMode}
                        agentConnections={agentConnections}
                        defaultSpeakerSelectionMethodContent={defaultSpeakerSelectionMethodContent}
                        onDataChange={onDataChange}
                    />
                </TabItem>
            </TabItems>
        </div>
    );
};

export const DEFAULT_CUSTOM_SPEAKER_SELECTION_CONTENT = `"""Custom speaker selection function."""
# provide the function to select the next speaker in the group chat
# complete the \`custom_speaker_selection\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the next speaker.
# example:
# def custom_speaker_selection(last_speaker, groupchat):
#    # type: (Agent, GroupChat) -> Agent | str | None
#    return groupchat.agents[0]
#
def custom_speaker_selection(last_speaker, groupchat):
    """Complete the custom speaker selection function"""
    ...
`;
