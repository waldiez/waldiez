/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic";
import { WaldiezAgentCaptainTab } from "@waldiez/containers/nodes/agent/modal/tabs/captain";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentGroup } from "@waldiez/containers/nodes/agent/modal/tabs/group";
import { WaldiezAgentModel } from "@waldiez/containers/nodes/agent/modal/tabs/model";
import {
    WaldiezAgentGroupNestedChatTabs,
    WaldiezAgentNestedChats,
} from "@waldiez/containers/nodes/agent/modal/tabs/nested";
import { WaldiezAgentRagUser } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser";
import { WaldiezAgentReasoning } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning";
import { WaldiezAgentTermination } from "@waldiez/containers/nodes/agent/modal/tabs/termination";
import { WaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools";
import { WaldiezNodeAgentModalTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/types";
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
        data: dataProp,
        flowId,
        isModalOpen,
        isDarkMode,
        filesToUpload,
        onDataChange: onDataChangeProp,
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

        // Track local state
        const [activeTabIndex, setActiveTabIndex] = useState(0);
        const [data, setLocalData] = useState<WaldiezNodeAgentData>(dataProp);

        /**
         * Reset active tab when modal opens/closes
         */
        useEffect(() => {
            setActiveTabIndex(0);
        }, [isModalOpen]);

        /**
         * Handle data changes and propagate them up
         */
        const onDataChange = useCallback(
            (newData: Partial<WaldiezNodeAgentData>) => {
                setLocalData(prevData => ({ ...prevData, ...newData }));
                onDataChangeProp(newData);
            },
            [onDataChangeProp],
        );

        // Compute agent type flags
        const agentTypeInfo = useMemo(
            () => ({
                isManager: dataProp.agentType === "group_manager",
                isGroupMember: dataProp.agentType !== "group_manager" && !!dataProp.parentId,
                isRagUser: dataProp.agentType === "rag_user_proxy",
                isReasoning: dataProp.agentType === "reasoning",
                isCaptain: dataProp.agentType === "captain",
            }),
            [dataProp.agentType, dataProp.parentId],
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
                groupMembers = agents.filter(agent => agent.data.parentId === dataProp.parentId);

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
            dataProp.parentId,
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

                {/* RAG Tab - Only for RAG user proxy agents */}
                {isRagUser && (
                    <TabItem label="RAG" id={`wf-${flowId}-wa-${id}-rag`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentRagUser
                                id={id}
                                flowId={flowId}
                                isDarkMode={isDarkMode}
                                isModalOpen={isModalOpen}
                                uploadsEnabled={uploadsEnabled}
                                data={data as WaldiezNodeAgentRagUserData}
                                onDataChange={onDataChange}
                                filesToUpload={filesToUpload}
                                onFilesToUploadChange={onFilesToUploadChange}
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

                {/* Model Tab - Always visible */}
                <TabItem label="Model" id={`wf-${flowId}-wa-${id}-model`}>
                    <div className="modal-tab-body">
                        <WaldiezAgentModel id={id} data={data} models={models} onDataChange={onDataChange} />
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

                {/* Group Tab - Only visible for non-managers when there are group managers */}
                {!isManager && groupManagers.length > 0 && (
                    <TabItem id={`wf-${flowId}-wa-${id}-group`} label="Group">
                        <div className="modal-tab-body">
                            <WaldiezAgentGroup
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
