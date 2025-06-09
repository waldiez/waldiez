/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useEffect, useMemo, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic";
import { WaldiezAgentCaptainTab } from "@waldiez/containers/nodes/agent/modal/tabs/captain";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentGroupMember } from "@waldiez/containers/nodes/agent/modal/tabs/groupMember";
import { WaldiezAgentModels } from "@waldiez/containers/nodes/agent/modal/tabs/models";
import {
    WaldiezAgentGroupNestedChatTabs,
    WaldiezAgentNestedChats,
} from "@waldiez/containers/nodes/agent/modal/tabs/nested";
import { WaldiezAgentRagUserTabs } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser";
import { WaldiezAgentReasoning } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning";
import { WaldiezAgentTermination } from "@waldiez/containers/nodes/agent/modal/tabs/termination";
import { WaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools";
import { WaldiezNodeAgentModalTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/types";
import { WaldiezAgentUserTabs } from "@waldiez/containers/nodes/agent/modal/tabs/user";
import {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentCaptainData,
    WaldiezNodeAgentData,
    WaldiezNodeAgentRagUserData,
    WaldiezNodeAgentReasoningData,
    WaldiezNodeModel,
    WaldiezNodeTool,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Component for rendering the tab interface in Waldiez Node Agent Modal
 * Displays different tabs based on agent type and connections
 */
export const WaldiezNodeAgentModalTabs = memo(
    ({
        id,
        data,
        flowId,
        isModalOpen,
        isDarkMode,
        filesToUpload,
        onDataChange,
        onAgentTypeChange,
        onFilesToUploadChange,
    }: WaldiezNodeAgentModalTabsProps) => {
        // Get data from store
        const getAgentConnections = useWaldiez(s => s.getAgentConnections);
        const getAgents = useWaldiez(s => s.getAgents);
        const getModels = useWaldiez(s => s.getModels);
        const getTools = useWaldiez(s => s.getTools);
        const getEdges = useWaldiez(s => s.getEdges);
        const uploadHandler = useWaldiez(s => s.onUpload);

        // Track active tab index
        const [activeTabIndex, setActiveTabIndex] = useState(0);

        /**
         * Reset active tab when modal opens/closes
         */
        useEffect(() => {
            setActiveTabIndex(0);
        }, [isModalOpen]);

        // Compute agent type flags
        const agentTypeInfo = useMemo(
            () => ({
                isManager: data.agentType === "group_manager",
                isGroupMember: data.agentType !== "group_manager" && !!data.parentId,
                isRagUser: data.agentType === "rag_user_proxy",
                isReasoning: data.agentType === "reasoning",
                isCaptain: data.agentType === "captain",
            }),
            [data.agentType, data.parentId],
        );

        // Extract agent type flags for readability
        const { isManager, isGroupMember, isRagUser, isReasoning, isCaptain } = agentTypeInfo;

        // Compute derived data
        // eslint-disable-next-line max-statements
        const derivedData = useMemo(() => {
            // Get necessary data from store
            const agentConnections = getAgentConnections(id);
            const models = getModels() as WaldiezNodeModel[];
            const agents = getAgents() as WaldiezNodeAgent[];
            const tools = getTools() as WaldiezNodeTool[];
            const edges = getEdges() as WaldiezEdge[];

            // Filter agents that are group managers
            const groupManagers = agents.filter(agent => agent.data.agentType === "group_manager");

            // Calculate connection counts
            const connectionsCount =
                agentConnections.targets.edges.length + agentConnections.sources.edges.length;

            // Determine if nested chats tab should be shown
            const showNestedChatsTab = !isGroupMember && connectionsCount > 0;

            // Handle group member specific logic
            let showGroupNestedChatTab = false;
            let groupMembers: WaldiezNodeAgent[] = [];
            let connectionsOutsideGroup: WaldiezEdge[] = [];

            if (isGroupMember) {
                // Find members of the same group
                groupMembers = agents.filter(agent => agent.data.parentId === data.parentId);

                // Find connections outside the group
                connectionsOutsideGroup = agentConnections.targets.edges.filter(
                    edge => groupMembers.findIndex(member => member.id === edge.target) === -1,
                );

                // Show nested chat tab if there are connections outside the group
                showGroupNestedChatTab = connectionsOutsideGroup.length > 0;
            }

            // Check if uploads are enabled
            const uploadsEnabled = !!uploadHandler;

            return {
                agentConnections,
                models,
                agents,
                edges,
                tools,
                groupManagers,
                showNestedChatsTab,
                showGroupNestedChatTab,
                groupMembers,
                connectionsOutsideGroup,
                uploadsEnabled,
            };
        }, [
            getAgentConnections,
            getModels,
            getAgents,
            getEdges,
            getTools,
            id,
            isGroupMember,
            data.parentId,
            uploadHandler,
        ]);

        // Extract derived data for readability
        const {
            agentConnections,
            models,
            agents,
            edges,
            tools,
            groupManagers,
            showNestedChatsTab,
            showGroupNestedChatTab,
            connectionsOutsideGroup,
            uploadsEnabled,
        } = derivedData;

        if (isRagUser) {
            return (
                <WaldiezAgentRagUserTabs
                    id={id}
                    flowId={flowId}
                    isDarkMode={isDarkMode}
                    isModalOpen={isModalOpen}
                    models={models}
                    uploadsEnabled={uploadsEnabled}
                    data={data as WaldiezNodeAgentRagUserData}
                    onDataChange={onDataChange}
                    filesToUpload={filesToUpload}
                    onFilesToUploadChange={onFilesToUploadChange}
                />
            );
        }
        if (data.agentType === "user_proxy") {
            return (
                <WaldiezAgentUserTabs
                    id={id}
                    flowId={flowId}
                    isDarkMode={isDarkMode}
                    isModalOpen={isModalOpen}
                    data={data as WaldiezNodeAgentData}
                    tools={tools}
                    showNestedChatsTab={showNestedChatsTab}
                    agentConnections={agentConnections}
                    onDataChange={onDataChange}
                />
            );
        }

        return (
            <TabItems activeTabIndex={activeTabIndex}>
                {/* Basic Tab - Always visible */}
                <TabItem label="Agent" id={`wf-${flowId}-wa-${id}-basic`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentBasic
                            id={id}
                            data={data}
                            onDataChange={onDataChange}
                            onAgentTypeChange={onAgentTypeChange}
                        />
                    </div>
                </TabItem>

                {/* Reasoning Tab - Only for reasoning agents */}
                {isReasoning && (
                    <TabItem label="Reasoning" id={`wf-${flowId}-wa-${id}-reasoning`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentReasoning
                                id={id}
                                data={data as WaldiezNodeAgentReasoningData}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                )}

                {/* Captain Tab - Only visible for captain agents */}
                {isCaptain && (
                    <TabItem label="Captain" id={`wf-${flowId}-wa-${id}-captain`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentCaptainTab
                                id={id}
                                flowId={flowId}
                                data={data as WaldiezNodeAgentCaptainData}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                )}

                {/* Termination Tab - Always visible */}
                <TabItem label="Termination" id={`wf-${flowId}-wa-${id}-termination`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentTermination id={id} data={data} onDataChange={onDataChange} />
                    </div>
                </TabItem>

                {/* Code Execution Tab - Always visible */}
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

                {/* Models Tab - Always visible */}
                <TabItem label="Models" id={`wf-${flowId}-wa-${id}-models`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentModels id={id} data={data} models={models} onDataChange={onDataChange} />
                    </div>
                </TabItem>

                {/* Tools Tab - Always visible */}
                <TabItem label="Tools" id={`wf-${flowId}-wa-${id}-tools`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentTools
                            id={id}
                            data={data}
                            agents={agents}
                            tools={tools}
                            skipExecutor={isGroupMember}
                            onDataChange={onDataChange}
                        />
                    </div>
                </TabItem>

                {/* Nested Chat Tab - Only visible if agent has connections and is not a group member */}
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

                {/* Group Nested Chat Tab - Only visible for group members with outside connections */}
                {isGroupMember && showGroupNestedChatTab && (
                    <TabItem label="Nested chat" id={`wf-${flowId}-wa-${id}-group-nested`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentGroupNestedChatTabs
                                id={id}
                                flowId={flowId}
                                darkMode={isDarkMode}
                                data={data as WaldiezNodeAgentData}
                                agentConnections={agentConnections}
                                edges={connectionsOutsideGroup}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                )}

                {/* Group Tab - Only visible for non-managers when there are group managers */}
                {!isManager && groupManagers.length > 0 && (
                    <TabItem id={`wf-${flowId}-wa-${id}-group`} label="Group">
                        <div className="modal-tab-body">
                            <WaldiezAgentGroupMember
                                id={id}
                                data={data}
                                agents={agents}
                                edges={edges}
                                darkMode={isDarkMode}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                )}
            </TabItems>
        );
    },
);

WaldiezNodeAgentModalTabs.displayName = "WaldiezNodeAgentModalTabs";
