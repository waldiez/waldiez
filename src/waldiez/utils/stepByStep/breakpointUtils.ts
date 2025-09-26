/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezBreakpoint } from "@waldiez/components/stepByStep/types";

export class WaldiezBreakpointUtils {
    /**
     * Parse breakpoint from string format
     */
    static fromString(breakpointStr: string): WaldiezBreakpoint {
        if (breakpointStr === "all") {
            return { type: "all" };
        }
        if (breakpointStr.startsWith("event:")) {
            const event_type = breakpointStr.slice(6); // Remove "event:" prefix
            return { type: "event", event_type };
        }
        if (breakpointStr.startsWith("agent:")) {
            const agent = breakpointStr.slice(6); // Remove "agent:" prefix
            return { type: "agent", agent };
        }
        if (
            breakpointStr.includes(":") &&
            !breakpointStr.startsWith("event:") &&
            !breakpointStr.startsWith("agent:")
        ) {
            // Format: "agent:event_type"
            const [agent, event_type] = breakpointStr.split(":", 2);
            return {
                type: "agent_event",
                agent,
                event_type,
            };
        }
        // Default to event type for backward compatibility
        return { type: "event", event_type: breakpointStr };
    }

    /**
     * Convert breakpoint to string representation
     */
    static toString(breakpoint: WaldiezBreakpoint): string {
        switch (breakpoint.type) {
            case "event":
                return `event:${breakpoint.event_type}`;
            case "agent":
                return `agent:${breakpoint.agent}`;
            case "agent_event":
                return `${breakpoint.agent}:${breakpoint.event_type}`;
            case "all":
            default:
                return "all";
        }
    }

    /**
     * Check if breakpoint matches an event
     */
    static matches(breakpoint: WaldiezBreakpoint, event: Record<string, unknown>): boolean {
        switch (breakpoint.type) {
            case "all":
                return true;
            case "event":
                return event.type === breakpoint.event_type;
            case "agent":
                return event.sender === breakpoint.agent || event.recipient === breakpoint.agent;
            case "agent_event":
                return (
                    event.type === breakpoint.event_type &&
                    (event.sender === breakpoint.agent || event.recipient === breakpoint.agent)
                );
            default:
                return false;
        }
    }

    /**
     * Normalize breakpoint input (string or object) to WaldiezBreakpoint
     */
    static normalize(input: string | WaldiezBreakpoint): WaldiezBreakpoint {
        return typeof input === "string" ? this.fromString(input) : input;
    }

    /**
     * Get display name for breakpoint
     */
    static getDisplayName(breakpoint: WaldiezBreakpoint): string {
        switch (breakpoint.type) {
            case "event":
                return `Event: ${breakpoint.event_type}`;
            case "agent":
                return `Agent: ${breakpoint.agent}`;
            case "agent_event":
                return `${breakpoint.agent} → ${breakpoint.event_type}`;
            case "all":
                return "All Events";
            default:
                return "Unknown";
        }
    }
}
