/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezEdgeModalProps } from "@waldiez/containers/edges/modal/types";
import type { WaldiezEdge, WaldiezEdgeData, WaldiezEdgeType } from "@waldiez/models/types";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";

/**
 * Custom hook for managing edge modal state and actions
 */
export const useWaldiezEdgeModal = (props: WaldiezEdgeModalProps) => {
    const { edgeId, onClose } = props;

    // Get actions and data from store
    const getEdgeSourceAgent = useWaldiez(s => s.getEdgeSourceAgent);
    const getEdgeTargetAgent = useWaldiez(s => s.getEdgeTargetAgent);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);
    const updateEdgeType = useWaldiez(s => s.updateEdgeType);
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const flowId = useWaldiez(s => s.flowId);
    const { isDark } = useWaldiezTheme();

    // no memo
    const edge = getEdgeById(edgeId) as WaldiezEdge | null;

    const sourceAgent = useMemo(() => (edge ? getEdgeSourceAgent(edge) : null), [edge, getEdgeSourceAgent]);

    const targetAgent = useMemo(() => (edge ? getEdgeTargetAgent(edge) : null), [edge, getEdgeTargetAgent]);

    // Local state
    const [edgeType, setEdgeType] = useState<WaldiezEdgeType>(edge?.type ?? "chat");
    const [edgeData, setEdgeData] = useState<WaldiezEdgeData | undefined>(edge?.data);
    const [isDirty, setIsDirty] = useState<boolean>(false);

    // Derived properties
    const isRagUserProxy = useMemo(
        () => sourceAgent?.data?.agentType === "rag_user_proxy",
        [sourceAgent?.data?.agentType],
    );

    /**
     * Update edge data and check if dirty
     */
    const onDataChange = useCallback(
        (data: Partial<WaldiezEdgeData>) => {
            if (!edgeData) {
                return;
            }
            const newData = {
                ...edgeData,
                ...data,
            };
            setEdgeData(newData);
            setIsDirty(!isEqual(newData, edge?.data));
        },
        [edgeData, edge?.data],
    );

    /**
     * Update edge type
     */
    const onTypeChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: WaldiezEdgeType;
            }>,
        ) => {
            if (!option || !edge) {
                return;
            }

            const newType = option.value;
            setEdgeType(newType);
            setIsDirty(newType !== edge.type);
        },
        [edge],
    );

    /**
     * Cancel changes and close modal
     */
    const onCancel = useCallback(() => {
        if (edge) {
            setEdgeData(edge.data);
            if (edge.type) {
                setEdgeType(edge.type);
            }
        }

        setIsDirty(false);
        onClose();
    }, [edge, onClose]);

    /**
     * Delete edge and close modal
     */
    const onDelete = useCallback(() => {
        onCancel();
        deleteEdge(edgeId);
    }, [onCancel, deleteEdge, edgeId]);

    /**
     * Save changes
     */
    const onSubmit = useCallback(() => {
        // Update edge data if changed
        if (edgeData) {
            updateEdgeData(edgeId, edgeData);
        }

        // Update edge type if changed
        if (edge && edgeType !== edge.type) {
            updateEdgeType(edgeId, edgeType);
        }

        setIsDirty(false);
    }, [edgeData, edgeType, edge, edgeId, updateEdgeData, updateEdgeType]);

    return {
        flowId,
        edge,
        edgeData,
        edgeType,
        isDirty,
        isRagUserProxy,
        isDark,
        sourceAgent,
        targetAgent,
        onDataChange,
        onTypeChange,
        onCancel,
        onSubmit,
        onDelete,
    };
};
