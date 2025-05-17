/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Background, BackgroundVariant, Controls, ReactFlow, Viewport } from "@xyflow/react";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDnD, useFlowEvents, useKeys } from "@waldiez/containers/flow/hooks";
import { ChatModal, ExportFlowModal, ImportFlowModal } from "@waldiez/containers/flow/modals";
import { WaldiezFlowPanels } from "@waldiez/containers/flow/panels";
import { edgeTypes, nodeTypes } from "@waldiez/containers/rfTypes";
import { SideBar } from "@waldiez/containers/sidebar";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { WaldiezChatConfig, WaldiezNodeType } from "@waldiez/types";

type WaldiezFlowViewProps = {
    flowId: string;
    chat?: WaldiezChatConfig;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
};

/**
 * Main flow view component for the Waldiez application
 */
export const WaldiezFlowView = memo<WaldiezFlowViewProps>((props: WaldiezFlowViewProps) => {
    const { flowId, skipExport, skipImport, skipHub, chat } = props;

    // Refs
    const rfParent = useRef<HTMLDivElement | null>(null);
    const selectedNodeType = useRef<WaldiezNodeType>("agent");

    // State
    const [_selectedNodeTypeToggle, setSelectedNodeTypeToggle] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

    // Get global state from store
    const nodes = useWaldiez(s => s.nodes);
    const edges = useWaldiez(s => s.edges);
    const readOnly = useWaldiez(s => s.isReadOnly);
    const viewport = useWaldiez(s => s.viewport);
    const addModel = useWaldiez(s => s.addModel);
    const addTool = useWaldiez(s => s.addTool);
    const handleViewportChange = useWaldiez(s => s.onViewportChange);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const showNodes = useWaldiez(s => s.showNodes);
    const onReconnect = useWaldiez(s => s.onReconnect);
    const onSave = useWaldiez(s => s.onSave);

    // Theme settings
    const { isDark } = useWaldiezTheme();
    const colorMode = useMemo(() => (isDark ? "dark" : "light"), [isDark]);
    const isReadOnly = readOnly === true;

    // Use custom hooks
    const { onKeyDown } = useKeys(flowId, onSave);

    const {
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
    } = useFlowEvents(flowId);

    // Initialize by showing agent nodes
    useEffect(() => {
        showNodes("agent");
    }, [showNodes]);

    /**
     * Change selected node type and update UI
     */
    const setSelectedNodeType = useCallback((nodeType: WaldiezNodeType) => {
        selectedNodeType.current = nodeType;
        setSelectedNodeTypeToggle(prev => !prev);
    }, []);

    /**
     * Open import modal
     */
    const onOpenImportModal = useCallback(() => {
        setIsImportModalOpen(true);
    }, []);

    /**
     * Close import modal
     */
    const onCloseImportModal = useCallback(() => {
        setIsImportModalOpen(false);
    }, []);

    /**
     * Close export modal
     */
    const onCloseExportModal = useCallback(() => {
        setIsExportModalOpen(false);
    }, []);

    /**
     * Change node type shown in the view
     */
    const onTypeShownChange = useCallback(
        (nodeType: WaldiezNodeType) => {
            if (selectedNodeType.current !== nodeType) {
                setSelectedNodeType(nodeType);
                showNodes(nodeType);
            }
        },
        [setSelectedNodeType, showNodes],
    );

    /**
     * Add a new node based on selected type
     */
    const onAddNode = useCallback(() => {
        if (selectedNodeType.current === "model") {
            addModel();
            onFlowChanged();
        } else if (selectedNodeType.current === "tool") {
            addTool();
            onFlowChanged();
        }
    }, [addModel, addTool, onFlowChanged]);

    /**
     * Handle new agent added to the flow
     */
    const onNewAgent = useCallback(() => {
        requestAnimationFrame(() => {
            if (selectedNodeType.current !== "agent") {
                setSelectedNodeType("agent");
                showNodes("agent");
            }
            onFlowChanged();
        });
    }, [setSelectedNodeType, showNodes, onFlowChanged]);

    /**
     * Handle viewport changes
     */
    const onViewportChange = useCallback(
        (viewport: Viewport) => {
            handleViewportChange(viewport, selectedNodeType.current);
        },
        [handleViewportChange],
    );

    /**
     * Handle export button click
     */
    const handleExport = useCallback(
        async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            if (skipHub) {
                await onExport(e);
            } else {
                setIsExportModalOpen(true);
            }
        },
        [skipHub, onExport],
    );

    /**
     * Export flow for hub upload
     */
    const handleExportToHub = useCallback(() => {
        const exported = exportFlow(true, false) as unknown as {
            [key: string]: unknown;
        };
        return JSON.stringify(exported);
    }, [exportFlow]);

    // Get drag and drop handlers
    const { onDragOver, onDrop, onNodeDrag, onNodeDragStop } = useDnD(onNewAgent);

    // Memoize node and edge collections
    const flowNodes = useMemo(() => nodes, [nodes]);
    const flowEdges = useMemo(() => edges, [edges]);

    return (
        <div
            className={`flow-wrapper ${colorMode}`}
            id={`rf-root-${flowId}`}
            data-testid={`rf-root-${flowId}`}
        >
            <div className="flow-main">
                <SideBar
                    onSelectNodeType={onTypeShownChange}
                    selectedNodeType={selectedNodeType.current}
                    isReadonly={isReadOnly}
                />
                <div className="react-flow-wrapper" data-testid={`rf-wrapper-${flowId}`} ref={rfParent}>
                    <ReactFlow
                        id={flowId}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onInit={onFlowInit}
                        nodes={flowNodes}
                        edges={flowEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        deleteKeyCode={[]}
                        onKeyDown={onKeyDown}
                        onNodeDoubleClick={onNodeDoubleClick}
                        onEdgeDoubleClick={onEdgeDoubleClick}
                        onReconnect={onReconnect}
                        colorMode={colorMode}
                        elevateNodesOnSelect={true}
                        elevateEdgesOnSelect={true}
                        snapToGrid={true}
                        defaultViewport={viewport}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onViewportChange={onViewportChange}
                        connectOnClick
                        zoomOnDoubleClick={false}
                        noWheelClassName="no-wheel"
                        width={rfParent.current?.clientWidth}
                        height={rfParent.current?.clientHeight}
                        onNodeDrag={onNodeDrag}
                        onNodeDragStop={onNodeDragStop}
                    >
                        <Controls showInteractive={true} />
                        <WaldiezFlowPanels
                            flowId={flowId}
                            skipExport={skipExport}
                            skipImport={skipImport}
                            skipHub={skipHub}
                            selectedNodeType={selectedNodeType.current}
                            onAddNode={onAddNode}
                            onRun={onRun}
                            onConvertToPy={convertToPy}
                            onConvertToIpynb={convertToIpynb}
                            onOpenImportModal={onOpenImportModal}
                            onExport={handleExport}
                        />
                        <div className="hidden" data-testid={`drop-area-${flowId}`} />
                        <Background variant={BackgroundVariant.Dots} />
                    </ReactFlow>
                </div>
            </div>

            {/* Modals */}
            <ChatModal flowId={flowId} chat={chat} />

            {isImportModalOpen && (
                <ImportFlowModal
                    flowId={flowId}
                    isOpen={isImportModalOpen}
                    onClose={onCloseImportModal}
                    typeShown={selectedNodeType.current}
                    onTypeShownChange={onTypeShownChange}
                />
            )}

            {isExportModalOpen && (
                <ExportFlowModal
                    flowId={flowId}
                    isOpen={isExportModalOpen}
                    onClose={onCloseExportModal}
                    onDownload={onExport}
                    onExport={handleExportToHub}
                />
            )}
        </div>
    );
});

WaldiezFlowView.displayName = "WaldiezFlowView";
