/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { NodeResizer } from "@xyflow/react";

import { useCallback, useState } from "react";

import { WaldiezEdgeModal } from "@waldiez/containers/edges/modal";
import { WaldiezNodeAgentBody } from "@waldiez/containers/nodes/agent/body";
import { WaldiezNodeAgentFooter } from "@waldiez/containers/nodes/agent/footer";
import { createHandles } from "@waldiez/containers/nodes/agent/handles";
import { WaldiezNodeAgentHeader } from "@waldiez/containers/nodes/agent/header";
import { useWaldiezNodeAgent } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentModal } from "@waldiez/containers/nodes/agent/modal";
import { WaldiezNodeAgentProps } from "@waldiez/containers/nodes/agent/types";
import { AGENT_COLORS } from "@waldiez/theme";

export const WaldiezNodeAgentView = (props: WaldiezNodeAgentProps) => {
    const { id, data } = props;
    const agentType = data.agentType;
    const {
        edge,
        flowId,
        isReadOnly,
        isNodeModalOpen,
        isEdgeModalOpen,
        onOpenNodeModal,
        onCloseNodeModal,
        onOpenEdgeModal,
        onCloseEdgeModal,
        onEdgeConnection,
    } = useWaldiezNodeAgent();
    const [isDragging, setIsDragging] = useState(false);
    const isModalOpen = isNodeModalOpen || isEdgeModalOpen;
    let className = isModalOpen ? "nodrag nowheel" : "";
    if (!data.parentId) {
        className += `agent-node ${agentType}`;
    } else {
        className += `agent-node ${agentType} group-member`;
    }
    if (agentType === "group_manager" && isDragging) {
        className += " dragging";
    }
    const handleClassNameBase = data.parentId
        ? "group-member "
        : agentType === "group_manager"
          ? "group-manager "
          : "";
    const minWidth = agentType === "group_manager" ? 490 : 210;
    const minHeight = agentType === "group_manager" ? 330 : 210;
    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    const onDrop = useCallback((_: React.DragEvent<HTMLDivElement>) => {
        setIsDragging(false);
    }, []);
    return (
        <div
            className={className}
            data-testid={`agent-node-${id}-view`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className="agent-content" data-testid={`agent-${id}-content`}>
                <NodeResizer
                    color={AGENT_COLORS[agentType]}
                    minWidth={minWidth}
                    minHeight={minHeight}
                    handleStyle={{ color: AGENT_COLORS[agentType] }}
                    handleClassName={agentType}
                />
                <WaldiezNodeAgentHeader id={id} data={data} onOpenNodeModal={onOpenNodeModal} />
                {agentType === "group_manager" ? (
                    <div className="agent-body" />
                ) : (
                    <WaldiezNodeAgentBody
                        flowId={flowId}
                        id={id}
                        data={data}
                        isModalOpen={isModalOpen}
                        isReadOnly={isReadOnly}
                    />
                )}
                <WaldiezNodeAgentFooter id={id} data={data} isModalOpen={isModalOpen} />
            </div>
            {createHandles(agentType, id, handleClassNameBase, onEdgeConnection)}
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
            ></button>
            {edge && isEdgeModalOpen && !isNodeModalOpen && (
                <WaldiezEdgeModal isOpen={isEdgeModalOpen} edgeId={edge.id} onClose={onCloseEdgeModal} />
            )}
            {isNodeModalOpen && !isEdgeModalOpen && (
                <WaldiezNodeAgentModal
                    id={id}
                    data={data}
                    isOpen={isNodeModalOpen}
                    onClose={onCloseNodeModal}
                />
            )}
        </div>
    );
};
