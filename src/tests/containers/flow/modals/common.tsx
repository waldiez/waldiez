/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render } from "@testing-library/react";

import { ReactFlowProvider } from "@xyflow/react";

import { useState } from "react";
import { HotkeysProvider } from "react-hotkeys-hook";

import { WaldiezFlowView } from "@waldiez/containers/flow";
import { SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";
import { WaldiezPreviousMessage, WaldiezUserInputType } from "@waldiez/types";

import { agentNodes, createdAt, edges, flowId, nodes, updatedAt, userInput } from "../data";

const onRun = vi.fn();
export const onChange = vi.fn();

export const renderFlow = (
    includeUserInput: boolean = false,
    singleAgent: boolean = false,
    noAgents: boolean = false,
    options: {
        onUserInput?: (userInput: WaldiezUserInputType) => void;
        previousMessages?: WaldiezPreviousMessage[];
    } = {
        onUserInput: undefined,
        previousMessages: [],
    },
) => {
    const nodesToUse = noAgents ? [] : singleAgent ? [agentNodes[0]] : nodes;
    const edgesToUse = singleAgent ? [] : edges;
    const Wrapper = () => {
        const [isUserInputModalOpen, setIsUserInputModalOpen] = useState<boolean>(includeUserInput);
        const onUserInputCb = (_: WaldiezUserInputType) => {
            setIsUserInputModalOpen(false);
            if (options.onUserInput) {
                options.onUserInput(_);
            }
        };
        const userInputProp = {
            ...userInput,
            previousMessages: options.previousMessages || [],
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
                                    onUserInput={onUserInputCb}
                                    inputPrompt={
                                        includeUserInput && isUserInputModalOpen ? userInputProp : null
                                    }
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
