/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import type { StepRunModalProps } from "@waldiez/containers/flow/modals/stepRunModal/types";
import { useWaldiez } from "@waldiez/store";
import type { EventType, MultiValue, WaldiezBreakpoint, WaldiezBreakpointType } from "@waldiez/types";

const eventDescriptions: Record<EventType, string> = {
    post_carryover_processing: "After processing carryover messages",
    group_chat_run_chat: "When group chat starts running",
    using_auto_reply: "When auto-reply mechanism is triggered",
    tool_call: "Before executing a tool/function call",
    execute_function: "When starting function execution",
    executed_function: "After function execution completes",
    input_request: "When requesting user input",
    tool_response: "When tool returns a response",
    termination: "When chat termination occurs",
    run_completion: "When run completes successfully",
    generate_code_execution_reply: "When generating code execution response",
    group_chat_resume: "When resuming a group chat",
    error: "When an error occurs",
    termination_and_human_reply_no_input: "Termination with no user input required",
};

export const useStepRunModal = (_props: StepRunModalProps) => {
    const getAgents = useWaldiez(s => s.getAgents);
    const agents = getAgents();
    const [activeTab, setActiveTab] = useState<"preset" | "custom" | "current">("preset");
    const [breakpoints, setBreakpoints] = useState<WaldiezBreakpoint[]>([
        { type: "all", description: "Break on all events (default)" },
    ]);
    const [selectedEventTypes, setSelectedEventTypes] = useState<{ label: string; value: EventType }[]>([]);
    const [selectedAgentEventType, setSelectedAgentEventType] = useState<
        { label: string; value: EventType } | undefined
    >(undefined);
    const [selectedAgentEventAgent, setSelectedAgentEventAgent] = useState<
        { label: string; value: string } | undefined
    >(undefined);
    const [selectedAgents, setSelectedAgents] = useState<{ label: string; value: string }[]>([]);

    // Track the source of breakpoint changes
    const [breakpointSource, setBreakpointSource] = useState<"preset" | "custom" | "init">("init");

    const agentOptions: { label: string; value: string }[] = useMemo(
        () =>
            agents.map(agent => ({
                label: agent.data.label,
                value: agent.id,
            })),
        [agents],
    );

    // Create a map for quick agent ID to label lookup
    const agentIdToLabel = useMemo(
        () =>
            agents.reduce(
                (acc, agent) => {
                    acc[agent.id] = agent.data.label;
                    return acc;
                },
                {} as Record<string, string>,
            ),
        [agents],
    );

    const eventOptions: { label: string; value: EventType }[] = useMemo(
        () =>
            Object.entries(eventDescriptions).map(([value, _]) => ({
                label: value,
                value: value as EventType,
            })),
        [],
    );

    const generateDescription = useCallback(
        (type: WaldiezBreakpointType, agent?: string, event_type?: string): string => {
            switch (type) {
                case "agent":
                    return `Break on any event from agent: ${agentIdToLabel[agent || ""] || agent}`;
                case "event":
                    return `Break on event: ${event_type} (${eventDescriptions[event_type as EventType]})`;
                case "agent_event":
                    return `Break when agent "${agentIdToLabel[agent || ""] || agent}" triggers event: ${event_type}`;
                case "all":
                    return "Break on all events (default)";
                default:
                    return "";
            }
        },
        [agentIdToLabel],
    );

    const onActiveTabChange = useCallback((tabIndex: number) => {
        if (tabIndex === 0) {
            setActiveTab("preset");
        } else if (tabIndex === 1) {
            setActiveTab("custom");
        } else {
            setActiveTab("current");
        }
    }, []);

    const setPresetBreakpoints = useCallback((preset: "all" | "tools" | "errors") => {
        // Mark that we're using a preset
        setBreakpointSource("preset");

        // Clear custom selections when using presets
        setSelectedAgents([]);
        setSelectedEventTypes([]);
        setSelectedAgentEventAgent(undefined);
        setSelectedAgentEventType(undefined);

        switch (preset) {
            case "all":
                setBreakpoints([{ type: "all", description: "Break on all events (default)" }]);
                break;
            case "tools":
                setBreakpoints([
                    {
                        type: "event",
                        event_type: "tool_call",
                        description: "Break on event: tool_call (Before executing a tool/function call)",
                    },
                    {
                        type: "event",
                        event_type: "execute_function",
                        description: "Break on event: execute_function (When starting function execution)",
                    },
                    {
                        type: "event",
                        event_type: "executed_function",
                        description: "Break on event: executed_function (After function execution completes)",
                    },
                    {
                        type: "event",
                        event_type: "tool_response",
                        description: "Break on event: tool_response (When tool returns a response)",
                    },
                ]);
                break;
            case "errors":
                setBreakpoints([
                    {
                        type: "event",
                        event_type: "error",
                        description: "Break on event: error (When an error occurs)",
                    },
                ]);
                break;
        }
    }, []);

    const addBreakpoint = useCallback(
        (type: WaldiezBreakpointType, agent?: string, event_type?: string) => {
            setBreakpointSource("custom");
            setBreakpoints(prev => {
                // Remove 'all' breakpoint when adding specific ones
                const filteredBreakpoints = prev.filter(bp => bp.type !== "all");

                // Check if this exact breakpoint already exists
                const exists = filteredBreakpoints.some(
                    bp => bp.type === type && bp.agent === agent && bp.event_type === event_type,
                );

                if (exists) {
                    return prev; // Don't add duplicates
                }

                const newBreakpoint: WaldiezBreakpoint = {
                    type,
                    ...(agent && { agent }),
                    ...(event_type && { event_type }),
                    description: generateDescription(type, agent, event_type),
                };

                return [...filteredBreakpoints, newBreakpoint];
            });

            // Clear agent-event selections after adding
            if (type === "agent_event") {
                setSelectedAgentEventAgent(undefined);
                setSelectedAgentEventType(undefined);
            }
        },
        [generateDescription],
    );

    const removeBreakpoint = useCallback((index: number) => {
        setBreakpointSource("custom");
        setBreakpoints(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // If no breakpoints left, add back the 'all' default
            if (updated.length === 0) {
                return [{ type: "all", description: "Break on all events (default)" }];
            }
            return updated;
        });
    }, []);

    // Sync selected event types with breakpoints (only for custom changes)
    useEffect(() => {
        // Skip sync if we're using a preset or initializing
        if (breakpointSource !== "custom") {
            return;
        }

        // Get current event-only breakpoints (not agent_event)
        const currentEventBreakpoints = breakpoints.filter(bp => bp.type === "event" && bp.event_type);
        const currentEventTypes = new Set(currentEventBreakpoints.map(bp => bp.event_type));
        const selectedEventTypeValues = new Set(selectedEventTypes.map(e => e.value));

        // Check if we need to make any changes
        const needsAdd = selectedEventTypes.some(event => !currentEventTypes.has(event.value));
        const needsRemove = currentEventBreakpoints.some(
            bp => bp.event_type && !selectedEventTypeValues.has(bp.event_type as EventType),
        );

        if (!needsAdd && !needsRemove) {
            return; // No changes needed
        }

        // Perform all updates in a single setState call
        setBreakpoints(prev => {
            let updated = prev.filter(bp => {
                // Keep all non-event breakpoints
                if (bp.type !== "event") {
                    return true;
                }
                // Keep event breakpoints that are still selected
                return bp.event_type && selectedEventTypeValues.has(bp.event_type as EventType);
            });

            // Remove 'all' if we're adding specific breakpoints
            if (selectedEventTypes.length > 0) {
                updated = updated.filter(bp => bp.type !== "all");
            }

            // Add new event breakpoints
            selectedEventTypes.forEach(event => {
                const exists = updated.some(bp => bp.type === "event" && bp.event_type === event.value);
                if (!exists) {
                    updated.push({
                        type: "event",
                        event_type: event.value,
                        description: generateDescription("event", undefined, event.value),
                    });
                }
            });

            // If no breakpoints left, add back the 'all' default
            if (updated.length === 0) {
                return [{ type: "all", description: "Break on all events (default)" }];
            }

            return updated;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEventTypes, breakpointSource, generateDescription]);

    // Sync selected agents with breakpoints (only for custom changes)
    useEffect(() => {
        // Skip sync if we're using a preset or initializing
        if (breakpointSource !== "custom") {
            return;
        }

        // Get current agent breakpoints
        const currentAgentBreakpoints = breakpoints.filter(bp => bp.type === "agent");
        const currentAgentIds = new Set(currentAgentBreakpoints.map(bp => bp.agent));
        const selectedAgentIds = new Set(selectedAgents.map(a => a.value));

        // Check if we need to make any changes
        const needsAdd = selectedAgents.some(agent => !currentAgentIds.has(agent.value));
        const needsRemove = currentAgentBreakpoints.some(bp => bp.agent && !selectedAgentIds.has(bp.agent));

        if (!needsAdd && !needsRemove) {
            return; // No changes needed
        }

        // Perform all updates in a single setState call
        setBreakpoints(prev => {
            let updated = prev.filter(bp => {
                // Keep all non-agent breakpoints
                if (bp.type !== "agent") {
                    return true;
                }
                // Keep agent breakpoints that are still selected
                return bp.agent && selectedAgentIds.has(bp.agent);
            });

            // Remove 'all' if we're adding specific breakpoints
            if (selectedAgents.length > 0) {
                updated = updated.filter(bp => bp.type !== "all");
            }

            // Add new agent breakpoints
            selectedAgents.forEach(agent => {
                const exists = updated.some(bp => bp.type === "agent" && bp.agent === agent.value);
                if (!exists) {
                    updated.push({
                        type: "agent",
                        agent: agent.value,
                        description: generateDescription("agent", agent.value),
                    });
                }
            });

            // If no breakpoints left, add back the 'all' default
            if (updated.length === 0) {
                return [{ type: "all", description: "Break on all events (default)" }];
            }

            return updated;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAgents, breakpointSource, generateDescription]);

    const onSelectedAgentsChange = useCallback((options: MultiValue<{ label: string; value: string }>) => {
        setBreakpointSource("custom");
        if (!options || options.length === 0) {
            setSelectedAgents([]);
        } else {
            setSelectedAgents(options.map(option => ({ label: option.label, value: option.value })));
        }
    }, []);

    const onSelectedEventTypesChange = useCallback(
        (options: MultiValue<{ label: string; value: EventType }>) => {
            setBreakpointSource("custom");
            if (!options || options.length === 0) {
                setSelectedEventTypes([]);
            } else {
                setSelectedEventTypes(options.map(option => ({ label: option.label, value: option.value })));
            }
        },
        [],
    );

    const addAgentEventBreakpoint = useCallback(() => {
        if (!selectedAgentEventAgent || !selectedAgentEventType) {
            return;
        }
        addBreakpoint("agent_event", selectedAgentEventAgent.value, selectedAgentEventType.value);
    }, [addBreakpoint, selectedAgentEventAgent, selectedAgentEventType]);

    return {
        activeTab,
        setActiveTab,
        onActiveTabChange,
        generateDescription,
        setBreakpoints,
        setPresetBreakpoints,
        breakpoints,
        agentOptions,
        eventDescriptions,
        agents,
        eventOptions,
        selectedAgentEventAgent,
        selectedAgentEventType,
        selectedEventTypes,
        selectedAgents,
        setSelectedAgentEventAgent,
        setSelectedAgentEventType,
        setSelectedEventTypes,
        setSelectedAgents,
        addBreakpoint,
        removeBreakpoint,
        addAgentEventBreakpoint,
        onSelectedAgentsChange,
        onSelectedEventTypesChange,
    };
};
