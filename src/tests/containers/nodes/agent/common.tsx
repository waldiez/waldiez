/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Edge, Node, ReactFlowProvider } from "@xyflow/react";

import { HotkeysProvider } from "react-hotkeys-hook";

import { WaldiezNodeAgentView } from "@waldiez/containers/nodes/agent";
import { SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezNodeAgentType } from "@waldiez/models";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import {
    agentId,
    createdAt,
    flowId,
    getAgentNode,
    getGroupMembers,
    getGroupNodes,
    getModelNodes,
    getNestedChats,
    getSkillNodes,
    updatedAt,
} from "./data";

/* eslint-disable max-statements */
export const renderAgent = (
    type: WaldiezNodeAgentType,
    options: {
        openModal?: boolean;
        nodeOverrides?: Partial<Node>;
        dataOverrides?: { [key: string]: any };
        includeModels?: boolean;
        includeSkills?: boolean;
        includeGroups?: boolean;
        includeNestedChats?: boolean;
        includeGroupMembers?: boolean;
    } = {
        openModal: false,
        nodeOverrides: {},
        dataOverrides: {},
        includeModels: false,
        includeSkills: false,
        includeGroups: false,
        includeNestedChats: false,
        includeGroupMembers: false,
    },
    uploadsHandler: ((files: File[]) => Promise<string[]>) | null = null,
) => {
    const {
        openModal,
        nodeOverrides,
        dataOverrides,
        includeModels,
        includeSkills,
        includeGroups,
        includeNestedChats,
        includeGroupMembers,
    } = options;
    const agentNode = getAgentNode(type, nodeOverrides, dataOverrides);
    const nodeData = {
        ...agentNode.data,
        agentType: type as any,
        ...dataOverrides,
    };
    const flowNodes = [{ ...agentNode, ...nodeOverrides, data: nodeData }] as Node[];
    const flowEdges: Edge[] = [];
    if (includeModels) {
        flowNodes.push(...getModelNodes());
    }
    if (includeSkills) {
        flowNodes.push(...getSkillNodes());
    }
    if (includeGroups) {
        flowNodes.push(...getGroupNodes());
    }
    if (includeNestedChats) {
        const { nodes, edges } = getNestedChats();
        flowNodes.push(...nodes);
        flowEdges.push(...edges);
    }
    if (includeGroupMembers) {
        const { nodes, edges } = getGroupMembers();
        flowNodes.push(...nodes);
        flowEdges.push(...edges);
    }
    act(() => {
        render(
            <WaldiezThemeProvider>
                <HotkeysProvider initiallyActiveScopes={[flowId]}>
                    <ReactFlowProvider>
                        <SidebarProvider>
                            <WaldiezProvider
                                flowId={flowId}
                                storageId="test-storage"
                                name="flow name"
                                description="flow description"
                                requirements={[]}
                                tags={[]}
                                nodes={flowNodes}
                                edges={flowEdges}
                                createdAt={createdAt}
                                updatedAt={updatedAt}
                                onUpload={uploadsHandler}
                            >
                                <WaldiezNodeAgentView
                                    id={agentId}
                                    type={"agent" as any}
                                    data={{
                                        ...agentNode.data,
                                        agentType: type as any,
                                        ...(dataOverrides as any),
                                    }}
                                    dragging={false}
                                    zIndex={1}
                                    isConnectable={true}
                                    positionAbsoluteX={0}
                                    positionAbsoluteY={0}
                                    selectable
                                    selected={false}
                                    draggable
                                    deletable
                                    {...nodeOverrides}
                                />
                            </WaldiezProvider>
                        </SidebarProvider>
                    </ReactFlowProvider>
                </HotkeysProvider>
            </WaldiezThemeProvider>,
        );
    });
    const agentElement = screen.getByTestId(`agent-node-${agentId}-view`);
    expect(agentElement).toBeInTheDocument();
    if (openModal) {
        const editButton = screen.getByTestId(`open-agent-node-modal-${agentId}`);
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    }
};

export const submitAgentChanges = () => {
    const submitButton = screen.getByTestId(`submit-agent-data-${agentId}`);
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);
};
