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

import { CostPoint, TimelineData } from "@waldiez/components/timeline/types";
import { useWaldiezTheme } from "@waldiez/theme";

export const Timeline: React.FC<{
    data: TimelineData;
    width?: number | string;
    height?: number | string;
}> = ({ data, height = 400 }) => {
    const { isDark } = useWaldiezTheme();
    // --- Custom tooltip ---
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
        if (!active || !payload || payload.length === 0) {
            return null;
        }
        const d = payload[0].payload as CostPoint;
        return (
            <div className="card">
                <div className="card-content">
                    <div className="font-semibold text-sm">
                        Cumulative Cost: ${d.cumulative_cost?.toFixed(6)}
                    </div>
                    <div className="text-xs space-y-0.5">
                        <div>Session Cost: ${d.session_cost?.toFixed(6)}</div>
                        <div>Session: {d.session_id}</div>
                    </div>
                </div>
            </div>
        );
    };
    // ---- SVG overlay for session/gap rects and icons ----
    const OverlayRects = data.timeline.length
        ? (props: any) => {
              // Defensive: sometimes gets called early with incomplete props
              if (
                  !props ||
                  !props.height ||
                  !props.width ||
                  !props.xAxisMap ||
                  !props.yAxisMap ||
                  !props.offset
              ) {
                  return null;
              }
              const { xAxisMap, offset, height } = props;
              const xScale = xAxisMap[Object.keys(xAxisMap)[0]]?.scale;
              // Y for all rects: a bit above bottom
              const baseY = height - offset.bottom - 42;

              return (
                  <g>
                      {data.timeline.map(item => {
                          const x1 = xScale(item.start);
                          const x2 = xScale(item.end);
                          const w = Math.max(x2 - x1, 32);
                          // Only a single row of bars, adjust as needed
                          const y = baseY;
                          return (
                              <g key={item.id}>
                                  <rect
                                      x={x1}
                                      y={y}
                                      width={w}
                                      height={36}
                                      rx={18}
                                      fill={item.color}
                                      fillOpacity={item.type === "gap" ? 0.18 : 0.11}
                                      stroke={item.color}
                                      strokeOpacity={0.65}
                                      strokeWidth={2}
                                  />
                                  {/* Center dot */}
                                  <circle
                                      cx={x1 + w / 2}
                                      cy={y + 18}
                                      r={5}
                                      fill={isDark ? "#222" : "#fff"}
                                      stroke={item.color}
                                      strokeWidth={2}
                                  />
                                  {/* Icon for gap, label for session */}
                                  {item.type === "gap" && (
                                      <text
                                          x={x1 + w / 2}
                                          y={y + 24}
                                          textAnchor="middle"
                                          fontSize={18}
                                          opacity={0.82}
                                      >
                                          👤
                                      </text>
                                  )}
                                  {item.type === "session" && w > 40 && (
                                      <text
                                          x={x1 + w / 2}
                                          y={y + 35}
                                          textAnchor="middle"
                                          fontWeight={600}
                                          fontSize={11}
                                          fill={item.color}
                                          opacity={0.92}
                                      >
                                          {item.label}
                                      </text>
                                  )}
                              </g>
                          );
                      })}
                  </g>
              );
          }
        : () => null;
    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                            {/* <CardContent className="p-4"> */}
                            <div className="flex items-center space-x-2">
                                <Icon className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                <div className="space-y-1">
                                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                                        {label}
                                    </p>
                                    <p
                                        className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                                    >
                                        {value}
                                    </p>
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
                                margin={{ top: 40, right: 120, bottom: 60, left: 80 }}
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
                                        position: "insideRight",
                                        offset: 20,
                                        fill: "#8B5CF6",
                                        fontWeight: 500,
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
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
                                <Customized component={OverlayRects} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Agent Legend */}
                    {data.agents.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {data.agents.map(agent => (
                                <div
                                    key={agent.name}
                                    className={`flex items-center gap-2 text-xs rounded-md px-2 py-1 border ${
                                        isDark
                                            ? "bg-gray-700 border-gray-600 text-gray-200"
                                            : "bg-white border-gray-200 text-gray-700"
                                    }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full border border-white"
                                        style={{ backgroundColor: agent.color }}
                                    />
                                    <span>{agent.name.replace(/_/g, " ")}</span>
                                    <span className="text-xs opacity-70">({agent.class})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
