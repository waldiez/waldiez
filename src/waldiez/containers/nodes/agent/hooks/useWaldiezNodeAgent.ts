/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Connection } from "@xyflow/react";

import { type DragEvent, type MouseEvent, useCallback, useMemo, useState } from "react";

import type { WaldiezEdge } from "@waldiez/models/types";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for handling Waldiez Node Agent operations
 * Manages node and edge modals, connections, read-only state, and drag operations
 */
export const useWaldiezNodeAgent = (id: string) => {
    // Store selectors
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const addEdge = useWaldiez(s => s.addEdge);

    const deleteAgent = useWaldiez(s => s.deleteAgent);
    const cloneAgent = useWaldiez(s => s.cloneAgent);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const { isSender, isRecipient, activeEvent } = useWaldiez(s => ({
        isSender: s.activeSenderId === id,
        isRecipient: s.activeRecipientId === id && s.activeRecipientId !== s.activeSenderId,
        activeEvent: s.activeEventType,
    }));
    const flowId = useWaldiez(s => s.flowId);
    const readOnly = useWaldiez(s => s.isReadOnly);

    // Derived state
    const isReadOnly = useMemo(() => readOnly === true, [readOnly]);

    // Local state
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [edge, setEdge] = useState<WaldiezEdge | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Combined modal state
    const isModalOpen = useMemo(() => isNodeModalOpen || isEdgeModalOpen, [isNodeModalOpen, isEdgeModalOpen]);

    /**
     * Handle agent deletion
     * Only triggers if not in read-only mode and modal is not open
     */
    const onDelete = useCallback(() => {
        if (isReadOnly || isModalOpen) {
            return;
        }

        deleteAgent(id);
        onFlowChanged();
    }, [isReadOnly, isModalOpen, deleteAgent, id, onFlowChanged]);

    /**
     * Handle agent cloning
     * Only triggers if not in read-only mode and modal is not open
     */
    const onClone = useCallback(() => {
        if (isReadOnly || isModalOpen) {
            return;
        }

        cloneAgent(id);
        onFlowChanged();
    }, [isReadOnly, isModalOpen, cloneAgent, id, onFlowChanged]);
    /**
     * Opens the node modal if not in read-only mode
     */
    const onOpenNodeModal = useCallback(() => {
        if (!isReadOnly) {
            setIsNodeModalOpen(true);
        }
    }, [isReadOnly, setIsNodeModalOpen]);

    /**
     * Closes the node modal
     */
    const onCloseNodeModal = useCallback(() => {
        setIsNodeModalOpen(false);
    }, [setIsNodeModalOpen]);

    /**
     * Opens the edge modal when an edge is clicked
     * Only opens if not in read-only mode and no other modals are open
     */
    const onOpenEdgeModal = useCallback(
        (event: MouseEvent) => {
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
        },
        [isReadOnly, isNodeModalOpen, isEdgeModalOpen, getEdgeById, setIsEdgeModalOpen, setEdge],
    );

    /**
     * Closes the edge modal and resets the selected edge
     */
    const onCloseEdgeModal = useCallback(() => {
        setIsEdgeModalOpen(false);
        setEdge(null);
    }, [setIsEdgeModalOpen, setEdge]);

    /**
     * Handles edge connection events
     * Creates a new edge and sets it as the current edge
     */
    const onEdgeConnection = useCallback(
        (connection: Connection) => {
            if (!isReadOnly && !isNodeModalOpen) {
                const newEdge = addEdge({ flowId, connection, hidden: false });
                setEdge(newEdge as WaldiezEdge);
            }
        },
        [isReadOnly, isNodeModalOpen, addEdge, flowId, setEdge],
    );

    /**
     * Handle drag over event - set dragging state to true
     */
    const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    /**
     * Handle drag leave event - reset dragging state
     */
    const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    /**
     * Handle drop event - reset dragging state
     */
    const onDrop = useCallback((_: DragEvent<HTMLDivElement>) => {
        setIsDragging(false);
    }, []);

    return {
        flowId,
        edge,
        isNodeModalOpen,
        isEdgeModalOpen,
        isModalOpen,
        isReadOnly,
        isDragging,
        isSender,
        isRecipient,
        activeEvent,
        onDelete,
        onClone,
        onOpenNodeModal,
        onCloseNodeModal,
        onOpenEdgeModal,
        onCloseEdgeModal,
        onEdgeConnection,
        onDragOver,
        onDragLeave,
        onDrop,
    };
};
