/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezDebugMessage, isDebugError } from "@waldiez/components/stepByStep";
import {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_error messages
 * These contain error information from the runner
 */
export class DebugErrorHandler implements WaldiezStepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_error" || type === "error";
    }

    handle(
        data: WaldiezDebugMessage,
        _context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult {
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
