/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    CartesianGrid,
    ComposedChart,
    Customized,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { FiActivity, FiClock, FiDollarSign, FiFileText, FiUser } from "react-icons/fi";

import { OverlayRects } from "@waldiez/components/timeline/overlayRects";
import { TimelineTooltip } from "@waldiez/components/timeline/tooltip";
import { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { useWaldiezTheme } from "@waldiez/theme";

export const Timeline: React.FC<{
    data: WaldiezTimelineData;
    width?: number | string;
    height?: number | string;
}> = ({ data, height = 400 }) => {
    const { isDark } = useWaldiezTheme();
    return (
        <div className="full-width padding-10">
            <div className="timeline-grid margin-bottom-10">
                {[
                    { label: "Sessions", value: data.summary.total_sessions, icon: FiActivity },
                    {
                        label: "Total Cost",
                        value: `$${data.summary.total_cost.toFixed(6)}`,
                        icon: FiDollarSign,
                    },
                    { label: "Duration", value: `${data.summary.total_time.toFixed(1)}s`, icon: FiClock },
                    { label: "Agents", value: data.summary.total_agents, icon: FiUser },
                    {
                        label: "Tokens",
                        value: data.summary.total_tokens?.toLocaleString() || "N/A",
                        icon: FiFileText,
                    },
                    {
                        label: "Avg Cost",
                        value: `$${data.summary.avg_cost_per_session.toFixed(6)}`,
                        icon: FiDollarSign,
                    },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="card">
                        <div className="card-content">
                            <div className="timeline-top">
                                <Icon className={"timeline-icon"} />
                                <div className="timeline-top-content">
                                    <p className="timeline-label">{label}</p>
                                    <p className="timeline-value">{value}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Session Activity Timeline with Cumulative Cost</h3>
                    <p className={"card-description"}>
                        Interactive timeline showing agent sessions and cost accumulation (human input periods
                        compressed)
                        {data.summary.compression_info.gaps_compressed > 0 && (
                            <span className="badge badge-secondary" style={{ marginLeft: "0.5rem" }}>
                                {data.summary.compression_info.gaps_compressed} gaps compressed,
                                {data.summary.compression_info.time_saved.toFixed(1)}s saved
                            </span>
                        )}
                    </p>
                </div>
                <div className="card-content">
                    <div className="full-width">
                        <ResponsiveContainer width="100%" height={height}>
                            <ComposedChart
                                data={data.cost_timeline}
                                margin={{ top: 40, right: 100, bottom: 60, left: 80 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDark ? "#374151" : "#e2e8f0"}
                                />
                                <XAxis
                                    type="number"
                                    dataKey="time"
                                    domain={data.metadata.time_range}
                                    tick={{ fill: isDark ? "#9CA3AF" : "#64748b" }}
                                    label={{
                                        value: "Compressed Timeline (seconds)",
                                        position: "insideBottom",
                                        offset: -10,
                                        fill: isDark ? "#F3F4F6" : "#333",
                                        fontWeight: 500,
                                    }}
                                    tickFormatter={v => `${v.toFixed(1)}s`}
                                />
                                <YAxis
                                    yAxisId="cost"
                                    orientation="right"
                                    domain={data.metadata.cost_range}
                                    stroke="#8B5CF6"
                                    tick={{ fill: "#8B5CF6" }}
                                    tickFormatter={v => `${v.toFixed(4)}`}
                                    label={{
                                        value: "Cumulative Cost ($)",
                                        angle: -90,
                                        position: "insideright",
                                        offset: 20,
                                        fill: "#8B5CF6",
                                        fontWeight: 500,
                                        dx: 50,
                                    }}
                                />
                                <Tooltip content={<TimelineTooltip />} />
                                <Line
                                    yAxisId="cost"
                                    type="monotone"
                                    dataKey="cumulative_cost"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                                    connectNulls
                                />
                                {/* Overlay for session/gap rects, dots, icons */}
                                <Customized
                                    component={(props: any) => (
                                        <OverlayRects {...(props as any)} data={data} />
                                    )}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Agent Legend */}
                    {data.agents.length > 0 && (
                        // <div className="mt-4 flex flex-wrap gap-2">
                        <div className="timeline-agent-list">
                            {data.agents.map(agent => (
                                <div key={agent.name} className={"timeline-agent-item"}>
                                    <div
                                        className="timeline-agent-dot"
                                        style={{ backgroundColor: agent.color }}
                                    />
                                    <span className="timeline-agent-name">
                                        {agent.name.replace(/_/g, " ")}
                                    </span>
                                    <span className="timeline-agent-class">({agent.class})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
