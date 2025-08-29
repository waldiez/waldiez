/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ResponsiveContainer } from "recharts";

import React, { useLayoutEffect, useRef, useState } from "react";
import { FiActivity, FiClock, FiDollarSign, FiFileText, FiUser } from "react-icons/fi";

import { TimelineChart } from "@waldiez/components/timeline/chart";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { useWaldiezTheme } from "@waldiez/theme";

export const Timeline: React.FC<{
    data: WaldiezTimelineData;
    width?: number | string;
    height?: number | string;
}> = ({ data, height = 400 }) => {
    const { isDark } = useWaldiezTheme();
    const chartRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (chartRef.current) {
            const svgElement = chartRef.current.querySelector("svg");
            if (svgElement) {
                const width = parseInt(svgElement.getAttribute("width") || "800");
                const height = parseInt(svgElement.getAttribute("height") || "400");
                setDimensions({ width, height });
            }
        }
    }, []);
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
                            <TimelineChart
                                width={dimensions.width}
                                height={dimensions.height}
                                data={data}
                                darkMode={isDark}
                            />
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
