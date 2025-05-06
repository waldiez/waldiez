/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Background, BackgroundVariant, Controls, ReactFlow, Viewport } from "@xyflow/react";

import { useEffect, useRef, useState } from "react";

import { useDnD, useFlowEvents, useKeys } from "@waldiez/containers/flow/hooks";
import { ExportFlowModal, ImportFlowModal, UserInputModal } from "@waldiez/containers/flow/modals";
import { WaldiezFlowPanels } from "@waldiez/containers/flow/panels";
import { edgeTypes, nodeTypes } from "@waldiez/containers/rfTypes";
import { SideBar } from "@waldiez/containers/sidebar";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { WaldiezNodeType, WaldiezPreviousMessage, WaldiezUserInput } from "@waldiez/types";

type WaldiezFlowViewProps = {
    flowId: string;
    onUserInput?: ((input: WaldiezUserInput) => void) | null;
    inputPrompt?: {
        previousMessages: WaldiezPreviousMessage[];
        prompt: string;
        request_id: string;
        userParticipants: Set<string>;
    } | null;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
};

export const WaldiezFlowView = (props: WaldiezFlowViewProps) => {
    const { flowId, inputPrompt, onUserInput, skipExport, skipImport, skipHub } = props;
    const rfParent = useRef<HTMLDivElement | null>(null);
    const selectedNodeType = useRef<WaldiezNodeType>("agent");
    const [selectedNodeTypeToggle, setSelectedNodeTypeToggle] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
    const nodes = useWaldiez(s => s.nodes);
    const edges = useWaldiez(s => s.edges);
    const readOnly = useWaldiez(s => s.isReadOnly);
    const viewport = useWaldiez(s => s.viewport);
    const addModel = useWaldiez(s => s.addModel);
    const addSkill = useWaldiez(s => s.addSkill);
    const handleViewportChange = useWaldiez(s => s.onViewportChange);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const showNodes = useWaldiez(s => s.showNodes);
    const onReconnect = useWaldiez(s => s.onReconnect);
    const onSave = useWaldiez(s => s.onSave);
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
    useEffect(() => {
        showNodes("agent");
        // setSelectedNodeType("agent");
    }, []);
    const { isDark } = useWaldiezTheme();
    const isReadOnly = typeof readOnly === "boolean" ? readOnly : false;
    const colorMode = isDark ? "dark" : "light";
    const setSelectedNodeType = (nodeType: WaldiezNodeType) => {
        selectedNodeType.current = nodeType;
        setSelectedNodeTypeToggle(!selectedNodeTypeToggle);
    };
    const onOpenImportModal = () => {
        setIsImportModalOpen(true);
    };
    const onCloseImportModal = () => {
        setIsImportModalOpen(false);
    };
    const onCloseExportModal = () => {
        setIsExportModalOpen(false);
    };
    const onTypeShownChange = (nodeType: WaldiezNodeType) => {
        if (selectedNodeType.current !== nodeType) {
            setSelectedNodeType(nodeType);
            showNodes(nodeType);
        }
    };
    const onAddNode = () => {
        if (selectedNodeType.current === "model") {
            addModel();
            onFlowChanged();
        } else if (selectedNodeType.current === "skill") {
            addSkill();
            onFlowChanged();
        }
    };
    const onNewAgent = () => {
        setTimeout(() => {
            if (selectedNodeType.current !== "agent") {
                setSelectedNodeType("agent");
                showNodes("agent");
            }
            onFlowChanged();
        }, 1);
    };
    const onViewportChange = (viewport: Viewport) => {
        handleViewportChange(viewport, selectedNodeType.current);
        // onFlowChanged();
    };
    const handleExport = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        // if skip hub, just export/download the flow
        // else, show a modal with further options
        if (skipHub) {
            await onExport(e);
        } else {
            setIsExportModalOpen(true);
        }
    };
    const handleExportToHub = () => {
        const exported = exportFlow(true, false) as unknown as {
            [key: string]: unknown;
        };
        return JSON.stringify(exported);
    };
    const { onDragOver, onDrop, onNodeDrag, onNodeDragStop } = useDnD(onNewAgent);
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
                        nodes={nodes}
                        edges={edges}
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
                        // fitView={true}
                        // noPanClassName="no-pan"
                        // noDragClassName="no-drag"
                        // nodesDraggable
                        // zoomOnScroll
                        // panOnDrag
                        // debug
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
            {onUserInput && inputPrompt && (
                <UserInputModal
                    flowId={flowId}
                    isOpen={inputPrompt !== null}
                    onUserInput={onUserInput}
                    inputPrompt={inputPrompt}
                />
            )}
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
};
