/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezDebugMessage, isDebugEventInfo } from "@waldiez/components/stepByStep";
import {
    StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_event_info messages
 * These contain the current event being processed by the workflow
 */
export class DebugEventInfoHandler implements StepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_event_info";
    }

    handle(data: WaldiezDebugMessage, context: StepByStepProcessingContext): StepByStepProcessingResult {
        if (!isDebugEventInfo(data)) {
            return {
                error: {
                    message: "Invalid debug_event_info structure",
                    originalData: data,
                },
            };
        }

        const event = data.event;
        const currentHistory = context.currentState?.eventHistory || [];

        return {
            debugMessage: data,
            stateUpdate: {
                currentEvent: event,
                eventHistory: [...currentHistory, event],
            },
            controlAction: {
                type: "scroll_to_latest",
            },
        };
    }
}
