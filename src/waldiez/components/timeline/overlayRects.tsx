/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export const OverlayRects = (props: {
    xAxisMap: Record<string, any>;
    yAxisMap: Record<string, any>;
    data: WaldiezTimelineData;
}) => {
    if (!props || !props.xAxisMap || !props.data) {
        console.warn("OverlayRects called with incomplete props:", props);
        return null;
    }

    const { xAxisMap, yAxisMap, data } = props;
    const xScale = xAxisMap[0].scale; // X axis is at key "0"
    const yScale = yAxisMap.cost.scale; // Y axis is at key "cost"

    return (
        <g>
            {data.timeline.map((item, i) => {
                const x1 = xScale(item.start);
                const x2 = xScale(item.end);
                const w = Math.max(x2 - x1, 32);

                let itemY;

                if (item.type === "session") {
                    // Position sessions based on their cumulative cost
                    const costPoint = data.cost_timeline.find(c => c.session_id === item.y_position);
                    itemY = yScale(costPoint?.cumulative_cost || 0) - 10;
                } else {
                    // Position gaps next to the previous session
                    const prevSessionIndex = data.timeline
                        .slice(0, i)
                        .reverse()
                        .findIndex(t => t.type === "session");
                    if (prevSessionIndex !== -1) {
                        const prevSession = data.timeline[i - 1 - prevSessionIndex];
                        const prevCostPoint = data.cost_timeline.find(
                            c => c.session_id === prevSession.y_position,
                        );
                        itemY = yScale(prevCostPoint?.cumulative_cost || 0) - 10;
                    } else {
                        itemY = yScale(0) - 10; // Fallback to zero cost level
                    }
                }

                return (
                    <g key={item.id}>
                        <rect
                            x={x1}
                            y={itemY}
                            width={w}
                            height={20} // Original uses 20, not 36
                            fill={item.type === "session" ? item.color : "#D1D5DB"}
                            stroke={item.type === "session" ? item.color : "#9CA3AF"}
                            strokeWidth={2}
                            rx={8} // Original uses 8, not 18
                            fillOpacity={0.1} // Original uses 0.1, not 0.18/0.11
                        />

                        {/* Label for gaps - matches original exactly */}
                        {item.type === "gap" && (
                            <text
                                x={x1 + w / 2}
                                y={itemY + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fontWeight="bold"
                                // fill={isDark ? "#F3F4F6" : "white"}
                                pointerEvents="none"
                            >
                                {item.gap_type === "human_input_waiting"
                                    ? `👤 ${item.real_duration?.toFixed(0)}s`
                                    : item.label.split(" ")[0]}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
};
