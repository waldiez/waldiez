/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useEffect, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import {
    WaldiezAgentRagUserAdvanced,
    WaldiezAgentRagUserCustomFunctions,
    WaldiezAgentRagUserRetrieveConfig,
    WaldiezAgentRagUserTextSplit,
    WaldiezAgentRagUserVectorDb,
} from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs";
import { WaldiezAgentRagUserProps } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/types";

/**
 * Component for configuring RAG User settings
 * Provides tabs for retrieve config, text splitting, vector DB, custom functions, and advanced settings
 */
export const WaldiezAgentRagUser = memo((props: WaldiezAgentRagUserProps) => {
    const {
        id,
        data,
        flowId,
        isDarkMode,
        isModalOpen,
        onDataChange,
        filesToUpload,
        onFilesToUploadChange,
        uploadsEnabled,
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
                    <WaldiezAgentRagUserTextSplit id={id} data={data} onDataChange={onDataChange} />
                </TabItem>

                {/* Vector DB Config Tab */}
                <TabItem label="Vector DB Config" id={`wf-${flowId}-wa-${id}-rag-vectorDb`}>
                    <WaldiezAgentRagUserVectorDb id={id} data={data} onDataChange={onDataChange} />
                </TabItem>

                {/* Custom Functions Tab */}
                <TabItem label="Custom Functions" id={`wf-${flowId}-wa-${id}-rag-customFunctions`}>
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
                    <WaldiezAgentRagUserAdvanced id={id} data={data} onDataChange={onDataChange} />
                </TabItem>
            </TabItems>
        </div>
    );
});

WaldiezAgentRagUser.displayName = "WaldiezAgentRagUser";
