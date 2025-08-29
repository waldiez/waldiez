/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type WaldiezDebugMessage, isDebugInputRequest } from "@waldiez/components/stepByStep";
import { DEBUG_INPUT_PROMPT } from "@waldiez/utils/stepByStep/constants";
import type {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_input_request messages
 * These are sent when the backend is waiting for user control commands
 * NOTE: These are always followed by an input_request (Python input(prompt=...), or similar)
 * The coordination between these two messages should be handled outside the processor
 */
export class DebugInputRequestHandler implements WaldiezStepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_input_request" || type === "input_request";
    }

    handle(
        data: WaldiezDebugMessage,
        _context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult {
        if (!isDebugInputRequest(data)) {
            return {
                error: {
                    message: "Invalid debug_input_request structure",
                    originalData: data,
                },
            };
        }
        if (data.prompt.trim() === DEBUG_INPUT_PROMPT || data.type === "debug_input_request") {
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
        return {
            debugMessage: data,
            stateUpdate: {
                activeRequest: {
                    request_id: data.request_id,
                    prompt: data.prompt,
                },
            },
        };
    }
}
