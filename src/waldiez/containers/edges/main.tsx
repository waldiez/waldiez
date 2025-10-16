/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";

import { type FocusEvent, type MouseEvent, memo, useCallback, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { GiNestEggs, GiShakingHands } from "react-icons/gi";
import { GoAlert } from "react-icons/go";
import { MdMessage } from "react-icons/md";
import { VscSettings } from "react-icons/vsc";

import { EdgeLabel } from "@waldiez/containers/edges/edgeLabel";
import { EdgePosition } from "@waldiez/containers/edges/edgePosition";
import { useWaldiezEdge } from "@waldiez/containers/edges/hooks";
import type { WaldiezEdgeProps } from "@waldiez/containers/edges/types";
import { getEdgeLabelTransformNodeOffset } from "@waldiez/containers/edges/utils";
import type {
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezGroupChatType,
    WaldiezNodeAgent,
} from "@waldiez/models/types";

/**
 * Chat edge component
 */
export const WaldiezEdgeChat = memo((props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="chat" />;
});

/**
 * Nested edge component
 */
export const WaldiezEdgeNested = memo((props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="nested" />;
});

/**
 * Group edge component
 */
export const WaldiezEdgeGroup = memo((props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="group" />;
});

/**
 * Hidden edge component
 */
export const WaldiezEdgeHidden = memo((props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="hidden" />;
});

/**
 * Determine the type of group chat based on source and target agents
 */
const getGroupChatType = (
    sourceAgent: WaldiezNodeAgent | null,
    targetAgent: WaldiezNodeAgent | null,
): WaldiezGroupChatType => {
    if (!sourceAgent || !targetAgent) {
        return "toManager";
    }
    if (targetAgent.data.agentType === "group_manager") {
        return "toManager";
    }

    if (sourceAgent.data.agentType === "group_manager") {
        return "fromManager";
    }

    if (!!sourceAgent.data.parentId && !!targetAgent.data.parentId) {
        return "handoff";
    }

    return "nested";
};

/**
 * Get the appropriate icon for group chat type
 */
const getGroupChatIcon = (groupChatType: WaldiezGroupChatType, size: number) => {
    switch (groupChatType) {
        case "handoff":
            return <GiShakingHands size={size} />;
        case "nested":
            return <GiNestEggs size={size} />;
        default:
            return <MdMessage size={size} />;
    }
};

/**
 * Get the edge icon based on edge type
 */
const getEdgeIcon = (type: WaldiezEdgeType, groupChatType: WaldiezGroupChatType, edgeColor?: string) => {
    const size = 18;

    if (type === "group") {
        return getGroupChatIcon(groupChatType, size);
    }

    switch (type) {
        case "chat":
            return <MdMessage color={edgeColor} size={size} />;
        case "nested":
            return <GiNestEggs color={edgeColor} size={size} />;
        default:
            return null;
    }
};

/**
 * Common edge component implementation used by all edge types
 */

const WaldiezEdgeCommon = memo((props: WaldiezEdgeProps) => {
    const {
        id,
        type,
        data,
        style = {},
        sourceX,
        sourceY,
        targetX,
        targetY,
        markerEnd,
        sourcePosition,
        targetPosition,
    } = props;

    // Get edge properties from custom hook
    const {
        edgePath,
        labelX,
        labelY,
        sourceAgent,
        targetAgent,
        isReadOnly,
        onOpenModal,
        onDelete,
        getEdgeById,
        getEdgeColor,
        getEdgeNumber,
    } = useWaldiezEdge(props);

    // Track focus state for interaction UI
    const [focussed, setFocussed] = useState(false);

    // Determine group chat type if applicable
    const groupChatType = useMemo(
        () => (type === "group" ? getGroupChatType(sourceAgent, targetAgent) : "toManager"),
        [type, sourceAgent, targetAgent],
    );

    // Get edge metadata
    const edgeNumber = getEdgeNumber();
    const edge = getEdgeById(id);
    const edgeColor = getEdgeColor();

    // Generate edge icon
    const edgeIcon = useMemo(
        () => getEdgeIcon(type, groupChatType, edgeColor),
        [type, groupChatType, edgeColor],
    );
    const positionTranslation = useMemo(() => {
        const sourceTransform = getEdgeLabelTransformNodeOffset(
            sourceX,
            sourceY,
            targetX,
            targetY,
            labelX,
            labelY,
            sourcePosition,
            targetPosition,
            "source",
            {
                leftOffset: 10, // Labels on left-facing ports go 10px left
                rightOffset: 20, // Labels on right-facing ports go 20px right
                topOffset: 10, // Labels on top-facing ports go 0px up
                bottomOffset: 20, // Labels on bottom-facing ports go 20px down
                perpOffset: 20, // All labels get 20px perpendicular offset
            },
        );
        const targetTransform = getEdgeLabelTransformNodeOffset(
            sourceX,
            sourceY,
            targetX,
            targetY,
            labelX,
            labelY,
            sourcePosition,
            targetPosition,
            "target",
            {
                leftOffset: 10, // Labels on left-facing ports go 10px left
                rightOffset: 10, // Labels on right-facing ports go 10px right
                topOffset: 10, // Labels on top-facing ports go 10px up
                bottomOffset: 10, // Labels on bottom-facing ports go 10px down
                perpOffset: -10, // All labels get -10px perpendicular offset
            },
        );

        return {
            edgeStart: sourceTransform,
            edgeEnd: targetTransform,
        };
    }, [sourceX, sourceY, targetX, targetY, labelX, labelY, sourcePosition, targetPosition]);

    // Event handlers
    const onEdgeClick = useCallback(
        (event: MouseEvent) => {
            if (isReadOnly === true) {
                return;
            }

            if (focussed) {
                (event.target as HTMLDivElement).blur();
                setFocussed(false);
            } else {
                (event.target as HTMLDivElement).focus();
                setFocussed(true);
            }
        },
        [isReadOnly, focussed],
    );

    const onEdgeBlur = useCallback((event: FocusEvent) => {
        (event.target as HTMLDivElement).blur();
        setFocussed(false);
    }, []);

    // Determine edge view content based on edge type and number
    const renderEdgeContent = useMemo(() => {
        if (edgeNumber !== "") {
            return (
                <div className={"agent-edge-view clickable"}>
                    <EdgePosition edge={edge} transform={positionTranslation.edgeStart}>
                        {edgeNumber === "0" ? (
                            <GoAlert size={16} className="edge-position-warning-icon" />
                        ) : (
                            edgeNumber
                        )}
                    </EdgePosition>
                    {edgeIcon}
                </div>
            );
        }

        if (type === "group") {
            return (
                <div className={"agent-edge-view clickable"}>
                    {groupChatType === "fromManager" && (
                        <EdgePosition edge={edge} transform={positionTranslation.edgeStart}>
                            <GoAlert size={16} className="edge-position-warning-icon" />
                        </EdgePosition>
                    )}
                    {groupChatType === "toManager" && (
                        <EdgePosition edge={edge} transform={positionTranslation.edgeStart}>
                            <div className="edge-position">1</div>
                        </EdgePosition>
                    )}
                    <div className="edge-icon">{edgeIcon}</div>
                </div>
            );
        }

        return <div className="agent-edge-view clickable">{edgeIcon}</div>;
    }, [edgeNumber, type, edgeIcon, edge, positionTranslation, groupChatType]);

    // Return empty fragment if edge is hidden or parts are missing
    if (type === "hidden" || !sourceAgent || !targetAgent || !data) {
        return null;
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, color: edgeColor }} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                    }}
                    className={`nodrag nopan clickable agent-edge-box ${sourceAgent.data.agentType}`}
                    onClick={onEdgeClick}
                    data-testid={`edge-${id}-box`}
                    tabIndex={0}
                    onBlur={onEdgeBlur}
                >
                    {focussed && (
                        <div className={"edge-actions"}>
                            <div
                                title="Delete"
                                role="button"
                                onClick={onDelete}
                                className="delete-edge clickable"
                                data-testid={`delete-edge-${id}`}
                                aria-label="Delete edge"
                            >
                                <FaTrash size={12} />
                            </div>
                            <div
                                title="Edit"
                                role="button"
                                onClick={onOpenModal}
                                className="open-edge-modal clickable"
                                data-testid={`open-edge-modal-${id}`}
                                aria-label="Edit edge"
                            >
                                <VscSettings size={12} />
                            </div>
                        </div>
                    )}
                    {renderEdgeContent}
                    <EdgeLabel edge={edge} transform={positionTranslation.edgeEnd} />
                </div>
            </EdgeLabelRenderer>
        </>
    );
});

WaldiezEdgeChat.displayName = "WaldiezEdgeChat";
WaldiezEdgeNested.displayName = "WaldiezEdgeNested";
WaldiezEdgeGroup.displayName = "WaldiezEdgeGroup";
WaldiezEdgeHidden.displayName = "WaldiezEdgeHidden";
WaldiezEdgeCommon.displayName = "WaldiezEdgeCommon";
