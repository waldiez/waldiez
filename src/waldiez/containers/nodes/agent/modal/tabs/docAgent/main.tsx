/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent, memo, useCallback } from "react";

import { InfoCheckbox, TextInput } from "@waldiez/components";
import type { WaldiezNodeAgentData, WaldiezNodeAgentDocAgentData } from "@waldiez/models/types";

type WaldiezDocAgentTabProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentDocAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
};

export const WaldiezDocAgentTab = memo((props: WaldiezDocAgentTabProps) => {
    const { id, flowId, data, onDataChange } = props;
    const onCollectionNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
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
        (e: ChangeEvent<HTMLInputElement>) => {
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

// eslint-disable-next-line max-statements
const getPlatform = (): string => {
    try {
        if (
            "userAgentData" in navigator &&
            navigator.userAgentData &&
            // @ts-expect-error userAgentData is not defined in all browsers
            "platform" in navigator.userAgentData &&
            typeof navigator.userAgentData.platform === "string"
        ) {
            return navigator.userAgentData.platform.toLowerCase().replace(/\s/g, "");
        }

        // Fallback to deprecated navigator.platform
        // noinspection JSDeprecatedSymbols
        if (navigator.platform) {
            // noinspection JSDeprecatedSymbols
            return navigator.platform.toLowerCase().replace(/\s/g, "");
        }

        // Ultimate fallback - parse user agent string
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("mac")) {
            return "macos";
        }
        if (userAgent.includes("win")) {
            return "windows";
        }
        if (userAgent.includes("linux")) {
            return "linux";
        }
        if (userAgent.includes("android")) {
            return "android";
        }
        if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
            return "ios";
        }

        return "unknown";
    } catch {
        return "unknown";
    }
};

const getHelpInstructions = () => {
    const platform = getPlatform();
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
                    <strong>Example:</strong> /Users/you/Documents/MyProject
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
                    <strong>Example:</strong> C:\Users\you\Documents\MyProject
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
                    <strong>Example:</strong> /home/you/Documents/MyProject
                </p>
            </div>
        );
    }
};
