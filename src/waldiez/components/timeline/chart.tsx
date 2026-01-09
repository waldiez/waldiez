/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useState } from "react";

import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export const TimelineChart = ({
    data,
    width,
    height,
    darkMode = false,
}: {
    data: WaldiezTimelineData;
    width: number;
    height: number;
    darkMode: boolean;
}) => {
    const [hoveredItem, setHoveredItem] = useState<any>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const margin = { top: 40, right: 140, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!data || !data.timeline || data.timeline.length === 0) {
        return null;
    }

    // Calculate scales
    const maxTime = data.metadata.time_range[1];
    const maxCost = Math.max(...data.cost_timeline.map((d: any) => d.cumulative_cost));

    const xScale = (value: number) => (value / maxTime) * chartWidth;
    const yScale = (value: number) => chartHeight - (value / maxCost) * chartHeight;

    // Generate path for cost line
    const costLinePath = data.cost_timeline
        .map((d: any, i: number) => {
            const x = xScale(d.time);
            const y = yScale(d.cumulative_cost);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

    const handleMouseMove = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Theme-aware colors
    const gridColor = darkMode ? "#374151" : "#e2e8f0";
    const axisColor = darkMode ? "#9CA3AF" : "#64748b";
    const costLineColor = "#8B5CF6"; // Purple color
    const textColor = darkMode ? "#F3F4F6" : "#333";

    return (
        <div className="relative">
            <svg
                width={width}
                height={height}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredItem(null)}
            >
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                        <g key={`grid-${ratio}`}>
                            <line
                                x1={chartWidth * ratio}
                                y1={0}
                                x2={chartWidth * ratio}
                                y2={chartHeight}
                                stroke={gridColor}
                                strokeDasharray="2,2"
                                strokeWidth={1}
                            />
                            <line
                                x1={0}
                                y1={chartHeight * ratio}
                                x2={chartWidth}
                                y2={chartHeight * ratio}
                                stroke={gridColor}
                                strokeDasharray="2,2"
                                strokeWidth={1}
                            />
                        </g>
                    ))}

                    {/* Timeline items */}
                    {data.timeline.map((item: any, i: number) => {
                        let itemY;

                        if (item.type === "session") {
                            // Position sessions based on their cumulative cost
                            const costPoint = data.cost_timeline.find(
                                (c: any) => c.session_id === item.y_position,
                            );
                            itemY = yScale(costPoint?.cumulative_cost || 0) - 10;
                        } else {
                            // Position gaps next to the previous session
                            const prevSessionIndex = data.timeline
                                .slice(0, i)
                                .reverse()
                                .findIndex((t: any) => t.type === "session");
                            if (prevSessionIndex !== -1) {
                                const prevSession = data.timeline[i - 1 - prevSessionIndex];
                                const prevCostPoint = data.cost_timeline.find(
                                    (c: any) => c.session_id === prevSession?.y_position,
                                );
                                itemY = yScale(prevCostPoint?.cumulative_cost || 0) - 10;
                            } else {
                                itemY = yScale(0) - 10; // Fallback to zero cost level
                            }
                        }

                        return (
                            <g key={item.id}>
                                <rect
                                    x={xScale(item.start)}
                                    y={itemY}
                                    width={xScale(item.duration)}
                                    height={20}
                                    fill={item.type === "session" ? item.color : "#D1D5DB"}
                                    stroke={item.type === "session" ? item.color : "#9CA3AF"}
                                    strokeWidth={2}
                                    rx={8}
                                    fillOpacity={0.1}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() => setHoveredItem({ ...item, index: i })}
                                />

                                {/* Label for gaps */}
                                {item.type === "gap" && (
                                    <text
                                        x={xScale(item.start + item.duration / 2)}
                                        y={itemY + 14}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fill={darkMode ? "#F3F4F6" : "white"}
                                        pointerEvents="none"
                                    >
                                        {item.gap_type === "human_input_waiting"
                                            ? `👤 ${item.real_duration?.toFixed(0)}s`
                                            : `${item.label.split(" ")[0]} `}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Cost line */}
                    <path d={costLinePath} fill="none" stroke={costLineColor} strokeWidth={2} />

                    {/* Cost dots */}
                    {data.cost_timeline.map((d: any, i: number) => (
                        <circle
                            key={`dot-${i}`}
                            cx={xScale(d.time)}
                            cy={yScale(d.cumulative_cost)}
                            r={4}
                            fill={costLineColor}
                            stroke={darkMode ? "#1F2937" : "white"}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() =>
                                setHoveredItem({
                                    type: "cost_point",
                                    cost_data: d,
                                    index: i,
                                })
                            }
                        />
                    ))}

                    {/* X-axis */}
                    <g transform={`translate(0, ${chartHeight})`}>
                        <line x1={0} y1={0} x2={chartWidth} y2={0} stroke={axisColor} />
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                            <g key={`x-tick-${ratio}`}>
                                <line
                                    x1={chartWidth * ratio}
                                    y1={0}
                                    x2={chartWidth * ratio}
                                    y2={6}
                                    stroke={axisColor}
                                />
                                <text
                                    x={chartWidth * ratio}
                                    y={20}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill={axisColor}
                                >
                                    {(maxTime * ratio).toFixed(1)}s
                                </text>
                            </g>
                        ))}
                        <text
                            x={chartWidth / 2}
                            y={45}
                            textAnchor="middle"
                            fontSize="14"
                            fontWeight="500"
                            fill={textColor}
                        >
                            Compressed Timeline (seconds)
                        </text>
                    </g>

                    {/* Y-axis (right side for cost) */}
                    <g transform={`translate(${chartWidth}, 0)`}>
                        <line x1={0} y1={0} x2={0} y2={chartHeight} stroke={costLineColor} />
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                            <g key={`y-tick-${ratio}`}>
                                <line
                                    x1={0}
                                    y1={chartHeight * ratio}
                                    x2={6}
                                    y2={chartHeight * ratio}
                                    stroke={costLineColor}
                                />
                                <text
                                    x={20}
                                    y={chartHeight * ratio}
                                    textAnchor="start"
                                    dominantBaseline="middle"
                                    fontSize="12"
                                    fill={costLineColor}
                                >
                                    ${(maxCost * (1 - ratio)).toFixed(6)}
                                </text>
                            </g>
                        ))}
                        <text
                            x={120}
                            y={chartHeight / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="14"
                            fontWeight="500"
                            fill={costLineColor}
                            transform={`rotate(-90, 120, ${chartHeight / 2})`}
                        >
                            Cumulative Cost ($)
                        </text>
                    </g>
                </g>
            </svg>

            {/* Custom Tooltip */}
            {hoveredItem && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: mousePos.x + 10,
                        top: mousePos.y - 10,
                        transform: mousePos.x > width / 2 ? "translateX(-100%)" : undefined,
                    }}
                >
                    <div className="card">
                        <div className="card-content padding-10">
                            {hoveredItem.type === "session" && (
                                <>
                                    <div className="font-semibold text-sm">
                                        {hoveredItem.agent.replace(/_/g, " ")}
                                    </div>
                                    <div className="text-xs space-y-0_5">
                                        <div>
                                            LLM: <span className="font-medium">{hoveredItem.llm_model}</span>
                                        </div>
                                        <div>Cost: ${hoveredItem.cost.toFixed(6)}</div>
                                        <div>Duration: {hoveredItem.duration.toFixed(2)}s</div>
                                        {hoveredItem.tokens > 0 && (
                                            <div>
                                                Tokens: {hoveredItem.prompt_tokens.toLocaleString()} in +{" "}
                                                {hoveredItem.completion_tokens.toLocaleString()} out
                                            </div>
                                        )}
                                        <div>Cache: {hoveredItem.is_cached ? "Cached" : "Fresh"}</div>
                                        {hoveredItem.real_start_time && (
                                            <div>Started: {hoveredItem.real_start_time}</div>
                                        )}
                                    </div>
                                </>
                            )}
                            {hoveredItem.type === "gap" && (
                                <>
                                    <div className="font-semibold text-sm">{hoveredItem.label}</div>
                                    <div className="text-xs space-y-0_5">
                                        <div>Type: {hoveredItem.gap_type.replace(/_/g, " ")}</div>
                                        <div>Original Duration: {hoveredItem.real_duration?.toFixed(1)}s</div>
                                        {hoveredItem.compressed && (
                                            <div>Compressed to: {hoveredItem.duration.toFixed(1)}s</div>
                                        )}
                                    </div>
                                </>
                            )}
                            {hoveredItem.type === "cost_point" && (
                                <>
                                    <div className="font-semibold text-sm">
                                        Cumulative Cost: ${hoveredItem.cost_data.cumulative_cost.toFixed(6)}
                                    </div>
                                    <div className="text-xs space-y-0_5">
                                        <div>
                                            Session Cost: ${hoveredItem.cost_data.session_cost.toFixed(6)}
                                        </div>
                                        <div>Session: {hoveredItem.cost_data.session_id}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
