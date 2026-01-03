/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC, memo, useEffect, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution";
import { WaldiezAgentModels } from "@waldiez/containers/nodes/agent/modal/tabs/models";
import { WaldiezAgentNestedChats } from "@waldiez/containers/nodes/agent/modal/tabs/nested";
import {
    WaldiezAgentRagUserAdvanced,
    WaldiezAgentRagUserCustomFunctions,
    WaldiezAgentRagUserRetrieveConfig,
    WaldiezAgentRagUserTextSplit,
    WaldiezAgentRagUserVectorDb,
} from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs";
import type { WaldiezAgentRagUserTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/types";
import { WaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools";

/**
 * Component for configuring RAG User settings
 * Provides tabs for retrieve config, text splitting, vector DB, custom functions, and advanced settings
 */
export const WaldiezAgentRagUserTabs: FC<WaldiezAgentRagUserTabsProps> = memo(
    (props: WaldiezAgentRagUserTabsProps) => {
        const {
            id,
            data,
            agents,
            models,
            tools,
            flowId,
            agentConnections,
            isDarkMode,
            isModalOpen,
            onDataChange,
            filesToUpload,
            onFilesToUploadChange,
            uploadsEnabled,
            showNestedChatsTab,
        } = props;

        // Tab state
        const [activeTabIndex, setActiveTabIndex] = useState(0);

        // Reset active tab when modal opens/closes
        useEffect(() => {
            setActiveTabIndex(0);
        }, [isModalOpen]);

        return (
            <div
                className="agent-panel agent-ragUser-panel margin-bottom-10"
                data-testid={`agent-rag-user-panel-${id}`}
            >
                <TabItems activeTabIndex={activeTabIndex}>
                    {/* Model Tab */}
                    <TabItem label="Model" id={`wf-${flowId}-wa-${id}-models`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentModels
                                id={id}
                                data={data}
                                models={models}
                                onDataChange={onDataChange}
                            />
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
                    <TabItem label="Tools" id={`wf-${flowId}-wa-${id}-tools`}>
                        <div className="modal-tab-body">
                            <WaldiezAgentTools
                                id={id}
                                data={data}
                                agents={agents}
                                tools={tools}
                                skipExecutor={false}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                    {showNestedChatsTab && (
                        <TabItem label="Nested chat" id={`wf-${flowId}-wa-${id}-nested`}>
                            <div className="modal-tab-body">
                                <WaldiezAgentNestedChats
                                    id={id}
                                    data={data}
                                    onDataChange={onDataChange}
                                    agentConnections={agentConnections}
                                />
                            </div>
                        </TabItem>
                    )}
                    <TabItem label="RAG" id={`wf-${flowId}-wa-${id}-rag`}>
                        <TabItems activeTabIndex={0}>
                            {/* Retrieve Config Tab */}
                            <TabItem label="Retrieve Config" id={`wf-${flowId}-wa-${id}-rag-retrieveConfig`}>
                                <WaldiezAgentRagUserRetrieveConfig
                                    id={id}
                                    flowId={flowId}
                                    data={data}
                                    onDataChange={onDataChange}
                                    uploadsEnabled={uploadsEnabled}
                                    filesToUpload={filesToUpload}
                                    onFilesToUploadChange={onFilesToUploadChange}
                                />
                            </TabItem>

                            {/* Text Splitting Tab */}
                            <TabItem label="Text splitting" id={`wf-${flowId}-wa-${id}-rag-textSplit`}>
                                <WaldiezAgentRagUserTextSplit
                                    id={id}
                                    data={data}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>

                            {/* Vector DB Config Tab */}
                            <TabItem label="Vector DB Config" id={`wf-${flowId}-wa-${id}-rag-vectorDb`}>
                                <WaldiezAgentRagUserVectorDb
                                    id={id}
                                    data={data}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>

                            {/* Custom Functions Tab */}
                            <TabItem
                                label="Custom Functions"
                                id={`wf-${flowId}-wa-${id}-rag-customFunctions`}
                            >
                                <WaldiezAgentRagUserCustomFunctions
                                    id={id}
                                    flowId={flowId}
                                    data={data}
                                    isDarkMode={isDarkMode}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>

                            {/* Advanced Tab */}
                            <TabItem label="Advanced" id={`wf-${flowId}-wa-${id}-rag-advanced`}>
                                <WaldiezAgentRagUserAdvanced
                                    id={id}
                                    data={data}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>
                        </TabItems>
                    </TabItem>
                </TabItems>
            </div>
        );
    },
);

WaldiezAgentRagUserTabs.displayName = "WaldiezAgentRagUserTabs";
