/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdge } from "@waldiez/models";

export const EdgeLabel = ({ edge, transform }: { edge: WaldiezEdge | undefined; transform: string }) => {
    if (!edge) {
        return null;
    }
    const label = edge.data?.label ?? "";
    if (label === "") {
        return null;
    }
    const trimmedTo20 = label.length > 20 ? `${label.slice(0, 20)}...` : label;
    return (
        <div
            style={{
                position: "absolute",
                // background: "red",
                padding: 10,
                color: "currentcolor",
                fontSize: 12,
                fontWeight: 700,
                zIndex: 9999,
                transform,
            }}
            className="nodrag nopan"
        >
            {trimmedTo20}
        </div>
    );
};
