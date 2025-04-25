/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Handle, NodeResizer, Position } from "@xyflow/react";

import { WaldiezEdgeModal } from "@waldiez/containers/edges/modal";
import { WaldiezNodeAgentBody } from "@waldiez/containers/nodes/agent/body";
import { WaldiezNodeAgentFooter } from "@waldiez/containers/nodes/agent/footer";
import { WaldiezNodeAgentHeader } from "@waldiez/containers/nodes/agent/header";
import { useWaldiezNodeAgent } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentModal } from "@waldiez/containers/nodes/agent/modal";
import { WaldiezNodeSwarmContainer } from "@waldiez/containers/nodes/agent/swarmContainer";
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
    const isModalOpen = isNodeModalOpen || isEdgeModalOpen;
    let className = isModalOpen ? "nodrag nowheel" : "";
    if (!data.parentId) {
        className += `agent-node ${agentType}`;
    }
    if (agentType === "swarm_container") {
        return (
            <WaldiezNodeSwarmContainer
                {...props}
                isNodeModalOpen={isNodeModalOpen}
                onOpenNodeModal={onOpenNodeModal}
                onCloseNodeModal={onCloseNodeModal}
            />
        );
    }
    const handleClassNameBase = agentType === "swarm" ? "swarm-" : data.parentId ? "hidden " : "";
    return (
        <div className={className} data-testid={`agent-node-${id}-view`}>
            {!data.parentId && (
                <div className="agent-content" data-testid={`agent-${id}-content`}>
                    {agentType !== "swarm" && (
                        <NodeResizer
                            color={AGENT_COLORS[agentType]}
                            minWidth={206}
                            minHeight={206}
                            handleStyle={{ color: AGENT_COLORS[agentType] }}
                            handleClassName={agentType}
                        />
                    )}
                    <WaldiezNodeAgentHeader id={id} data={data} onOpenNodeModal={onOpenNodeModal} />
                    <WaldiezNodeAgentBody
                        flowId={flowId}
                        id={id}
                        data={data}
                        isModalOpen={isModalOpen}
                        isReadOnly={isReadOnly}
                    />
                    <WaldiezNodeAgentFooter id={id} data={data} isModalOpen={isModalOpen} />
                </div>
            )}
            <Handle
                className={`${handleClassNameBase}handle top target`}
                type="target"
                isConnectableEnd
                position={Position.Top}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-top-target-${id}`}
                id={`agent-handle-top-target-${id}`}
                style={{ left: "75%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle top source`}
                type="source"
                isConnectableStart
                position={Position.Top}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-top-source-${id}`}
                id={`agent-handle-top-source-${id}`}
                style={{ left: "25%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle bottom target`}
                type="target"
                isConnectableEnd
                position={Position.Bottom}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-bottom-target-${id}`}
                id={`agent-handle-bottom-target-${id}`}
                style={{ left: "25%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle bottom source`}
                type="source"
                isConnectableStart
                position={Position.Bottom}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-bottom-source-${id}`}
                id={`agent-handle-bottom-source-${id}`}
                style={{ left: "75%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle left target`}
                type="target"
                // isConnectableEnd
                position={Position.Left}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-left-target-${id}`}
                id={`agent-handle-left-target-${id}`}
                style={{ top: "25%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle left source`}
                type="source"
                isConnectableStart
                position={Position.Left}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-left-source-${id}`}
                id={`agent-handle-left-source-${id}`}
                style={{ top: "75%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle right target`}
                type="target"
                isConnectableEnd
                position={Position.Right}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-right-target-${id}`}
                id={`agent-handle-right-target-${id}`}
                style={{ top: "75%" }}
            />
            <Handle
                className={`${handleClassNameBase}handle right source`}
                type="source"
                isConnectableStart
                position={Position.Right}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-right-source-${id}`}
                id={`agent-handle-right-source-${id}`}
                style={{ top: "25%" }}
            />
            <button
                title="Open Node Modal"
                type="button"
                // id={`open-agent-node-modal-${id}`}
                data-node-id={id}
                data-testid={`open-agent-node-modal-${id}`}
                className="hidden"
                onClick={onOpenNodeModal}
            />
            <button
                title="Open Edge Modal"
                type="button"
                id={`open-edge-modal-node-${id}`}
                data-testid={`open-edge-modal-node-${id}`}
                className="hidden"
                onClick={onOpenEdgeModal}
                data-edge-id=""
            ></button>
            {edge && isEdgeModalOpen && (
                <WaldiezEdgeModal isOpen={isEdgeModalOpen} edgeId={edge.id} onClose={onCloseEdgeModal} />
            )}
            {isNodeModalOpen && (
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
