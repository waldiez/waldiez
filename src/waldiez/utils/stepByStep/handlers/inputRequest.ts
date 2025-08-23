/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezDebugMessage, isDebugInputRequest } from "@waldiez/components/stepByStep";
import {
    StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_input_request messages
 * These are sent when the backend is waiting for user control commands
 * NOTE: These are always followed by an input_request (Python input(prompt=...), or similar)
 * The coordination between these two messages should be handled outside the processor
 */
export class DebugInputRequestHandler implements StepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_input_request";
    }

    handle(data: WaldiezDebugMessage, _context: StepByStepProcessingContext): StepByStepProcessingResult {
        if (!isDebugInputRequest(data)) {
            return {
                error: {
                    message: "Invalid debug_input_request structure",
                    originalData: data,
                },
            };
        }

        return {
            debugMessage: data,
            stateUpdate: {
                pendingControlInput: {
                    request_id: data.request_id,
                    prompt: data.prompt,
                },
            },
            controlAction: {
                type: "debug_input_request_received",
                requestId: data.request_id,
                prompt: data.prompt,
            },
        };
    }
}
