/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezDebugMessage, isDebugError } from "@waldiez/components/stepByStep";
import {
    StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_error messages
 * These contain error information from the runner
 */
export class DebugErrorHandler implements StepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_error";
    }

    handle(data: WaldiezDebugMessage, _context: StepByStepProcessingContext): StepByStepProcessingResult {
        if (!isDebugError(data)) {
            return {
                error: {
                    message: "Invalid debug_error structure",
                    originalData: data,
                },
            };
        }

        return {
            debugMessage: data,
            stateUpdate: {
                lastError: data.error,
            },
            controlAction: {
                type: "show_notification",
                message: data.error,
                severity: "error",
            },
        };
    }
}
