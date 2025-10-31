/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Edge, EdgeChange, Node, NodeChange, ReactFlowInstance } from "@xyflow/react";

import { type MouseEvent as ReactMouseEvent, useCallback, useMemo } from "react";

import { showSnackbar } from "@waldiez/components";
import type { WaldiezEdge } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { exportItem, getFlowRoot } from "@waldiez/utils";

/**
 * Custom hook for managing flow events and interactions
 */
export const useFlowEvents = (flowId: string) => {
    // Get state from store
    const readOnly = useWaldiez(s => s.isReadOnly);
    const skipImport = useWaldiez(s => s.skipImport);
    const skipExport = useWaldiez(s => s.skipExport);
    const isReadOnly = readOnly === true;
    const checkpoints = useWaldiez(s => s.checkpoints);

    // Get action handlers from store
    const runner = useWaldiez(s => s.onRun);
    const stepRunner = useWaldiez(s => s.onStepRun);
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

    /**
     * Initialize flow with proper view and settings
     */
    const onFlowInit = useCallback(
        (instance: ReactFlowInstance) => {
            const rootDiv = getFlowRoot(flowId);
            const noInteractivity = isReadOnly || (skipImport === true && skipExport === true);
            const hasContent = instance.getNodes().length > 0 || instance.getEdges().length > 0;

            if (!rootDiv) {
                setRfInstance(instance);
                return;
            }

            // Disable interactivity if needed
            if (noInteractivity) {
                const interactiveControl = rootDiv.querySelector(".react-flow__controls-interactive");
                if (interactiveControl) {
                    (interactiveControl as HTMLButtonElement).click();
                }
            }

            // Fit view if there's content, otherwise reset viewport
            if (hasContent) {
                // Use double RAF for reliable rendering
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        instance
                            .fitView({
                                includeHiddenNodes: false,
                                padding: 0.2,
                                duration: 100,
                            })
                            .then(() => {
                                setRfInstance(instance);
                            });
                    });
                });
            } else {
                instance.setViewport({ x: 0, y: 0, zoom: 1 }).then(() => {});
                setRfInstance(instance);
            }
        },
        [flowId, isReadOnly, skipImport, skipExport, setRfInstance],
    );

    /**
     * Handle changes to nodes
     */
    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            if (!isReadOnly) {
                handleNodesChange(changes);
                // Note: Commented out in original, keeping it that way
                // onFlowChanged();
            }
        },
        [isReadOnly, handleNodesChange],
    );

    /**
     * Handle changes to edges
     */
    const onEdgesChange = useCallback(
        (changes: EdgeChange<Edge>[]) => {
            if (!isReadOnly) {
                handleEdgesChange(changes);
                onFlowChanged();
            }
        },
        [isReadOnly, handleEdgesChange, onFlowChanged],
    );

    /**
     * Handle double-clicking on edges
     */
    const onEdgeDoubleClick = useCallback(
        (event: ReactMouseEvent, edge: Edge) => {
            if (!isReadOnly) {
                handleEdgeDoubleClick(event, edge as WaldiezEdge);
            }
        },
        [isReadOnly, handleEdgeDoubleClick],
    );

    /**
     * Handle double-clicking on nodes
     */
    const onNodeDoubleClick = useCallback(
        (event: ReactMouseEvent, node: Node) => {
            if (isReadOnly) {
                return;
            }

            // Ignore if clicking in a text area
            const target = event.target;
            if (target instanceof Element && target.tagName === "TEXTAREA") {
                return;
            }

            handleNodeDoubleClick(event, node);
        },
        [isReadOnly, handleNodeDoubleClick],
    );

    /**
     * Check if the flow can be run
     */
    const canRun = useCallback(() => {
        if (isReadOnly) {
            return false;
        }

        const allAgents = getAgents();
        // Check for at least 2 agents
        const agentsCount = allAgents.length;

        if (agentsCount < 2) {
            const msg = agentsCount === 0 ? "No agents" : "Only one agent";
            showSnackbar({
                flowId,
                message: `${msg} found in the flow`,
                level: "error",
                details: undefined,
                duration: 3000,
            });
            return false;
        }
        // check group manager
        const groupManager = allAgents.find(agent => agent.data.agentType === "group_manager");
        if (groupManager) {
            return true;
        }
        // Check for complete edge connections
        const { used, remaining } = getFlowEdges();
        return used.length > 0 && remaining.length === 0;
    }, [isReadOnly, getAgents, getFlowEdges, flowId]);

    /**
     * Convert flow to Python
     */
    const convertToPy = useCallback(
        (path?: string | null) => {
            if (!isReadOnly && onConvert) {
                const flow = onFlowChanged();
                const { path: flowPath } = getFlowInfo();
                onConvert(JSON.stringify(flow), "py", path || flowPath);
            }
        },
        [isReadOnly, onFlowChanged, onConvert, getFlowInfo],
    );

    /**
     * Convert flow to Jupyter Notebook
     */
    const convertToIpynb = useCallback(
        (path?: string | null) => {
            if (!isReadOnly && onConvert) {
                const flow = onFlowChanged();
                const { path: flowPath } = getFlowInfo();
                onConvert(JSON.stringify(flow), "ipynb", path || flowPath);
            }
        },
        [isReadOnly, onFlowChanged, onConvert, getFlowInfo],
    );

    /**
     * Run the flow
     */
    const onRun = useCallback(
        (path?: string | null) => {
            if (isReadOnly || typeof runner !== "function") {
                return;
            }

            if (canRun()) {
                const flow = onFlowChanged();
                if (flow) {
                    const { path: flowPath } = getFlowInfo();
                    runner(JSON.stringify(flow), path || flowPath);
                }
            } else {
                // Open edit flow sidebar if flow isn't ready to run
                const openEditFlowButtonId = `edit-flow-${flowId}-sidebar-button`;
                const openEditFlowButton = document.getElementById(openEditFlowButtonId);
                if (openEditFlowButton) {
                    openEditFlowButton.click();
                }
            }
        },
        [isReadOnly, runner, canRun, onFlowChanged, getFlowInfo, flowId],
    );

    /**
     * Run the flow step-by-step
     */
    const onStepRun = useCallback(
        (breakpoints?: string[], checkpoint?: string | null, path?: string | null) => {
            if (isReadOnly || typeof stepRunner !== "function") {
                return;
            }
            const flow = onFlowChanged();
            if (flow) {
                const { path: flowPath } = getFlowInfo();
                stepRunner(JSON.stringify(flow), breakpoints, checkpoint, path || flowPath);
            }
        },
        [isReadOnly, stepRunner, onFlowChanged, getFlowInfo],
    );

    const onGetCheckpoints: () => Promise<Record<string, any> | null> = useCallback(async () => {
        if (isReadOnly || typeof checkpoints?.get !== "function") {
            return null;
        }
        const info = getFlowInfo();
        try {
            const result = await checkpoints.get(info.name);
            return result;
        } catch {
            return null;
        }
    }, [isReadOnly, checkpoints, getFlowInfo]);

    const onSubmitCheckpoint: (checkpoint: Record<string, any>) => Promise<void> = useCallback(
        async (checkpoint: Record<string, any>) => {
            if (isReadOnly || typeof checkpoints?.submit !== "function") {
                return;
            }
            const info = getFlowInfo();
            try {
                await checkpoints.submit(info.name, checkpoint);
            } catch {
                //
            }
        },
        [isReadOnly, checkpoints, getFlowInfo],
    );

    /**
     * Export the flow
     */
    const onExport = useCallback(
        async (_e: ReactMouseEvent<HTMLElement, MouseEvent>) => {
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
                showSnackbar({
                    flowId,
                    message: "Could not export the flow",
                    level: "error",
                    details: undefined,
                    duration: 3000,
                });
            };

            await exportItem(name, "flow", exporter, onError);
        },
        [isReadOnly, getFlowInfo, exportFlow, flowId],
    );

    // Return memoized object with all handlers
    return useMemo(
        () => ({
            convertToPy,
            convertToIpynb,
            exportFlow,
            onExport,
            onRun,
            onStepRun,
            onFlowInit,
            onNodesChange,
            onEdgesChange,
            onNodeDoubleClick,
            onEdgeDoubleClick,
            onGetCheckpoints,
            onSubmitCheckpoint,
        }),
        [
            convertToPy,
            convertToIpynb,
            exportFlow,
            onExport,
            onRun,
            onStepRun,
            onFlowInit,
            onNodesChange,
            onEdgesChange,
            onNodeDoubleClick,
            onEdgeDoubleClick,
            onGetCheckpoints,
            onSubmitCheckpoint,
        ],
    );
};
