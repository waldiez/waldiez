/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdge } from "@waldiez/models";

export const EdgePosition = ({
    edge,
    transform,
    edgeNumber,
    children,
}: {
    edge: WaldiezEdge | undefined;
    transform: string;
    edgeNumber?: number;
    children?: React.ReactNode;
}) => {
    if (!edge) {
        return null;
    }
    // Optionally, allow passing children for warning icon, etc
    return (
        <div
            style={{
                position: "absolute",
                color: "currentcolor",
                width: "max-content",
                fontSize: 12,
                fontWeight: 600,
                zIndex: 10001,
                transform,
            }}
            className="nodrag nopan"
        >
            {children || edgeNumber || ""}
        </div>
    );
};
EdgePosition.displayName = "EdgePosition";
