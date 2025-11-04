/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

export const CheckpointHistory = (props: {
    isDark: boolean;
    currentHistory: {
        state: {
            messages: any[];
            context_variables: Record<string, any>;
        };
        metadata?: any;
    };
}) => {
    const { isDark, currentHistory } = props;
    const hasContextVars = Object.keys(currentHistory.state.context_variables).length > 0;
    const maxContentLen = 300;

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
        if (typeof value === "string" && value.length > maxContentLen) {
            return value.substring(0, maxContentLen) + "...";
        }
        return String(value);
    };
    const getMessagePreview = useCallback((message: any) => {
        if (message.content && message.content !== "None") {
            return message.content.substring(0, 60) + (message.content.length > 60 ? "..." : "");
        }
        if (message.tool_calls) {
            return `[Tool Call: ${message.tool_calls[0]?.function?.name || "unknown"}]`;
        }
        return "[No content]";
    }, []);
    return (
        <div
            className={`${isDark ? "border-gray-700" : "border-gray-200"} mt-2 border rounded-lg overflow-hidden flex flex-col`}
        >
            <div
                className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} p-3 border-b`}
            >
                <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        Messages
                    </h4>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {currentHistory.state.messages.map((message, index) => (
                    <div
                        key={index}
                        className={`w-full p-2 text-left border rounded ${
                            isDark ? "border-indigo-400 bg-indigo-900/30" : "border-indigo-300 bg-indigo-50"
                        } transition-colors`}
                    >
                        <div className="flex items-start space-x-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                                            message.role === "user"
                                                ? isDark
                                                    ? "bg-blue-900 text-blue-200"
                                                    : "bg-blue-100 text-blue-700"
                                                : message.role === "assistant"
                                                  ? isDark
                                                      ? "bg-green-900 text-green-200"
                                                      : "bg-green-100 text-green-700"
                                                  : isDark
                                                    ? "bg-purple-900 text-purple-200"
                                                    : "bg-purple-100 text-purple-700"
                                        }`}
                                    >
                                        {message.role}
                                    </span>
                                </div>
                                <p
                                    className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"} truncate`}
                                >
                                    {getMessagePreview(message)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {hasContextVars && (
                <div
                    className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} p-3 border-b`}
                >
                    <div className="flex items-center justify-between">
                        <h4 className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                            Context Variables
                        </h4>
                    </div>
                    <div
                        className={`text-xs p-2 rounded space-y-1 ${isDark ? "border-indigo-400 bg-indigo-900/30" : "border-indigo-300 bg-indigo-50"}`}
                    >
                        {Object.entries(currentHistory.state.context_variables).map(([key, value], index) => (
                            <div key={`${key}-${index}`} className="flex items-start gap-2">
                                <span className={`font-mono ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                    {key}:
                                </span>
                                <span className={`flex-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                    {formatValue(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
