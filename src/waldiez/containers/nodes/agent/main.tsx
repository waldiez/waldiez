/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { NodeResizer } from "@xyflow/react";

import React, { useMemo } from "react";
import { FaCopy } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { VscSettings } from "react-icons/vsc";

import { WaldiezEdgeModal } from "@waldiez/containers/edges/modal";
import { WaldiezNodeAgentBody } from "@waldiez/containers/nodes/agent/body";
import { createHandles } from "@waldiez/containers/nodes/agent/handles";
import { useWaldiezNodeAgent } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentModal } from "@waldiez/containers/nodes/agent/modal";
import { WaldiezNodeAgentProps } from "@waldiez/containers/nodes/agent/types";
import { AGENT_COLORS, AGENT_ICONS } from "@waldiez/theme";

const RESIZE_LIMITS = {
    manager: {
        minWidth: 490,
        minHeight: 330,
    },
    other: {
        minWidth: 130,
        minHeight: 120,
    },
};

/**
 * Component for rendering a Waldiez Agent Node
 * Handles node appearance, drag interactions, and modal management
 */
export const WaldiezNodeAgentView: React.FC<WaldiezNodeAgentProps> = props => {
    const { id, data, selected } = props;
    const agentType = data.agentType;

    // Use the node agent hook for core functionality
    const {
        edge,
        flowId,
        isReadOnly,
        isNodeModalOpen,
        isEdgeModalOpen,
        isModalOpen,
        isDragging,
        onDragOver,
        onDragLeave,
        onDrop,
        onDelete,
        onClone,
        onOpenNodeModal,
        onCloseNodeModal,
        onOpenEdgeModal,
        onCloseEdgeModal,
        onEdgeConnection,
    } = useWaldiezNodeAgent(id);

    // Dynamic class name generation
    const className = useMemo(() => {
        let classes = isModalOpen ? "nodrag nowheel " : "";

        if (!data.parentId) {
            classes += `agent-node ${agentType}`;
        } else {
            classes += `agent-node ${agentType} group-member`;
        }

        if (agentType === "group_manager") {
            classes += " flex-column flex-1";
            if (isDragging) {
                classes += " dragging";
            }
        }

        return classes;
    }, [isModalOpen, data.parentId, agentType, isDragging]);

    // Handle class name calculation
    const handleClassNameBase = useMemo(
        () => (data.parentId ? "group-member " : agentType === "group_manager" ? "group-manager " : ""),
        [data.parentId, agentType],
    );

    // Node size constraints
    const minWidth = useMemo(
        () => (agentType === "group_manager" ? RESIZE_LIMITS.manager.minWidth : RESIZE_LIMITS.other.minWidth),
        [agentType],
    );
    const minHeight = useMemo(
        () =>
            agentType === "group_manager" ? RESIZE_LIMITS.manager.minHeight : RESIZE_LIMITS.other.minHeight,
        [agentType],
    );
    const agentImgSrc = AGENT_ICONS[agentType];

    return (
        <div
            className={className}
            data-testid={`agent-node-${id}-view`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <NodeResizer
                color={AGENT_COLORS[agentType]}
                minWidth={minWidth}
                minHeight={minHeight}
                handleStyle={{ color: AGENT_COLORS[agentType], borderColor: AGENT_COLORS[agentType] }}
                handleClassName={agentType}
            />
            {!isReadOnly && !isDragging && selected && (
                <div className={`agent-actions ${agentType}`} data-testid={`agent-actions-${id}`}>
                    <FaTrash
                        role="button"
                        onClick={onDelete}
                        title="Delete Agent"
                        className="delete-icon clickable margin-right-20"
                        aria-label="Delete Agent"
                    />
                    {data.agentType !== "group_manager" && (
                        <FaCopy
                            role="button"
                            onClick={onClone}
                            title="Clone Agent"
                            className="copy-icon margin-right-20 clickable"
                            aria-label="Clone Agent"
                        />
                    )}
                    <VscSettings
                        role="button"
                        className="clickable cog-icon"
                        onClick={onOpenNodeModal}
                        aria-label="Open Settings"
                        title="Open Settings"
                    />
                </div>
            )}

            <div className="agent-main">
                <div className="agent-top">
                    <div className={"agent-icon-with-label"}>
                        <img className="agent-icon-image" src={agentImgSrc} alt="Agent" />
                        <div className="agent-icon-label">{data.label}</div>
                    </div>
                    <WaldiezNodeAgentBody
                        flowId={flowId}
                        id={id}
                        data={data}
                        isModalOpen={isModalOpen}
                        isReadOnly={isReadOnly}
                        onOpenModal={onOpenNodeModal}
                    />
                </div>
                {createHandles({ agentType, id, handleClassNameBase, selected, onEdgeConnection })}
                <button
                    title="Open Node Modal"
                    type="button"
                    data-node-id={id}
                    data-testid={`open-agent-node-modal-${id}`}
                    className="hidden"
                    onClick={onOpenNodeModal}
                />
                <button
                    title="Open Edge Modal"
                    type="button"
                    data-testid={`open-edge-modal-node-${id}`}
                    className="hidden"
                    onClick={onOpenEdgeModal}
                    data-edge-node-id={id}
                    data-edge-id=""
                />
                {edge && (
                    <WaldiezEdgeModal isOpen={isEdgeModalOpen} edgeId={edge.id} onClose={onCloseEdgeModal} />
                )}
                <WaldiezNodeAgentModal
                    id={id}
                    data={data}
                    isOpen={isNodeModalOpen}
                    onClose={onCloseNodeModal}
                />
            </div>
        </div>
    );
};
