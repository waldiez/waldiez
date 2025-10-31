/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ChevronDown, ChevronRight, Clock } from "lucide-react";

import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { FaCaretLeft } from "react-icons/fa6";

import { CheckpointHistory } from "@waldiez/containers/flow/modals/stepRunModal/tabs/checkpointHistory";
import type { Checkpoint } from "@waldiez/containers/flow/modals/stepRunModal/types";
import { formatTimestamp } from "@waldiez/utils";

export const CheckpointView = (props: { isDark: boolean; checkpoint: Checkpoint; onBack: () => void }) => {
    const { isDark, checkpoint, onBack } = props;
    const [_selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
    const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
    const handleHistorySelect = (index: number) => {
        setSelectedHistoryIndex(index);
        if (expandedHistoryIndex === index) {
            setExpandedHistoryIndex(null);
        } else {
            setExpandedHistoryIndex(index);
        }
        const history = checkpoint.history?.[index];
        if (history?.state?.messages) {
            setSelectedMessages(new Set(history.state.messages.map((_, i) => i)));
        }
    };
    return (
        <div>
            <div className="flex w-full space-between">
                <button className="p-2 flex flex-row items-center bg-transparent no-border" onClick={onBack}>
                    <FaCaretLeft /> <span>Back</span>
                </button>
                <div className="flex-1" />
                <button
                    className="p-2 flex flex-row bg-transparent no-border rounded-sm items-center gap-2"
                    onClick={onBack}
                >
                    <FaSave /> <span>Save</span>
                </button>
            </div>
            <div className={"rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"}>
                <div className={"rounded-lg overflow-hidden flex flex-col"}>
                    <div className="flex-1 overflow-y-auto">
                        {checkpoint.history.map((entry, index) => (
                            <div
                                key={index}
                                className={`w-full p-3 text-left border-b ${isDark ? "border-gray-700" : "border-gray-100"} ${expandedHistoryIndex !== index ? (isDark ? "hover:bg-gray-800" : "hover:bg-gray-50") : ""} transition-colors`}
                            >
                                <div
                                    className={"flex items-center justify-between"}
                                    onClick={() => handleHistorySelect(index)}
                                >
                                    <div className="flex-1">
                                        <div
                                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
                                        >
                                            Entry #{index + 1}
                                        </div>
                                        <div
                                            className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}
                                        >
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {formatTimestamp(entry.timestamp)}
                                        </div>
                                        <div
                                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}
                                        >
                                            {entry.state.messages.length} message
                                            {entry.state.messages.length !== 1 && "s"}
                                        </div>
                                    </div>
                                    <div>
                                        {expandedHistoryIndex === index ? (
                                            <ChevronDown
                                                className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                            />
                                        ) : (
                                            <ChevronRight
                                                className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {expandedHistoryIndex === index && (
                                    <CheckpointHistory
                                        isDark={isDark}
                                        currentHistory={entry}
                                        selectedMessages={selectedMessages}
                                        setSelectedMessages={setSelectedMessages}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
