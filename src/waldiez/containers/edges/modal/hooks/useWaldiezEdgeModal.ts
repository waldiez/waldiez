/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";
import isEqual from "react-fast-compare";

import { SingleValue } from "@waldiez/components";
import { WaldiezEdgeModalProps } from "@waldiez/containers/edges/modal/types";
import { WaldiezEdge, WaldiezEdgeData, WaldiezEdgeType } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";

export const useWaldiezEdgeModal = (props: WaldiezEdgeModalProps) => {
    const { edgeId, onClose } = props;
    const getEdgeSourceAgent = useWaldiez(s => s.getEdgeSourceAgent);
    const getEdgeTargetAgent = useWaldiez(s => s.getEdgeTargetAgent);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);
    const updateEdgeType = useWaldiez(s => s.updateEdgeType);
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const flowId = useWaldiez(s => s.flowId);
    const edge = getEdgeById(edgeId) as WaldiezEdge | null;
    const [edgeType, setEdgeType] = useState<WaldiezEdgeType>(edge?.type ?? "chat");
    const [edgeData, setEdgeData] = useState<WaldiezEdgeData | undefined>(edge?.data);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const { isDark } = useWaldiezTheme();
    const sourceAgent = edge ? getEdgeSourceAgent(edge) : null;
    const targetAgent = edge ? getEdgeTargetAgent(edge) : null;
    const isRagUser = sourceAgent?.data?.agentType === "rag_user";
    const onDataChange = (data: Partial<WaldiezEdgeData>) => {
        if (edgeData) {
            setEdgeData({
                ...edgeData,
                ...data,
            });
        }
        setIsDirty(
            !isEqual(
                {
                    ...edgeData,
                    ...data,
                },
                edge?.data,
            ),
        );
    };
    const onTypeChange = (
        option: SingleValue<{
            label: string;
            value: WaldiezEdgeType;
        }>,
    ) => {
        if (option && edge) {
            setEdgeType(option.value);
            setIsDirty(option.value !== edge.type);
        }
    };
    const onCancel = () => {
        setEdgeData(edge?.data);
        setEdgeType(edge?.type ?? "chat");
        setIsDirty(false);
        onClose();
    };
    const onDelete = () => {
        onCancel();
        deleteEdge(edgeId);
    };
    const onSubmit = () => {
        if (edgeData) {
            updateEdgeData(edgeId, edgeData);
        }
        if (edge) {
            if (edgeType !== edge.type) {
                updateEdgeType(edgeId, edgeType);
            }
        }
        setIsDirty(false);
        // onClose();
    };
    return {
        flowId,
        edge,
        edgeData,
        edgeType,
        isDirty,
        isRagUser,
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
