/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { NodeResizer } from "@xyflow/react";

import { useState } from "react";
import { FaGear } from "react-icons/fa6";
import { SiSwarm } from "react-icons/si";

import { WaldiezNodeSwarmContainerModal } from "@waldiez/containers/nodes/agent/swarmContainer/modal";
import { WaldiezSwarmContainerProps } from "@waldiez/containers/nodes/agent/swarmContainer/types";
import { useWaldiez } from "@waldiez/store";
import { AGENT_COLORS } from "@waldiez/theme";
import { WaldiezAgentSwarmContainerData } from "@waldiez/types";

export const WaldiezNodeSwarmContainer = (props: WaldiezSwarmContainerProps) => {
    const { id, data, onCloseNodeModal, onOpenNodeModal } = props;
    const [isSwarmNodeModalOpen, setIsSwarmNodeModalOpen] = useState(false);
    const openSwarmNodeModal = () => {
        setIsSwarmNodeModalOpen(true);
        onOpenNodeModal();
    };
    const closeSwarmNodeModal = () => {
        setIsSwarmNodeModalOpen(false);
        onCloseNodeModal();
    };
    let className = "swarm-container";
    if (isSwarmNodeModalOpen) {
        className += " nodrag nowheel";
    }
    const flowId = useWaldiez(s => s.flowId);
    return (
        <div className={className} data-testid={`node-${id}-view`}>
            <div className="header">
                <div
                    role="button"
                    title="Edit"
                    className="clickable"
                    id={`open-swarm-modal-${id}`}
                    data-testid={`open-swarm-modal-${id}`}
                    onClick={openSwarmNodeModal}
                >
                    <FaGear size={20} />
                </div>
                <SiSwarm size={22} color={AGENT_COLORS.swarm_container} />
            </div>
            <NodeResizer
                color={AGENT_COLORS.swarm_container}
                minWidth={482}
                minHeight={320}
                handleStyle={{ color: AGENT_COLORS.swarm_container }}
                handleClassName="swarm"
            />
            {isSwarmNodeModalOpen && (
                <WaldiezNodeSwarmContainerModal
                    id={id}
                    data={data as WaldiezAgentSwarmContainerData}
                    flowId={flowId}
                    isOpen={isSwarmNodeModalOpen}
                    onClose={closeSwarmNodeModal}
                />
            )}
        </div>
    );
};
