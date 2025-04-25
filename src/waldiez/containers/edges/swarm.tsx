/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { BaseEdge, EdgeLabelRenderer, getSimpleBezierPath } from "@xyflow/react";

import { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { GiNestEggs } from "react-icons/gi";
import { GiShakingHands } from "react-icons/gi";
import { MdMessage } from "react-icons/md";

import { EdgeLabel } from "@waldiez/containers/edges/edgeLabel";
import { WaldiezEdgeProps } from "@waldiez/containers/edges/types";
import { getEdgeTranslations } from "@waldiez/containers/edges/utils";
import { useWaldiez } from "@waldiez/store";
import { AGENT_COLORS } from "@waldiez/theme";
import { WaldiezAgentType } from "@waldiez/types";

export const WaldiezEdgeSwarmView = (
    props: WaldiezEdgeProps & {
        sourceType: WaldiezAgentType;
        targetType: WaldiezAgentType;
    },
) => {
    const { sourceType, targetType } = props;
    const swarmType = sourceType !== "swarm" ? "source" : targetType !== "swarm" ? "nested" : "handoff";
    const [focussed, setFocussed] = useState(false);
    const getEdgeById = useWaldiez(s => s.getEdgeById);
    const onEdgeDoubleClick = useWaldiez(s => s.onEdgeDoubleClick);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const {
        id,
        style = {},
        markerEnd,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    } = props;
    const [edgePath, labelX, labelY] = getSimpleBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    const size = 18;
    const edgeColor = swarmType === "source" ? AGENT_COLORS.user : AGENT_COLORS.swarm;
    const icon =
        swarmType === "handoff" ? (
            <GiShakingHands color={edgeColor} size={size} />
        ) : swarmType === "nested" ? (
            <GiNestEggs color={edgeColor} size={size} />
        ) : (
            <MdMessage color={edgeColor} size={size} />
        );
    const onOpenModal = (event: React.MouseEvent) => {
        const edge = getEdgeById(id);
        if (edge) {
            onEdgeDoubleClick(event, edge);
        }
    };
    const className = `clickable agent-edge-box ${sourceType}`; // if source, also with position
    const translations = getEdgeTranslations(
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    );
    const edge = getEdgeById(id);
    const onEdgeClick = (event: React.MouseEvent) => {
        if (focussed) {
            (event.target as HTMLDivElement).blur();
            setFocussed(false);
        } else {
            (event.target as HTMLDivElement).focus();
            setFocussed(true);
        }
    };

    const onEdgeBlur = (event: React.FocusEvent) => {
        (event.target as HTMLDivElement).blur();
        setFocussed(false);
    };
    const onDelete = () => {
        deleteEdge(id);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                {/* <EdgeLabel edge={edge} transform={translations.edgeStart} /> */}
                <div
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        // everything inside EdgeLabelRenderer has no pointer events by default
                        // if you have an interactive element, set pointer-events: all
                        pointerEvents: "all",
                    }}
                    className={className}
                    onClick={onEdgeClick}
                    data-testid={`edge-${id}-box`}
                    tabIndex={0}
                    onBlur={onEdgeBlur}
                >
                    {focussed && (
                        <div className={`edge-actions${swarmType === "source" ? " with-position" : ""}`}>
                            <div
                                title="Delete"
                                role="button"
                                onClick={onDelete}
                                className="delete-edge clickable"
                                data-testid={`delete-edge-${id}`}
                            >
                                <FaTrashAlt />
                            </div>
                            <div
                                title="Edit"
                                role="button"
                                onClick={onOpenModal}
                                className="open-edge-modal clickable"
                                data-testid={`open-edge-modal-${id}`}
                            >
                                <FaGear />
                            </div>
                        </div>
                    )}
                    {swarmType === "source" ? (
                        <div className="agent-edge-view with-position clickable">
                            <div className="edge-position">1</div>
                            <div className="edge-icon">
                                <MdMessage color={edgeColor} size={size} />
                            </div>
                        </div>
                    ) : (
                        <div className="agent-edge-view clickable">{icon}</div>
                    )}
                </div>
                <EdgeLabel edge={edge} transform={translations.edgeEnd} />
            </EdgeLabelRenderer>
        </>
    );
};
