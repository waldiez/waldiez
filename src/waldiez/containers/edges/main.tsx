/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { BaseEdge, EdgeLabelRenderer, EdgeProps } from "@xyflow/react";

import { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { GiNestEggs, GiShakingHands } from "react-icons/gi";
import { GoAlert } from "react-icons/go";
import { MdMessage } from "react-icons/md";

import { EdgeLabel } from "@waldiez/containers/edges/edgeLabel";
import { useWaldiezEdge } from "@waldiez/containers/edges/hooks";
import { WaldiezEdgeProps } from "@waldiez/containers/edges/types";
import { getEdgeTranslations } from "@waldiez/containers/edges/utils";
import { WaldiezEdge, WaldiezEdgeType, WaldiezNodeAgent } from "@waldiez/models";

export const WaldiezEdgeChat = (props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="chat" />;
};

export const WaldiezEdgeNested = (props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="nested" />;
};

export const WaldiezEdgeGroup = (props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="group" />;
};

export const WaldiezEdgeHidden = (props: EdgeProps<WaldiezEdge>) => {
    return <WaldiezEdgeCommon {...props} type="hidden" />;
};

type GroupChatType = "source" | "target" | "nested" | "handoff";

// eslint-disable-next-line max-statements
const WaldiezEdgeCommon = (props: WaldiezEdgeProps) => {
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
    const [focussed, setFocussed] = useState(false);
    if (type === "hidden" || !sourceAgent || !targetAgent || !data) {
        // if not hidden, the source agent might be recently deleted
        return <></>;
    }
    const groupChatType = type === "group" ? getGroupChatType(sourceAgent, targetAgent) : "source";
    const edgeNumber = getEdgeNumber();
    const edge = getEdgeById(id);
    const edgeColor = getEdgeColor();
    const edgeIcon = getEdgeIcon(type, groupChatType, edgeColor);
    const needsPosition =
        type !== "group" || (type === "group" && (groupChatType === "source" || groupChatType === "target"));
    const positionClass = needsPosition ? " with-position" : "";
    const translations = getEdgeTranslations(
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    );

    const onEdgeClick = (event: React.MouseEvent) => {
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
    };

    const onEdgeBlur = (event: React.FocusEvent) => {
        (event.target as HTMLDivElement).blur();
        setFocussed(false);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, color: edgeColor }} />
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
                    {edgeNumber !== "" ? (
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
                    ) : type === "group" ? (
                        <div className={`agent-edge-view clickable${positionClass}`}>
                            {groupChatType === "target" && (
                                <div className="edge-position">
                                    <GoAlert size={16} className="edge-position-warning-icon" />
                                </div>
                            )}
                            {groupChatType === "source" && <div className="edge-position">1</div>}
                            <div className="edge-icon">{edgeIcon}</div>
                        </div>
                    ) : (
                        <div className="agent-edge-view clickable">{edgeIcon}</div>
                    )}
                </div>
                <EdgeLabel edge={edge} transform={translations.edgeEnd} />
            </EdgeLabelRenderer>
        </>
    );
};

const getGroupChatType = (sourceAgent: WaldiezNodeAgent, targetAgent: WaldiezNodeAgent) => {
    if (targetAgent.data.agentType === "group_manager") {
        return "source" as GroupChatType;
    }
    if (sourceAgent.data.agentType === "group_manager") {
        return "target" as GroupChatType;
    }
    if (!!sourceAgent.data.parentId && !!targetAgent.data.parentId) {
        return "handoff" as GroupChatType;
    }
    return "nested" as GroupChatType;
};

const getGroupChatIcon = (groupChatType: GroupChatType, size: number) => {
    const icon =
        groupChatType === "handoff" ? (
            <GiShakingHands size={size} />
        ) : groupChatType === "nested" ? (
            <GiNestEggs size={size} />
        ) : (
            <MdMessage size={size} />
        );
    return icon;
};
const getEdgeIcon = (type: WaldiezEdgeType, groupChatType: GroupChatType, edgeColor?: string) => {
    const size = 18;
    if (type === "group") {
        return getGroupChatIcon(groupChatType, size);
    }
    const edgeIcon =
        type === "chat" ? (
            <MdMessage color={edgeColor} size={size} />
        ) : type === "nested" ? (
            <GiNestEggs color={edgeColor} size={size} />
        ) : (
            <></>
        );
    return edgeIcon;
};
