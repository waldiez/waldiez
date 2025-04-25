/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { agentNodes, createdAt, edges, flowId, nodes, updatedAt, userInput } from "../data";
import { render } from "@testing-library/react";

import { ReactFlowProvider } from "@xyflow/react";

import { useState } from "react";
import { HotkeysProvider } from "react-hotkeys-hook";

import { WaldiezFlowView } from "@waldiez/containers/flow";
import { SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

const onRun = vi.fn();
export const onChange = vi.fn();

export const renderFlow = (
    includeUserInput: boolean = false,
    singleAgent: boolean = false,
    noAgents: boolean = false,
) => {
    const nodesToUse = noAgents ? [] : singleAgent ? [agentNodes[0]] : nodes;
    const edgesToUse = singleAgent ? [] : edges;
    const Wrapper = () => {
        const [isUserInputModalOpen, setIsUserInputModalOpen] = useState<boolean>(includeUserInput);
        const onUserInput = (_: string) => {
            setIsUserInputModalOpen(false);
        };
        return (
            <WaldiezThemeProvider>
                <HotkeysProvider initiallyActiveScopes={[flowId]}>
                    <ReactFlowProvider>
                        <SidebarProvider>
                            <WaldiezProvider
                                flowId={flowId}
                                storageId={flowId}
                                name="Test Flow"
                                description="Test Description"
                                requirements={["Test Requirement"]}
                                tags={["Test Tag"]}
                                nodes={nodesToUse}
                                edges={edgesToUse}
                                viewport={{ zoom: 1, x: 50, y: 50 }}
                                createdAt={createdAt}
                                updatedAt={updatedAt}
                                onChange={onChange}
                                onRun={onRun}
                            >
                                <WaldiezFlowView
                                    flowId={flowId}
                                    onUserInput={onUserInput}
                                    inputPrompt={includeUserInput && isUserInputModalOpen ? userInput : null}
                                />
                            </WaldiezProvider>
                        </SidebarProvider>
                    </ReactFlowProvider>
                </HotkeysProvider>
            </WaldiezThemeProvider>
        );
    };
    render(<Wrapper />);
};
