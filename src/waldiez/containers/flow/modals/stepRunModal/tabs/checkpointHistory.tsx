/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { CheckCircle, Circle } from "lucide-react";

import { type Dispatch, type SetStateAction, useCallback } from "react";

export const CheckpointHistory = (props: {
    isDark: boolean;
    currentHistory: {
        state: {
            messages: any[];
            context_variables: Record<string, any>;
        };
        metadata?: any;
    };
    selectedMessages: Set<number>;
    setSelectedMessages: Dispatch<SetStateAction<Set<number>>>;
}) => {
    const { isDark, currentHistory, selectedMessages, setSelectedMessages } = props;
    const toggleMessage = useCallback(
        (index: number) => {
            const newSelected = new Set(selectedMessages);
            if (newSelected.has(index)) {
                newSelected.delete(index);
            } else {
                newSelected.add(index);
            }
            setSelectedMessages(newSelected);
        },
        [selectedMessages, setSelectedMessages],
    );

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
                        Messages ({selectedMessages.size}/{currentHistory.state.messages.length})
                    </h4>
                    <button
                        onClick={() => {
                            if (selectedMessages.size === currentHistory.state.messages.length) {
                                setSelectedMessages(new Set());
                            } else {
                                setSelectedMessages(new Set(currentHistory.state.messages.map((_, i) => i)));
                            }
                        }}
                        className={`text-xs p-2 rounded-sm ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                        {selectedMessages.size === currentHistory.state.messages.length
                            ? "Deselect All"
                            : "Select All"}
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {currentHistory.state.messages.map((message, index) => (
                    <button
                        key={index}
                        onClick={() => toggleMessage(index)}
                        className={`w-full p-2 text-left border rounded ${
                            selectedMessages.has(index)
                                ? isDark
                                    ? "border-indigo-400 bg-indigo-900/30"
                                    : "border-indigo-300 bg-indigo-50"
                                : isDark
                                  ? "border-gray-700 hover:border-gray-600"
                                  : "border-gray-200 hover:border-gray-300"
                        } transition-colors`}
                    >
                        <div className="flex items-start space-x-2">
                            <div className="mt-0.5">
                                {selectedMessages.has(index) ? (
                                    <CheckCircle
                                        className={`h-4 w-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                                    />
                                ) : (
                                    <Circle
                                        className={`h-4 w-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                                    />
                                )}
                            </div>
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
                    </button>
                ))}
            </div>
        </div>
    );
};
