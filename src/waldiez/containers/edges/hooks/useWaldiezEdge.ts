/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { EdgeProps, getSimpleBezierPath } from "@xyflow/react";

import React, { useCallback, useMemo } from "react";

import {
    ValidAgentTypes,
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezNodeAgent,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { AGENT_COLORS_ALT } from "@waldiez/theme";

/**
 * Custom hook for managing Waldiez edge properties and interactions
 */
export const useWaldiezEdge = (props: EdgeProps<WaldiezEdge> & { type: WaldiezEdgeType }) => {
    const {
        id,
        source,
        target,
        type,
        data,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    } = props;

    // Get store actions and state
    const isReadOnly = useWaldiez(s => s.isReadOnly);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const onEdgeDoubleClick = useWaldiez(s => s.onEdgeDoubleClick);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);

    // Get source and target agents / skip memoization
    // if th eagent type changes, we want to recalculate the edge color
    const sourceAgent = getAgentById(source) as WaldiezNodeAgent | null;
    const targetAgent = getAgentById(target) as WaldiezNodeAgent | null;

    // Calculate edge path and label position
    const [edgePath, labelX, labelY] = useMemo(
        () =>
            getSimpleBezierPath({
                sourceX,
                sourceY,
                sourcePosition,
                targetX,
                targetY,
                targetPosition,
            }),
        [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition],
    );

    /**
     * Open edge modal on double click
     */
    const onOpenModal = useCallback(
        (event: React.MouseEvent) => {
            const edge = getEdgeById(id);
            if (edge) {
                onEdgeDoubleClick(event, edge);
            }
        },
        [id, getEdgeById, onEdgeDoubleClick],
    );

    /**
     * Delete the edge
     */
    const onDelete = useCallback(() => {
        deleteEdge(id);
    }, [deleteEdge, id]);

    /**
     * Get the edge color based on source agent type
     */
    const getEdgeColor = useCallback(() => {
        const agent = getAgentById(source) as WaldiezNodeAgent | null;
        if (!agent) {
            return undefined;
        }
        const agentType = agent.data.agentType as WaldiezNodeAgentType;

        if (ValidAgentTypes.includes(agentType)) {
            return AGENT_COLORS_ALT[agentType];
        }
    }, [getAgentById, source]);
    /**
     * Get the edge label number or identifier
     */
    const getEdgeNumber = useCallback(() => {
        if (!sourceAgent || !data) {
            return "";
        }

        if (type === "chat") {
            // noinspection SuspiciousTypeOfGuard
            return typeof data.order === "number" ? (data.order >= 0 ? `${data.order + 1}` : "0") : "0";
        }

        if (type === "nested") {
            const sourceLabel = sourceAgent.data.label as string;
            const sourceInitial = sourceLabel?.charAt(0)?.toUpperCase() || "";
            return `${sourceInitial}.${data.position}`;
        }

        return "";
    }, [sourceAgent, data, type]);

    /**
     * Handle edge description change
     */
    const onDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const edge = getEdgeById(id);
            if (!edge) {
                return;
            }

            updateEdgeData(id, {
                ...edge.data,
                description: event.target.value,
            });
        },
        [id, getEdgeById, updateEdgeData],
    );

    return {
        edgePath,
        labelX,
        labelY,
        sourceAgent,
        targetAgent,
        isReadOnly,
        getEdgeById,
        onOpenModal,
        onDelete,
        getEdgeColor,
        getEdgeNumber,
        onDescriptionChange,
    };
};
