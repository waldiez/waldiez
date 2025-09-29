/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Pause, Play, Plus, Trash2, X } from "lucide-react";

import { memo, useEffect } from "react";

import { Select, TabItem, TabItems } from "@waldiez/components";
import { Modal } from "@waldiez/components/modal";
import { WaldiezBreakpointToString } from "@waldiez/components/stepByStep/utils";
import { useStepRunModal } from "@waldiez/containers/flow/modals/stepRunModal/hooks";
import type { StepRunModalProps } from "@waldiez/containers/flow/modals/stepRunModal/types";

// eslint-disable-next-line complexity
export const StepRunModal = memo((props: StepRunModalProps) => {
    const { darkMode: isDark, flowId, onClose, onStart } = props;
    const {
        activeTab,
        setActiveTab,
        onActiveTabChange,
        breakpoints,
        eventOptions,
        selectedEventTypes,
        agentOptions,
        selectedAgents,
        selectedAgentEventAgent,
        selectedAgentEventType,
        setSelectedAgentEventType,
        setSelectedAgentEventAgent,
        setBreakpoints,
        setPresetBreakpoints,
        removeBreakpoint,
        onSelectedAgentsChange,
        onSelectedEventTypesChange,
        addAgentEventBreakpoint,
    } = useStepRunModal(props);
    useEffect(() => {
        setBreakpoints([{ type: "all", description: "Break on all events (default)" }]);
        setActiveTab("preset");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const doStart = () => {
        onStart(breakpoints.map(bp => WaldiezBreakpointToString(bp)).filter(item => item.trim() !== ""));
    };
    return (
        <Modal isOpen onClose={onClose} onCancel={onClose} flowId={flowId} title="Set breakpoints">
            <div className="modal-body">
                <TabItems
                    activeTabIndex={["preset", "custom", "current"].indexOf(activeTab)}
                    onTabChange={onActiveTabChange}
                >
                    <TabItem id="step-run-breakpoints-preset" label="Quick Presets">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPresetBreakpoints("all")}
                                    className={`p-4 flex items-center border-2 ${isDark ? "border-gray-600 hover:border-blue-400 hover:bg-gray-800" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"} rounded-lg transition-all text-left group`}
                                >
                                    <div className="flex items-center space-x-2 mr-4 mt-2 mb-2">
                                        <Pause
                                            className={`h-4 w-4 ${isDark ? "text-gray-400 group-hover:text-blue-400" : "text-gray-500 group-hover:text-blue-500"}`}
                                        />
                                        <span
                                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                                        >
                                            All Events
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                        Break on every event (default behavior)
                                    </p>
                                </button>
                                <button
                                    onClick={() => setPresetBreakpoints("tools")}
                                    className={`p-4 flex items-center border-2 ${isDark ? "border-gray-600 hover:border-green-400 hover:bg-gray-800" : "border-gray-200 hover:border-green-300 hover:bg-green-50"} rounded-lg transition-all text-left group`}
                                >
                                    <div className="flex items-center space-x-2 mr-4 mt-2 mb-2">
                                        <Play
                                            className={`h-4 w-4 ${isDark ? "text-gray-400 group-hover:text-green-400" : "text-gray-500 group-hover:text-green-500"}`}
                                        />
                                        <span
                                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                                        >
                                            Tool Execution
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                        All tool and function call events
                                    </p>
                                </button>

                                <button
                                    onClick={() => setPresetBreakpoints("errors")}
                                    className={`p-4 border-2 flex items-center ${isDark ? "border-gray-600 hover:border-red-400 hover:bg-gray-800" : "border-gray-200 hover:border-red-300 hover:bg-red-50"} rounded-lg transition-all text-left group`}
                                >
                                    <div className="flex items-center space-x-2 mr-4 mt-2 mb-2">
                                        <X
                                            className={`h-4 w-4 ${isDark ? "text-gray-400 group-hover:text-red-400" : "text-gray-500 group-hover:text-red-500"}`}
                                        />
                                        <span
                                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                                        >
                                            Errors Only
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                        Break only when errors occur
                                    </p>
                                </button>
                            </div>
                        </div>
                    </TabItem>
                    <TabItem id="step-run-breakpoints-custom" label="Custom Breakpoints">
                        <div className="space-y-6">
                            {/* Add Event Breakpoint */}
                            <div
                                className={`${isDark ? "bg-[#222] border-[#444]" : "bg-gray-50"} p-4 border rounded-lg`}
                            >
                                <h4 className={`font-medium ${isDark ? "text-white" : "text-gray-900"} mb-3`}>
                                    Break on Event Types
                                </h4>
                                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-3`}>
                                    Stop execution for specific event types from any agent
                                </p>
                                <Select
                                    className={"w-full rounded-md focus:ring-2"}
                                    options={eventOptions}
                                    value={selectedEventTypes}
                                    isMulti
                                    isClearable
                                    placeholder="Select event type(s) ..."
                                    onChange={onSelectedEventTypesChange}
                                />
                            </div>
                            {/* Add Agent Breakpoint */}
                            <div
                                className={`${isDark ? "bg-[#222] border-[#444]" : "bg-gray-50"} p-4 border rounded-lg`}
                            >
                                <h4 className={`font-medium ${isDark ? "text-white" : "text-gray-900"} mb-3`}>
                                    Break on Agents
                                </h4>
                                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-3`}>
                                    Stop execution for any event from specific agents
                                </p>
                                <Select
                                    className={"w-full rounded-md focus:ring-2"}
                                    options={agentOptions}
                                    value={selectedAgents}
                                    isMulti
                                    isClearable
                                    placeholder="Select agent(s) ..."
                                    onChange={onSelectedAgentsChange}
                                />
                            </div>

                            {/* Add Agent-Event Breakpoint */}
                            <div
                                className={`${isDark ? "bg-[#222] border-[#444]" : "bg-gray-50"} p-4 border rounded-lg`}
                            >
                                <h4 className={`font-medium ${isDark ? "text-white" : "text-gray-900"} mb-3`}>
                                    Break on Agent + Event
                                </h4>
                                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-3`}>
                                    Stop execution for a specific event from a specific agent
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Select
                                        id="agent-event-agent"
                                        className={"w-full rounded-md focus:ring-2"}
                                        options={agentOptions}
                                        value={selectedAgentEventAgent}
                                        placeholder="Select event agent ..."
                                        onChange={option => {
                                            if (!option) {
                                                setSelectedAgentEventAgent(undefined);
                                            } else {
                                                setSelectedAgentEventAgent({
                                                    label: option.label,
                                                    value: option.value,
                                                });
                                            }
                                        }}
                                    />
                                    <Select
                                        id="agent-event-event"
                                        className={"w-full rounded-md focus:ring-2"}
                                        options={eventOptions}
                                        value={selectedAgentEventType}
                                        placeholder="Select event type ..."
                                        onChange={options => {
                                            if (options) {
                                                setSelectedAgentEventType(options);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={addAgentEventBreakpoint}
                                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Breakpoint</span>
                                </button>
                            </div>
                        </div>
                    </TabItem>
                </TabItems>
            </div>
            <h3 className={`text-lg font-medium ${isDark ? "text-white" : "text-gray-900"} mt-4 mb-4`}>
                Active Breakpoints
            </h3>
            {breakpoints.length === 0 ? (
                <p className={`${isDark ? "text-gray-400" : "text-gray-500"} text-sm`}>
                    No breakpoints configured
                </p>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {breakpoints.map((bp, index) => (
                        <div
                            key={index}
                            className={`${isDark ? "bg-[#222] border-[#444]" : "bg-[#f8f8f8] border-[#ccc]"} p-3 rounded-lg border shadow-sm`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                bp.type === "all"
                                                    ? isDark
                                                        ? "bg-gray-600 text-gray-200"
                                                        : "bg-gray-100 text-gray-700"
                                                    : bp.type === "agent"
                                                      ? isDark
                                                          ? "bg-blue-900 text-blue-200"
                                                          : "bg-blue-100 text-blue-700"
                                                      : bp.type === "event"
                                                        ? isDark
                                                            ? "bg-green-900 text-green-200"
                                                            : "bg-green-100 text-green-700"
                                                        : isDark
                                                          ? "bg-purple-900 text-purple-200"
                                                          : "bg-purple-100 text-purple-700"
                                            }`}
                                        >
                                            {bp.type.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                        {bp.description}
                                    </p>
                                </div>
                                {bp.type !== "all" && (
                                    <button
                                        onClick={() => removeBreakpoint(index)}
                                        className={`p-1 hover:${isDark ? "bg-red-900" : "bg-red-50"} rounded-md transition-colors ml-2`}
                                    >
                                        <Trash2
                                            className={`h-3 w-3 ${isDark ? "text-red-400" : "text-red-500"}`}
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="modal-actions">
                <button type="reset" className="modal-action-cancel" onClick={onClose}>
                    Cancel
                </button>
                <div className="flex-1"></div>
                <button type="button" className="primary" onClick={doStart}>
                    Start
                </button>
            </div>
        </Modal>
    );
});

StepRunModal.displayName = "StepRunModal";
