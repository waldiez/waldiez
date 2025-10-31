/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ChevronRight, History, Trash2 } from "lucide-react";

import { type Dispatch, type FC, type SetStateAction, useEffect, useState } from "react";

import { CheckpointView } from "@waldiez/containers/flow/modals/stepRunModal/tabs/checkpointView";
import type { Checkpoint, StepRunModalProps } from "@waldiez/containers/flow/modals/stepRunModal/types";
import { formatTimestamp } from "@waldiez/utils";

export const CheckpointsTabs: FC<
    StepRunModalProps & {
        selectedCheckpoint: Checkpoint | null;
        setSelectedCheckpoint: Dispatch<SetStateAction<Checkpoint | null>>;
    }
> = props => {
    const { getCheckpoints, selectedCheckpoint, setSelectedCheckpoint, darkMode: isDark } = props;
    const [gotCheckPoints, setGotCheckpoints] = useState<boolean>(false);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [expandedCheckpoint, setExpandedCheckpoint] = useState<Checkpoint | null>(null);
    const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
    const [checkpointError, setCheckpointError] = useState<string | null>(null);

    const loadCheckpoints = async () => {
        if (!getCheckpoints || gotCheckPoints) {
            return;
        }
        setLoadingCheckpoints(true);
        setCheckpointError(null);
        try {
            const data = await getCheckpoints();
            // Handle null, undefined, or empty object
            if (!data || Object.keys(data).length === 0) {
                setCheckpoints([]);
                return;
            }

            const checkpointArray = Object.entries(data).map(([id, checkpoints]: [string, any]) => ({
                id,
                history: [...checkpoints],
            }));
            setCheckpoints(checkpointArray);
        } catch (err: any) {
            setCheckpointError(err.message || "Failed to load checkpoints");
            setCheckpoints([]);
        } finally {
            setLoadingCheckpoints(false);
            setGotCheckpoints(true);
        }
    };
    const formatCheckPointLength = (checkpoint: Checkpoint) => {
        const ending = checkpoint.history.length !== 1 ? "entries" : "entry";
        return `${checkpoint.history.length} ${ending}`;
    };
    const handleCheckpointSelect = (checkpoint: Checkpoint) => {
        setSelectedCheckpoint(checkpoint);
    };
    useEffect(() => {
        loadCheckpoints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div>
            {loadingCheckpoints ? (
                <div className="text-center py-8">
                    <div
                        className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? "border-blue-400" : "border-blue-600"} mx-auto mb-3`}
                    ></div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading checkpoints...</p>
                </div>
            ) : checkpointError ? (
                <div
                    className={`${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"} border rounded-lg p-4`}
                >
                    <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{checkpointError}</p>
                    <button onClick={loadCheckpoints} className="mt-2 text-sm underline hover:no-underline">
                        Retry
                    </button>
                </div>
            ) : checkpoints.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No checkpoints available</p>
                </div>
            ) : (
                <div className="grid grid-cols gap-4 mb-4 space-y-1 overflow-y-auto">
                    {expandedCheckpoint ? (
                        <CheckpointView
                            checkpoint={expandedCheckpoint}
                            isDark={isDark}
                            onBack={() => setExpandedCheckpoint(null)}
                        />
                    ) : (
                        <div>
                            {checkpoints.map(checkpoint => (
                                <div
                                    key={checkpoint.id}
                                    role="button"
                                    onClick={() => handleCheckpointSelect(checkpoint)}
                                    className={`w-full p-3 text-left border-b ${isDark ? "border-gray-700 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"} transition-colors ${
                                        selectedCheckpoint?.id === checkpoint.id
                                            ? isDark
                                                ? "rounded-sm bg-blue-900/30 border-l-4 border-l-blue-400"
                                                : "rounded-sm bg-blue-50 border-l-4 border-l-blue-500"
                                            : ""
                                    }`}
                                >
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex flex-col">
                                            <div
                                                className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"} truncate mb-1`}
                                            >
                                                {checkpoint.id}
                                            </div>
                                            <div
                                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                            >
                                                {formatTimestamp(checkpoint.id)} (
                                                {formatCheckPointLength(checkpoint)})
                                            </div>
                                        </div>

                                        <div>
                                            <div
                                                className={`p-2 cursor-pointer ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                                role="button"
                                                onClick={() => {
                                                    setSelectedCheckpoint(checkpoint);
                                                    setExpandedCheckpoint(checkpoint);
                                                }}
                                            >
                                                <ChevronRight className={"h-10 w-4"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div
                                className={`${isDark ? "border-[#444]" : "border-[#ccc]"} mt-2 p-3 rounded-lg border shadow-sm`}
                            >
                                <div className="flex items-center justify-between min-h-8">
                                    {selectedCheckpoint
                                        ? `Selected checkpoint: ${selectedCheckpoint.id}`
                                        : "No checkpoint selected"}
                                    <button
                                        onClick={() => {
                                            setSelectedCheckpoint(null);
                                            setExpandedCheckpoint(null);
                                        }}
                                        className={
                                            selectedCheckpoint
                                                ? `p-2 hover:${isDark ? "bg-red-900" : "bg-red-50"} rounded-md transition-colors ml-2`
                                                : "hidden"
                                        }
                                    >
                                        <Trash2
                                            className={`h-3 w-3 ${isDark ? "text-red-400" : "text-red-500"}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
