/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render } from "@testing-library/react";

import { ReactFlowProvider } from "@xyflow/react";

import { HotkeysProvider } from "react-hotkeys-hook";

import { WaldiezFlowView } from "@waldiez/containers/flow";
import { SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, edges, flowId, nodes, updatedAt } from "./data";

export const onRun = vi.fn();
export const onChange = vi.fn();
export const onConvert = vi.fn();
export const onSave = vi.fn();

// noinspection JSUnusedGlobalSymbols
export const assistantDataTransfer = {
    setData: vi.fn(),
    getData: (key: string) => {
        if (key === "application/node") {
            return "agent";
        }
        return "assistant";
    },
};
// noinspection JSUnusedGlobalSymbols
export const userDataTransfer = {
    setData: vi.fn(),
    getData: (key: string) => {
        if (key === "application/node") {
            return "agent";
        }
        return "user_proxy";
    },
};
// noinspection JSUnusedGlobalSymbols
export const reasoningDataTransfer = {
    setData: vi.fn(),
    getData: (key: string) => {
        if (key === "application/node") {
            return "agent";
        }
        return "reasoning";
    },
};
// noinspection JSUnusedGlobalSymbols
export const captainDataTransfer = {
    setData: vi.fn(),
    getData: (key: string) => {
        if (key === "application/node") {
            return "agent";
        }
        return "captain";
    },
};

export const renderFlow = async (
    options: {
        withLinkedModels?: boolean;
        withLinkedTools?: boolean;
    } = {
        withLinkedModels: false,
        withLinkedTools: false,
    },
) => {
    // const container = document.createElement("div");
    // document.body.appendChild(container);
    // const root = createRoot(container);
    const { withLinkedModels, withLinkedTools } = options;
    let nodesToUse = [...nodes];
    if (withLinkedModels) {
        nodesToUse = nodes.map(node => {
            if (node.type !== "agent") {
                return node;
            }
            if (withLinkedTools) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        modelIds: ["model-0"],
                        tools: [{ id: "tool-0", executorId: "agent-0" }],
                    },
                };
            }
            return {
                ...node,
                data: {
                    ...node.data,
                    modelIds: ["model-0"],
                },
            };
        });
    }
    if (withLinkedTools) {
        nodesToUse = nodes.map(node => {
            if (node.type !== "agent") {
                return node;
            }
            if (withLinkedModels) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        modelIds: ["model-0"],
                        tools: [{ id: "tool-0", executorId: "agent-0" }],
                    },
                };
            }
            return {
                ...node,
                data: {
                    ...node.data,
                    tools: [{ id: "tool-0", executorId: "agent-0" }],
                },
            };
        });
    }
    render(
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
                            edges={edges}
                            viewport={{ zoom: 1, x: 50, y: 50 }}
                            createdAt={createdAt}
                            updatedAt={updatedAt}
                            onChange={onChange}
                            onRun={onRun}
                            onConvert={onConvert}
                            onSave={onSave}
                        >
                            <WaldiezFlowView flowId={flowId} />
                        </WaldiezProvider>
                    </SidebarProvider>
                </ReactFlowProvider>
            </HotkeysProvider>
        </WaldiezThemeProvider>,
    );
};
