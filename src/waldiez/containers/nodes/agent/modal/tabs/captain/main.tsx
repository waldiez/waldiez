/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { Collapsible, DropZone, InfoCheckbox, NumberInput } from "@waldiez/components";
import { useWaldiezAgentCaptain } from "@waldiez/containers/nodes/agent/modal/tabs/captain/hooks";
import { WaldiezAgentCaptainTabProps } from "@waldiez/containers/nodes/agent/modal/tabs/captain/types";

/**
 * Links to example resources
 */
const EXAMPLE_LIB_LINK = "https://github.com/ag2ai/ag2/blob/main/notebook/agent_library_example.json";
const TOOLS_LINK = "https://github.com/ag2ai/ag2/tree/main/autogen/agentchat/contrib/captainagent/tools";

/**
 * Component for configuring Waldiez Captain Agent settings
 * Handles agent library, tool library, and max round settings
 */
export const WaldiezAgentCaptainTab = memo((props: WaldiezAgentCaptainTabProps) => {
    const { id, data, flowId } = props;

    const {
        agentLib,
        enableAgentLib,
        onEnableAgentLibChange,
        onFileUpload,
        onToolLibChange,
        onMaxRoundChange,
    } = useWaldiezAgentCaptain(props);

    return (
        <div className="agent-panel agent-codeExecution-panel margin-top--10">
            {/* Max Round Setting */}
            <NumberInput
                label="Max Round"
                labelInfo="The maximum number of conversation rounds to be used in the generated groupchat."
                value={data.maxRound}
                onChange={onMaxRoundChange}
                dataTestId={`agent-captain-max-round-${id}`}
                min={1}
                max={100}
                aria-label="Maximum rounds"
            />

            {/* Tool Library Toggle */}
            <InfoCheckbox
                dataTestId={`tool-lib-${id}`}
                label="Include tool lib"
                info="If enabled, the agents will be equipped with several tools"
                checked={data.toolLib === "default"}
                onChange={onToolLibChange}
                aria-label="Include tool library"
            />

            {/* Tool Library Link */}
            <div className="margin-bottom-10">
                If selected, you can find the available tools{" "}
                <a
                    href={TOOLS_LINK}
                    target="_blank"
                    rel="noreferrer nofollow noopener"
                    aria-label="View available tools on GitHub"
                >
                    here
                </a>
            </div>

            {/* Agent Library Toggle */}
            <InfoCheckbox
                label="Include agent lib"
                info="If enabled, the captain agent will generate agents from a dedicated agents library"
                checked={enableAgentLib}
                onChange={onEnableAgentLibChange}
                dataTestId={`agent-captain-toggle-agent-lib-${id}`}
                aria-label="Include agent library"
            />

            {/* Agent Library Link */}
            <div className="margin-bottom-10">
                You can find an example of agents library{" "}
                <a
                    href={EXAMPLE_LIB_LINK}
                    target="_blank"
                    rel="noreferrer nofollow noopener"
                    aria-label="View example agent library on GitHub"
                >
                    here
                </a>
            </div>

            {/* Agent Library Upload and Preview */}
            {enableAgentLib && (
                <div className="agent-lib-container">
                    <DropZone
                        flowId={flowId}
                        allowedFileExtensions={[".json"]}
                        onUpload={onFileUpload}
                        aria-label="Upload agent library JSON file"
                    />

                    {agentLib.length > 0 && (
                        <div className="margin-top-10">
                            <Collapsible
                                title={`Agent Library (${agentLib.length} entries)`}
                                dataTestId={`agent-lib-${id}`}
                                expanded={false}
                                fullWidth
                                aria-label="Agent library entries"
                            >
                                <div
                                    className="agent-lib-preview"
                                    style={{
                                        maxHeight: "300px",
                                        overflowY: "auto",
                                    }}
                                >
                                    <pre>{JSON.stringify(agentLib, null, 2)}</pre>
                                </div>
                            </Collapsible>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

WaldiezAgentCaptainTab.displayName = "WaldiezAgentCaptainTab";
