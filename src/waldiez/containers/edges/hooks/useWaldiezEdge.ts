/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { EdgeProps, getSimpleBezierPath } from "@xyflow/react";

import {
    VALID_AGENT_TYPES,
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezNodeAgent,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { AGENT_COLORS_ALT } from "@waldiez/theme";

export const useWaldiezEdge = (props: EdgeProps<WaldiezEdge> & { type: WaldiezEdgeType }) => {
    const { id, source, type, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } =
        props;
    const isReadOnly = useWaldiez(s => s.isReadOnly);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const onEdgeDoubleClick = useWaldiez(s => s.onEdgeDoubleClick);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);
    const sourceAgent = getAgentById(source) as WaldiezNodeAgent | null;
    const targetAgent = getAgentById(props.target) as WaldiezNodeAgent | null;
    const [edgePath, labelX, labelY] = getSimpleBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    const onOpenModal = (event: React.MouseEvent) => {
        const edge = getEdgeById(id);
        if (edge) {
            onEdgeDoubleClick(event, edge);
        }
    };
    const onDelete = () => {
        deleteEdge(id);
    };
    const getEdgeColor = () => {
        let edgeColor;
        if (sourceAgent) {
            const agentType = sourceAgent.data.agentType as WaldiezNodeAgentType;
            if (VALID_AGENT_TYPES.includes(agentType)) {
                edgeColor = AGENT_COLORS_ALT[agentType];
            }
        }
        return edgeColor;
    };
    const getEdgeNumber = () => {
        let edgeNumber = "";
        if (!sourceAgent || !data) {
            return edgeNumber;
        }
        if (type === "chat") {
            edgeNumber = typeof data.order === "number" ? (data.order >= 0 ? `${data.order + 1}` : "0") : "0";
        } else if (type === "nested") {
            const sourceInitial = (sourceAgent.data.label as string).charAt(0).toUpperCase();
            edgeNumber = `${sourceInitial}.${data.position}`;
        }
        return edgeNumber;
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const edge = getEdgeById(id);
        if (edge) {
            updateEdgeData(id, {
                ...edge.data,
                description: event.target.value,
            });
        }
    };
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
