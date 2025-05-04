/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentBasic } from "@waldiez/containers/nodes/agent/modal/tabs/basic";
import { WaldiezAgentCaptainTab } from "@waldiez/containers/nodes/agent/modal/tabs/captain";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentModels } from "@waldiez/containers/nodes/agent/modal/tabs/models";
import { WaldiezAgentNestedChats } from "@waldiez/containers/nodes/agent/modal/tabs/nestedChats";
import { WaldiezAgentRagUser } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser";
import { WaldiezAgentReasoning } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning";
import { WaldiezAgentSkills } from "@waldiez/containers/nodes/agent/modal/tabs/skills";
import { WaldiezAgentTermination } from "@waldiez/containers/nodes/agent/modal/tabs/termination";
import { WaldiezNodeAgentModalTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/types";
import {
    WaldiezNodeAgent,
    WaldiezNodeAgentCaptainData,
    WaldiezNodeAgentData,
    WaldiezNodeAgentRagUserData,
    WaldiezNodeAgentReasoningData,
    WaldiezNodeModel,
    WaldiezNodeSkill,
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
    const isRagUser = dataProp.agentType === "rag_user";
    const isReasoning = dataProp.agentType === "reasoning";
    const isCaptain = dataProp.agentType === "captain";
    const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const getAgents = useWaldiez(s => s.getAgents);
    const getModels = useWaldiez(s => s.getModels);
    const getSkills = useWaldiez(s => s.getSkills);
    // const getEdges = useWaldiez(s => s.getEdges);
    const uploadHandler = useWaldiez(s => s.onUpload);
    const agentConnections = getAgentConnections(id);
    const models = getModels() as WaldiezNodeModel[];
    const agents = getAgents() as WaldiezNodeAgent[];
    const skills = getSkills() as WaldiezNodeSkill[];
    // const edges = getEdges() as WaldiezEdge[];
    const connectionsCount = agentConnections.target.edges.length + agentConnections.source.edges.length;
    const showNestedChatsTab = connectionsCount > 0;
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
            <TabItem label="Agent" id={`wf-${flowId}-agent-config-${id}`}>
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
                <TabItem label="Reasoning" id={`wf-${flowId}-agent-reasoning-${id}`}>
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
                <TabItem label="RAG" id={`wf-${flowId}-agent-ragUser-${id}`}>
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
            <TabItem label="Termination" id={`wf-${flowId}-agent-termination-${id}`}>
                <div className="modal-tab-body">
                    <WaldiezAgentTermination id={id} data={data} onDataChange={onDataChange} />
                </div>
            </TabItem>
            <TabItem label="Code Execution" id={`wf-${flowId}-agent-codeExecution-${id}`}>
                <div className="modal-tab-body">
                    <WaldiezAgentCodeExecution
                        id={id}
                        data={data}
                        skills={skills}
                        onDataChange={onDataChange}
                    />
                </div>
            </TabItem>
            <TabItem label="Models" id={`wf-${flowId}-agent-models-${id}`}>
                <div className="modal-tab-body">
                    <WaldiezAgentModels id={id} data={data} models={models} onDataChange={onDataChange} />
                </div>
            </TabItem>
            <TabItem label="Skills" id={`wf-${flowId}-agent-skills-${id}`}>
                <div className="modal-tab-body">
                    <WaldiezAgentSkills
                        id={id}
                        data={data}
                        agents={agents}
                        skills={skills}
                        onDataChange={onDataChange}
                    />
                </div>
            </TabItem>

            {showNestedChatsTab && (
                <TabItem label="Nested chat" id={`wf-${flowId}-agent-nestedChats-${id}`}>
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
            {isCaptain && (
                <TabItem label="Captain" id={`wf-${flowId}-agent-captain-${id}`}>
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
        </TabItems>
    );
};
