/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { BaseEdge, EdgeLabelRenderer, EdgeProps } from "@xyflow/react";

import { memo, useCallback, useMemo, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { GiNestEggs, GiShakingHands } from "react-icons/gi";
import { GoAlert } from "react-icons/go";
import { MdMessage } from "react-icons/md";

import { EdgeLabel } from "@waldiez/containers/edges/edgeLabel";
import { useWaldiezEdge } from "@waldiez/containers/edges/hooks";
import { WaldiezEdgeProps } from "@waldiez/containers/edges/types";
import { getEdgeTranslations } from "@waldiez/containers/edges/utils";
import { WaldiezEdge, WaldiezEdgeType, WaldiezGroupChatType, WaldiezNodeAgent } from "@waldiez/models";

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
    sourceAgent: WaldiezNodeAgent,
    targetAgent: WaldiezNodeAgent,
): WaldiezGroupChatType => {
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
// eslint-disable-next-line max-statements
const WaldiezEdgeCommon = memo((props: WaldiezEdgeProps) => {
    const {
        id,
        type,
        data,
        style = {},
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
        markerEnd,
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

    // Return empty fragment if edge is hidden or agents are missing
    if (type === "hidden" || !sourceAgent || !targetAgent || !data) {
        return null;
    }

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

    // Determine if edge needs position indicator
    const needsPosition = useMemo(
        () =>
            type !== "group" ||
            (type === "group" && (groupChatType === "toManager" || groupChatType === "fromManager")),
        [type, groupChatType],
    );

    const positionClass = needsPosition ? " with-position" : "";

    // Calculate edge translations for start and end labels
    const translations = useMemo(
        () => getEdgeTranslations(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition),
        [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition],
    );

    // Event handlers
    const onEdgeClick = useCallback(
        (event: React.MouseEvent) => {
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

    const onEdgeBlur = useCallback((event: React.FocusEvent) => {
        (event.target as HTMLDivElement).blur();
        setFocussed(false);
    }, []);

    // Determine edge view content based on edge type and number
    const renderEdgeContent = useMemo(() => {
        if (edgeNumber !== "") {
            return (
                <div className={`agent-edge-view clickable${positionClass}`}>
                    <div className="edge-position">
                        {edgeNumber === "0" ? (
                            <GoAlert size={16} className="edge-position-warning-icon" />
                        ) : (
                            edgeNumber
                        )}
                    </div>
                    {edgeIcon}
                </div>
            );
        }

        if (type === "group") {
            return (
                <div className={`agent-edge-view clickable${positionClass}`}>
                    {groupChatType === "fromManager" && (
                        <div className="edge-position">
                            <GoAlert size={16} className="edge-position-warning-icon" />
                        </div>
                    )}
                    {groupChatType === "toManager" && <div className="edge-position">1</div>}
                    <div className="edge-icon">{edgeIcon}</div>
                </div>
            );
        }

        return <div className="agent-edge-view clickable">{edgeIcon}</div>;
    }, [edgeNumber, edgeIcon, positionClass, type, groupChatType]);

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
                    className={`nodrag nopan clickable agent-edge-box ${sourceAgent.data.agentType}${positionClass}`}
                    onClick={onEdgeClick}
                    data-testid={`edge-${id}-box`}
                    tabIndex={0}
                    onBlur={onEdgeBlur}
                >
                    {focussed && (
                        <div className={`edge-actions${positionClass}`}>
                            <div
                                title="Delete"
                                role="button"
                                onClick={onDelete}
                                className="delete-edge clickable"
                                data-testid={`delete-edge-${id}`}
                                aria-label="Delete edge"
                            >
                                <FaTrashAlt />
                            </div>
                            <div
                                title="Edit"
                                role="button"
                                onClick={onOpenModal}
                                className="open-edge-modal clickable"
                                data-testid={`open-edge-modal-${id}`}
                                aria-label="Edit edge"
                            >
                                <FaGear />
                            </div>
                        </div>
                    )}
                    {renderEdgeContent}
                </div>
                <EdgeLabel edge={edge} transform={translations.edgeEnd} />
            </EdgeLabelRenderer>
        </>
    );
});

// Add display names for better debugging
WaldiezEdgeChat.displayName = "WaldiezEdgeChat";
WaldiezEdgeNested.displayName = "WaldiezEdgeNested";
WaldiezEdgeGroup.displayName = "WaldiezEdgeGroup";
WaldiezEdgeHidden.displayName = "WaldiezEdgeHidden";
WaldiezEdgeCommon.displayName = "WaldiezEdgeCommon";
