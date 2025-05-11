/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic";
import { WaldiezAgentCaptainTab } from "@waldiez/containers/nodes/agent/modal/tabs/captain";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentGroup } from "@waldiez/containers/nodes/agent/modal/tabs/group";
import { WaldiezAgentModels } from "@waldiez/containers/nodes/agent/modal/tabs/model";
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

export const WaldiezNodeAgentModalTabs = ({
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
    const isManager = dataProp.agentType === "group_manager";
    const isGroupMember = dataProp.agentType !== "group_manager" && !!dataProp.parentId;
    const isRagUser = dataProp.agentType === "rag_user_proxy";
    const isReasoning = dataProp.agentType === "reasoning";
    const isCaptain = dataProp.agentType === "captain";
    const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const getAgents = useWaldiez(s => s.getAgents);
    const getModels = useWaldiez(s => s.getModels);
    const getTools = useWaldiez(s => s.getTools);
    // const getEdges = useWaldiez(s => s.getEdges);
    const uploadHandler = useWaldiez(s => s.onUpload);
    const agentConnections = getAgentConnections(id);
    const models = getModels() as WaldiezNodeModel[];
    const agents = getAgents() as WaldiezNodeAgent[];
    const tools = getTools() as WaldiezNodeTool[];
    // const edges = getEdges() as WaldiezEdge[];
    const groupManagers = agents.filter(agent => agent.data.agentType === "group_manager");
    const connectionsCount = agentConnections.targets.edges.length + agentConnections.sources.edges.length;
    const showNestedChatsTab = !isGroupMember && connectionsCount > 0;
    let showGroupNestedChatTab = false;
    let groupMembers: WaldiezNodeAgent[] = [];
    let connectionsOutsideGroup: WaldiezEdge[] = [];
    if (isGroupMember) {
        groupMembers = agents.filter(agent => agent.data.parentId === dataProp.parentId);
        // check if the member has connections (targets) outside the group
        connectionsOutsideGroup = agentConnections.targets.edges.filter(
            edge => groupMembers.findIndex(member => member.id === edge.target) === -1,
        );
        showGroupNestedChatTab = connectionsOutsideGroup.length > 0;
    }
    const uploadsEnabled = !!uploadHandler;
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);
    const [data, setLocalData] = useState<WaldiezNodeAgentData>(dataProp);
    const onDataChange = (newData: Partial<WaldiezNodeAgentData>) => {
        setLocalData({ ...data, ...newData });
        onDataChangeProp(newData);
    };
    return (
        <TabItems activeTabIndex={activeTabIndex}>
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
            <TabItem label="Termination" id={`wf-${flowId}-wa-${id}-termination`}>
                <div className="modal-tab-body">
                    <WaldiezAgentTermination id={id} data={data} onDataChange={onDataChange} />
                </div>
            </TabItem>
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
            <TabItem label="Model" id={`wf-${flowId}-wa-${id}-model`}>
                <div className="modal-tab-body">
                    <WaldiezAgentModels id={id} data={data} models={models} onDataChange={onDataChange} />
                </div>
            </TabItem>
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
            {!isManager && groupManagers.length > 0 && (
                <TabItem id={`wf-${flowId}-wa-${id}-group`} label="Group">
                    <div className="modal-tab-body">
                        <WaldiezAgentGroup id={id} data={data} agents={agents} onDataChange={onDataChange} />
                    </div>
                </TabItem>
            )}
        </TabItems>
    );
};
