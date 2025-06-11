/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Position } from "@xyflow/react";

/**
 * Position labels relative to their respective nodes, not the edge center
 * This ensures they stay "attached" to source/target when nodes move
 */
// eslint-disable-next-line max-statements
export const getEdgeLabelTransform = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    labelX: number,
    labelY: number,
    labelType: "source" | "target",
    options: {
        distance?: number;
        perpOffset?: number;
    } = {},
): string => {
    const { distance = 60, perpOffset = 25 } = options;

    if (labelType === "source") {
        // Position relative to SOURCE node, offset from edge center
        const offsetFromCenterX = sourceX - labelX;
        const offsetFromCenterY = sourceY - labelY;

        // Add some distance along the edge direction
        const edgeDx = targetX - sourceX;
        const edgeDy = targetY - sourceY;
        const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);

        if (edgeLength > 0) {
            const edgeUx = edgeDx / edgeLength;
            const edgeUy = edgeDy / edgeLength;

            // Move a bit towards the target from the source
            const finalX = offsetFromCenterX + edgeUx * distance;
            const finalY = offsetFromCenterY + edgeUy * distance;

            // Add perpendicular offset
            const perpX = finalX + -edgeUy * perpOffset;
            const perpY = finalY + edgeUx * perpOffset;

            return `translate(-50%, -50%) translate(${perpX}px, ${perpY}px)`;
        }

        return `translate(-50%, -50%) translate(${offsetFromCenterX}px, ${offsetFromCenterY}px)`;
    } else {
        // Position relative to TARGET node, offset from edge center
        const offsetFromCenterX = targetX - labelX;
        const offsetFromCenterY = targetY - labelY;

        // Add some distance along the edge direction
        const edgeDx = sourceX - targetX;
        const edgeDy = sourceY - targetY;
        const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);

        if (edgeLength > 0) {
            const edgeUx = edgeDx / edgeLength;
            const edgeUy = edgeDy / edgeLength;

            // Move a bit towards the source from the target
            const finalX = offsetFromCenterX + edgeUx * distance;
            const finalY = offsetFromCenterY + edgeUy * distance;

            // Add perpendicular offset
            const perpX = finalX + -edgeUy * perpOffset;
            const perpY = finalY + edgeUx * perpOffset;

            return `translate(-50%, -50%) translate(${perpX}px, ${perpY}px)`;
        }

        return `translate(-50%, -50%) translate(${offsetFromCenterX}px, ${offsetFromCenterY}px)`;
    }
};

/**
 * Alternative: Position at fixed percentage along the edge from each node
 * Labels will stay at consistent distance from their nodes
 */
