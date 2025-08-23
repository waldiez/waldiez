/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezDebugMessage,
    isDebugBreakpointAdded,
    isDebugBreakpointCleared,
    isDebugBreakpointRemoved,
    isDebugBreakpointsList,
} from "@waldiez/components/stepByStep";
import {
    StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles all breakpoint-related messages
 * - debug_breakpoints_list
 * - debug_breakpoint_added
 * - debug_breakpoint_removed
 * - debug_breakpoint_cleared
 */
export class DebugBreakpointsHandler implements StepByStepHandler {
    canHandle(type: string): boolean {
        return [
            "debug_breakpoints_list",
            "debug_breakpoint_added",
            "debug_breakpoint_removed",
            "debug_breakpoint_cleared",
        ].includes(type);
    }

    handle(data: WaldiezDebugMessage, context: StepByStepProcessingContext): StepByStepProcessingResult {
        const result: StepByStepProcessingResult = {
            debugMessage: data,
        };

        if (isDebugBreakpointsList(data)) {
            result.stateUpdate = {
                breakpoints: data.breakpoints || /* c8 ignore next */ [],
            };
            result.controlAction = {
                type: "update_breakpoints",
                breakpoints: data.breakpoints /* c8 ignore next */ || [],
            };
        } else if (isDebugBreakpointAdded(data)) {
            const currentBreakpoints = context.currentState?.breakpoints || [];
            const newBreakpoints = [...currentBreakpoints, data.breakpoint];
            result.stateUpdate = {
                breakpoints: newBreakpoints,
            };
            result.controlAction = {
                type: "show_notification",
                message: `Breakpoint added: ${data.breakpoint}`,
                severity: "success",
            };
        } else if (isDebugBreakpointRemoved(data)) {
            const filteredBreakpoints = (context.currentState?.breakpoints || []).filter(
                bp => bp !== data.breakpoint,
            );
            result.stateUpdate = {
                breakpoints: filteredBreakpoints,
            };
            result.controlAction = {
                type: "show_notification",
                message: `Breakpoint removed: ${data.breakpoint}`,
                severity: "info",
            };
        } else if (isDebugBreakpointCleared(data)) {
            result.stateUpdate = {
                breakpoints: [],
            };
            result.controlAction = {
                type: "show_notification",
                message: data.message || /* c8 ignore next */ "All breakpoints cleared",
                severity: "info",
            };
        } else {
            return {
                error: {
                    message: `Unknown breakpoint message type: ${data.type}`,
                    originalData: data,
                },
            };
        }

        return result;
    }
}
