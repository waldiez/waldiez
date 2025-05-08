/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Connection } from "@xyflow/react";

import { useState } from "react";

import { WaldiezEdge } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useWaldiezNodeAgent = () => {
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const addEdge = useWaldiez(s => s.addEdge);
    const flowId = useWaldiez(s => s.flowId);
    const readOnly = useWaldiez(s => s.isReadOnly);
    const isReadOnly = readOnly === true;
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [edge, setEdge] = useState<WaldiezEdge | null>(null);
    const onOpenNodeModal = () => {
        if (!isReadOnly) {
            setIsNodeModalOpen(true);
        }
    };
    const onCloseNodeModal = () => {
        setIsNodeModalOpen(false);
    };
    const onOpenEdgeModal = (event: React.MouseEvent) => {
        if (!isReadOnly && !isNodeModalOpen && !isEdgeModalOpen) {
            const dataEdgeId = event.currentTarget.getAttribute("data-edge-id");
            if (dataEdgeId) {
                const existingEdge = getEdgeById(dataEdgeId);
                if (existingEdge) {
                    setEdge(existingEdge as WaldiezEdge);
                    setIsEdgeModalOpen(true);
                }
            }
        }
    };
    const onCloseEdgeModal = () => {
        setIsEdgeModalOpen(false);
        setEdge(null);
    };
    const onEdgeConnection = (connection: Connection) => {
        if (!isReadOnly && !isNodeModalOpen) {
            const newEdge = addEdge({ flowId, connection, hidden: false });
            setEdge(newEdge as WaldiezEdge);
            // setEdgeModalOpen(true);
        }
    };
    return {
        flowId,
        edge,
        isNodeModalOpen,
        isEdgeModalOpen,
        isReadOnly,
        onOpenNodeModal,
        onCloseNodeModal,
        onOpenEdgeModal,
        onCloseEdgeModal,
        onEdgeConnection,
    };
};