// eslint-disable-next-line max-statements
export const getEdgeLabelTransformFixed = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    labelX: number,
    labelY: number,
    labelType: "source" | "target",
    targetPosition?: Position,
    options: {
        sourceFraction?: number; // How far from source (0 = on source, 1 = on target)
        targetFraction?: number; // How far from target (0 = on target, 1 = on source)
        perpOffset?: number;
    } = {},
): string => {
    const {
        sourceFraction = 0.3, // 30% along edge from source
        targetFraction = 0.3, // 30% along edge from target
        perpOffset = 25,
    } = options;

    if (labelType === "source") {
        // Position at fixed fraction from source towards target
        const labelPosX = sourceX + (targetX - sourceX) * sourceFraction;
        const labelPosY = sourceY + (targetY - sourceY) * sourceFraction;

        // Offset from edge center to this position
        const offsetX = labelPosX - labelX;
        const offsetY = labelPosY - labelY;

        // Add perpendicular offset
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
            const perpX = (-dy / length) * perpOffset;
            const perpY = (dx / length) * perpOffset;

            return `translate(-50%, -50%) translate(${offsetX + perpX}px, ${offsetY + perpY}px)`;
        }

        return `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
    } else {
        // Position at fixed fraction from target towards source
        const labelPosX = targetX + (sourceX - targetX) * targetFraction;
        const labelPosY = targetY + (sourceY - targetY) * targetFraction;

        // Offset from edge center to this position
        const offsetX = labelPosX - labelX;
        const offsetY = labelPosY - labelY;

        // Add perpendicular offset
        const dx = sourceX - targetX;
        const dy = sourceY - targetY;
        const length = Math.sqrt(dx * dx + dy * dy);

        let transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;

        if (length > 0) {
            const perpX = (-dy / length) * perpOffset;
            const perpY = (dx / length) * perpOffset;

            transform = `translate(-50%, -50%) translate(${offsetX + perpX}px, ${offsetY + perpY}px)`;
        }

        // Add rotation for target labels when position is left or right
        if (targetPosition === Position.Left) {
            transform += " rotate(-90deg)";
        } else if (targetPosition === Position.Right) {
            transform += " rotate(90deg)";
        }

        return transform;
    }
};

/**
 * Dynamic offset based on port position
 */
// eslint-disable-next-line max-statements
export const getEdgeLabelTransformNodeOffset = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    labelX: number,
    labelY: number,
    sourcePosition: Position,
    targetPosition: Position,
    labelType: "source" | "target",
    options: {
        leftOffset?: number;
        rightOffset?: number;
        topOffset?: number;
        bottomOffset?: number;
        perpOffset?: number;
    } = {},
): string => {
    const {
        leftOffset = 60, // Distance for left-facing ports
        rightOffset = 60, // Distance for right-facing ports
        topOffset = 50, // Distance for top-facing ports
        bottomOffset = 50, // Distance for bottom-facing ports
        perpOffset = 20, // Perpendicular offset from port direction
    } = options;

    if (labelType === "source") {
        let nodeOffsetX = sourceX;
        let nodeOffsetY = sourceY;

        // Offset based on source port position with dynamic distances
        switch (sourcePosition) {
            case Position.Right:
                nodeOffsetX += rightOffset;
                nodeOffsetY += perpOffset;
                break;
            case Position.Left:
                nodeOffsetX -= leftOffset;
                nodeOffsetY += perpOffset;
                break;
            case Position.Top:
                nodeOffsetY -= topOffset;
                nodeOffsetX += perpOffset;
                break;
            case Position.Bottom:
                nodeOffsetY += bottomOffset;
                nodeOffsetX += perpOffset;
                break;
        }

        // Convert to offset from edge center
        const offsetFromCenterX = nodeOffsetX - labelX;
        const offsetFromCenterY = nodeOffsetY - labelY;

        return `translate(-50%, -50%) translate(${offsetFromCenterX}px, ${offsetFromCenterY}px)`;
    } else {
        let nodeOffsetX = targetX;
        let nodeOffsetY = targetY;

        // Offset based on target port position with dynamic distances
        switch (targetPosition) {
            case Position.Right:
                nodeOffsetX += rightOffset;
                nodeOffsetY += perpOffset;
                break;
            case Position.Left:
                nodeOffsetX -= leftOffset;
                nodeOffsetY += perpOffset;
                break;
            case Position.Top:
                nodeOffsetY -= topOffset;
                nodeOffsetX += perpOffset;
                break;
            case Position.Bottom:
                nodeOffsetY += bottomOffset;
                nodeOffsetX += perpOffset;
                break;
        }

        // Convert to offset from edge center
        const offsetFromCenterX = nodeOffsetX - labelX;
        const offsetFromCenterY = nodeOffsetY - labelY;

        let transform = `translate(-50%, -50%) translate(${offsetFromCenterX}px, ${offsetFromCenterY}px)`;

        // Add rotation for target labels when position is left or right
        if (targetPosition === Position.Left) {
            transform += " rotate(-90deg)";
        } else if (targetPosition === Position.Right) {
            transform += " rotate(90deg)";
        }

        return transform;
    }
};

// Convenience wrapper
export const getEdgeLabelTransforms = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    labelX: number,
    labelY: number,
    sourcePosition: Position,
    targetPosition: Position,
    approach: "node-relative" | "fixed-fraction" | "node-offset" = "fixed-fraction",
) => {
    switch (approach) {
        case "node-relative":
            return {
                sourceTransform: getEdgeLabelTransform(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    "source",
                ),
                targetTransform: getEdgeLabelTransform(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    "target",
                ),
            };
        case "fixed-fraction":
            return {
                sourceTransform: getEdgeLabelTransformFixed(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    "source",
                ),
                targetTransform: getEdgeLabelTransformFixed(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    "target",
                    targetPosition,
                ),
            };
        case "node-offset":
            return {
                sourceTransform: getEdgeLabelTransformNodeOffset(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    sourcePosition,
                    targetPosition,
                    "source",
                ),
                targetTransform: getEdgeLabelTransformNodeOffset(
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    labelX,
                    labelY,
                    sourcePosition,
                    targetPosition,
                    "target",
                ),
            };
        default:
            return {
                sourceTransform: "translate(-50%, -50%) translate(0px, 0px)",
                targetTransform: "translate(-50%, -50%) translate(0px, 0px)",
            };
    }
};
