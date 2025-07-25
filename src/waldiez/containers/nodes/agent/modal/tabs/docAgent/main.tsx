/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback } from "react";

import { InfoCheckbox, TextInput } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeAgentDocAgentData } from "@waldiez/models";

type WaldiezDocAgentTabProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentDocAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
};

export const WaldiezDocAgentTab = memo((props: WaldiezDocAgentTabProps) => {
    const { id, flowId, data, onDataChange } = props;
    const onCollectionNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ collectionName: e.target.value });
        },
        [onDataChange],
    );
    const onResetCollectionChange = useCallback(
        (reset: boolean) => {
            onDataChange({ resetCollection: reset });
        },
        [onDataChange],
    );
    const onEnableQueryCitationsChange = useCallback(
        (enable: boolean) => {
            onDataChange({
                queryEngine: {
                    type: data.queryEngine?.type || "VectorChromaQueryEngine",
                    dbPath: data.queryEngine?.dbPath || null,
                    citationChunkSize: data.queryEngine?.citationChunkSize || 512,
                    enableQueryCitations: enable,
                },
            });
        },
        [data.queryEngine, onDataChange],
    );
    const onDbPathChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            let newValue = e.target.value || null;
            if (newValue?.trim() === "") {
                newValue = null;
            }
            onDataChange({
                queryEngine: {
                    type: data.queryEngine?.type || "VectorChromaQueryEngine",
                    enableQueryCitations: data.queryEngine?.enableQueryCitations || false,
                    citationChunkSize: data.queryEngine?.citationChunkSize || 512,
                    dbPath: newValue,
                },
            });
        },
        [data.queryEngine, onDataChange],
    );
    return (
        <div className="agent-panel">
            <TextInput
                label="Collection Name:"
                name="doc-agent-collection-name"
                dataTestId={`input-id-wf-${flowId}-wa-${id}-collection-name`}
                value={data.collectionName}
                onChange={onCollectionNameChange}
                placeholder="Enter collection name"
                className="margin-top-5"
            />
            <div className="margin-top-10">
                <InfoCheckbox
                    label="Reset Collection"
                    info="If enabled, the collection will be reset before adding new documents."
                    id={`checkbox-id-wf-${flowId}-wa-${id}-reset-collection`}
                    checked={data.resetCollection}
                    onChange={onResetCollectionChange}
                />
            </div>
            <div className="margin-top-10">
                <InfoCheckbox
                    label="Enable Query Citations"
                    info="If enabled, citations will be included in query results."
                    id={`checkbox-id-wf-${flowId}-wa-${id}-enable-query-citations`}
                    checked={data.queryEngine?.enableQueryCitations || false}
                    onChange={onEnableQueryCitationsChange}
                />
            </div>
            <div className="margin-top-10">
                <TextInput
                    label="Database Path:"
                    name="doc-agent-db-path"
                    dataTestId={`input-id-wf-${flowId}-wa-${id}-db-path`}
                    value={data.queryEngine?.dbPath || ""}
                    onChange={onDbPathChange}
                    placeholder="Enter database path"
                    labelInfo={getHelpInstructions()}
                />
            </div>
        </div>
    );
});

const getHelpInstructions = () => {
    const platform = navigator.platform.toLowerCase();
    const isMac = platform.includes("mac");
    const isWindows = platform.includes("win");

    if (isMac) {
        return (
            <div className="help-instructions">
                <h4>How to find folder path on Mac:</h4>
                <ol>
                    <li>Open Finder and navigate to your folder</li>
                    <li>Right-click the folder and select "Get Info"</li>
                    <li>Copy the path from "Where:" field</li>
                    <li>Or drag the folder into Terminal to see its path</li>
                </ol>
                <p>
                    <strong>Example:</strong> /Users/yourname/Documents/MyProject
                </p>
            </div>
        );
    } else if (isWindows) {
        return (
            <div className="help-instructions">
                <h4>How to find folder path on Windows:</h4>
                <ol>
                    <li>Open File Explorer and navigate to your folder</li>
                    <li>Click on the address bar (or press Ctrl+L)</li>
                    <li>The full path will be shown - copy it</li>
                    <li>Or right-click folder → Properties → Location</li>
                </ol>
                <p>
                    <strong>Example:</strong> C:\Users\yourname\Documents\MyProject
                </p>
            </div>
        );
    } else {
        return (
            <div className="help-instructions">
                <h4>How to find folder path:</h4>
                <ol>
                    <li>Open your file manager</li>
                    <li>Navigate to the folder you want</li>
                    <li>Look for the path in the address bar</li>
                    <li>Or right-click and check properties</li>
                </ol>
                <p>
                    <strong>Example:</strong> /home/yourname/Documents/MyProject
                </p>
            </div>
        );
    }
};
