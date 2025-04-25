/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { TabItem, TabItems } from "@waldiez/components";
import {
    WaldiezAgentRagUserAdvanced,
    WaldiezAgentRagUserCustomFunctions,
    WaldiezAgentRagUserRetrieveConfig,
    WaldiezAgentRagUserTextSplit,
    WaldiezAgentRagUserVectorDb,
} from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs";
import { WaldiezAgentRagUserProps } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/types";

export const WaldiezAgentRagUser = (props: WaldiezAgentRagUserProps) => {
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
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);
    return (
        <div className="agent-panel agent-ragUser-panel margin-bottom-10">
            <TabItems activeTabIndex={activeTabIndex}>
                <TabItem label="Retrieve Config" id={`wf-${flowId}-agent-ragUser-${id}-retrieveConfig`}>
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
                <TabItem label="Text splitting" id={`wf-${flowId}-agent-ragUser-${id}-textSplit`}>
                    <WaldiezAgentRagUserTextSplit id={id} data={data} onDataChange={onDataChange} />
                </TabItem>
                <TabItem label="Vector DB Config" id={`wf-${flowId}-agent-ragUser-${id}-vectorDb`}>
                    <WaldiezAgentRagUserVectorDb id={id} data={data} onDataChange={onDataChange} />
                </TabItem>
                <TabItem label="Custom Functions" id={`wf-${flowId}-agent-ragUser-${id}-customFunctions`}>
                    <WaldiezAgentRagUserCustomFunctions
                        id={id}
                        flowId={flowId}
                        data={data}
                        isDarkMode={isDarkMode}
                        onDataChange={onDataChange}
                    />
                </TabItem>
                <TabItem label="Advanced" id={`wf-${flowId}-agent-ragUser-${id}-advanced`}>
                    <WaldiezAgentRagUserAdvanced id={id} data={data} onDataChange={onDataChange} />
                </TabItem>
            </TabItems>
        </div>
    );
};
