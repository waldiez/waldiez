/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { Edge, EdgeChange, Node, NodeChange, ReactFlowInstance } from "@xyflow/react";

import { WaldiezEdge } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { exportItem, getFlowRoot, showSnackbar } from "@waldiez/utils";

export const useFlowEvents = (flowId: string) => {
    const readOnly = useWaldiez(s => s.isReadOnly);
    const skipImport = useWaldiez(s => s.skipImport);
    const skipExport = useWaldiez(s => s.skipExport);
    const isReadOnly = readOnly === true;
    const runner = useWaldiez(s => s.onRun);
    const onConvert = useWaldiez(s => s.onConvert);
    const setRfInstance = useWaldiez(s => s.setRfInstance);
    const handleNodesChange = useWaldiez(s => s.onNodesChange);
    const handleEdgesChange = useWaldiez(s => s.onEdgesChange);
    const handleEdgeDoubleClick = useWaldiez(s => s.onEdgeDoubleClick);
    const handleNodeDoubleClick = useWaldiez(s => s.onNodeDoubleClick);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const getAgents = useWaldiez(s => s.getAgents);
    const getFlowEdges = useWaldiez(s => s.getFlowEdges);
    const getFlowInfo = useWaldiez(s => s.getFlowInfo);
    const exportFlow = useWaldiez(s => s.exportFlow);
    const onFlowInit = (instance: ReactFlowInstance) => {
        const rootDiv = getFlowRoot(flowId);
        const noINteractivity = isReadOnly || (skipImport === true && skipExport === true);
        if (rootDiv) {
            if (noINteractivity) {
                // lock interactivity by default (can be later toggled back)
                const interactiveControl = rootDiv.querySelector(".react-flow__controls-interactive");
                if (interactiveControl) {
                    (interactiveControl as HTMLButtonElement).click();
                }
                setTimeout(() => {
                    instance.fitView({
                        includeHiddenNodes: false,
                        padding: 0.2,
                        duration: 100,
                    });
                }, 100);
            } else {
                setTimeout(() => {
                    instance.fitView({
                        includeHiddenNodes: false,
                        padding: 0.2,
                        duration: 100,
                        minZoom: instance.getZoom(),
                        maxZoom: instance.getZoom(),
                    });
                }, 1);
            }
        }
        setRfInstance(instance);
    };
    const onNodesChange = (changes: NodeChange<Node>[]) => {
        if (!isReadOnly) {
            handleNodesChange(changes);
        }
        // onFlowChanged();
    };
    const onEdgesChange = (changes: EdgeChange<Edge>[]) => {
        if (!isReadOnly) {
            handleEdgesChange(changes);
            onFlowChanged();
        }
    };
    const onEdgeDoubleClick = (event: React.MouseEvent, edge: Edge) => {
        if (!isReadOnly) {
            handleEdgeDoubleClick(event, edge as WaldiezEdge);
        }
    };
    const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
        if (!isReadOnly) {
            const target = event.target;
            if (target instanceof Element && target.tagName === "TEXTAREA") {
                return;
            }
            handleNodeDoubleClick(event, node);
        }
    };
    const convertToPy = () => {
        if (!isReadOnly) {
            const flow = onFlowChanged();
            onConvert?.(JSON.stringify(flow), "py");
        }
    };
    const convertToIpynb = () => {
        if (!isReadOnly) {
            const flow = onFlowChanged();
            onConvert?.(JSON.stringify(flow), "ipynb");
        }
    };
    const canRun = () => {
        if (isReadOnly) {
            return false;
        }
        const allAgents = getAgents();
        const agentsCount = allAgents.length;
        if (agentsCount < 2) {
            const msg = agentsCount === 0 ? "No agents" : "Only one agent";
            showSnackbar(flowId, `${msg} found in the flow`, "error", undefined, 3000);
            return false;
        }
        const swarmAgents = allAgents.filter(agent => agent.data.agentType === "swarm");
        if (swarmAgents.length > 0) {
            return true;
        }
        const { used } = getFlowEdges(true);
        return used.length > 0;
    };
    const onRun = () => {
        if (isReadOnly) {
            return;
        }
        if (typeof runner === "function") {
            if (runner) {
                if (canRun()) {
                    const flow = onFlowChanged();
                    if (flow) {
                        runner(JSON.stringify(flow));
                    }
                } else {
                    const openEditFlowButtonId = `edit-flow-${flowId}-sidebar-button`;
                    const openEditFlowButton = document.getElementById(openEditFlowButtonId);
                    if (openEditFlowButton) {
                        openEditFlowButton.click();
                    }
                }
            }
        }
    };

    const onExport = async (_e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (isReadOnly) {
            return;
        }
        const { name } = getFlowInfo();
        const exporter = () => {
            return exportFlow(true, false) as unknown as {
                [key: string]: unknown;
            };
        };
        const onError = () => {
            showSnackbar(flowId, "Could not export flow", "error", undefined, 3000);
        };
        await exportItem(name, "flow", exporter, onError);
    };
    return {
        convertToPy,
        convertToIpynb,
        exportFlow,
        onExport,
        onRun,
        onFlowInit,
        onNodesChange,
        onEdgesChange,
        onNodeDoubleClick,
        onEdgeDoubleClick,
    };
};
