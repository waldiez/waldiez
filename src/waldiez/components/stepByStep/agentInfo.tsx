/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import { ChevronDown, ChevronRight, MessageSquare, User, Zap } from "lucide-react";

import { type FC, useState } from "react";

const getContentString: (data: any) => string = (data: any) => {
    if (typeof data === "string") {
        return data;
    }
    if (data === undefined || data === null) {
        return "Unknown";
    }
    if (Array.isArray(data)) {
        return data.map((entry: any) => getContentString(entry)).join(", ");
    }
    if (typeof data === "object") {
        if ("type" in data) {
            if (data.type === "text" && "text" in data) {
                return getContentString(data.text);
            }
        }
        if ("content" in data) {
            return getContentString(data.content);
        }
        return JSON.stringify(data);
    }
    return String(data);
};

export const AgentEventInfo: FC<{
    agentData: any;
    darkMode: boolean;
    stats: { count: number; lastActivity: string };
}> = ({ agentData, stats, darkMode }) => {
    const [expanded, setExpanded] = useState(false);

    const data = typeof agentData === "string" ? JSON.parse(agentData) : agentData;
    const agentName = data.name || "Unknown Agent";
    const systemMessage = getContentString(data.system_message || data.description || "");
    const totalCost = data.cost?.total?.total_cost || data.cost?.actual?.total_cost || 0;
    const activityCount = stats.count;
    const getLastActivity = () => stats.lastActivity;
    const contextVars = data.context_variables?.data || data.context_variables || null;
    const hasContextVars = contextVars && Object.keys(contextVars).length > 0;

    // Helper to format context variable values
    const formatValue = (value: any) => {
        if (typeof value === "boolean") {
            return value ? "✓" : "✗";
        }
        if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) {
            return value[0] === "t" ? "✓" : "✗";
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        if (typeof value === "string" && value.length > 30) {
            return value.substring(0, 30) + "...";
        }
        return String(value);
    };
    return (
        <div
            className={`border rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow ${
                darkMode ? " border-gray-800" : "border-gray-200"
            }`}
        >
            {/* Header Row */}
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 flex-1">
                    <User className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                    <span className={`font-semibold text-sm ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                        {agentName}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className={`flex items-center gap-1 text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                        <MessageSquare className="w-3 h-3" />
                        <span>{activityCount}</span>
                    </div>

                    {totalCost > 0 && (
                        <div
                            className={`flex items-center gap-1 text-xs ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                        >
                            <Zap className="w-3 h-3" />
                            <span>${totalCost.toFixed(4)}</span>
                        </div>
                    )}

                    {expanded ? (
                        <ChevronDown className={`w-4 h-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                    ) : (
                        <ChevronRight className={`w-4 h-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div
                    className={`mt-3 pt-3 border-t space-y-2 ${
                        darkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                >
                    {systemMessage && (
                        <div>
                            <div
                                className={`text-xs font-medium mb-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                            >
                                Role
                            </div>
                            <div
                                className={`text-xs p-2 rounded ${
                                    darkMode ? "text-gray-300 bg-gray-900" : "text-gray-700 bg-gray-50"
                                }`}
                            >
                                {systemMessage.length > 150
                                    ? systemMessage.substring(0, 150) + "..."
                                    : systemMessage}
                            </div>
                        </div>
                    )}

                    <div>
                        <div
                            className={`text-xs font-medium mb-1 ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                        >
                            Last Activity
                        </div>
                        <div
                            className={`text-xs p-2 rounded ${
                                darkMode ? "text-gray-300 bg-gray-900" : "text-gray-700 bg-gray-50"
                            }`}
                        >
                            {getLastActivity()}
                        </div>
                    </div>

                    {hasContextVars && (
                        <div>
                            <div
                                className={`text-xs font-medium mb-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                            >
                                Context Variables
                            </div>
                            <div
                                className={`text-xs p-2 rounded space-y-1 ${
                                    darkMode ? "bg-gray-900" : "bg-gray-50"
                                }`}
                            >
                                {Object.entries(contextVars).map(([key, value], index) => (
                                    <div key={`${key}-${index}`} className="flex items-start gap-2">
                                        <span
                                            className={`font-mono ${
                                                darkMode ? "text-blue-400" : "text-blue-600"
                                            }`}
                                        >
                                            {key}:
                                        </span>
                                        <span
                                            className={`flex-1 ${
                                                darkMode ? "text-gray-300" : "text-gray-700"
                                            }`}
                                        >
                                            {formatValue(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
