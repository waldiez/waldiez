/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { isDebugEventInfo } from "@waldiez/components/stepByStep/guard";
import { type WaldiezDebugMessage } from "@waldiez/components/stepByStep/types";
import type {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_event_info messages
 * These contain the current event being processed by the workflow
 */
export class DebugEventInfoHandler implements WaldiezStepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_event_info" || type === "event_info";
    }

    handle(
        data: WaldiezDebugMessage,
        context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult {
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
