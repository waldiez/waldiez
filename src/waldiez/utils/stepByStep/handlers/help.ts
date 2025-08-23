/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezDebugMessage, isDebugHelp } from "@waldiez/components/stepByStep";
import {
    StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_help messages
 * These contain help information for debug commands
 */
export class DebugHelpHandler implements StepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_help";
    }

    handle(data: WaldiezDebugMessage, _context: StepByStepProcessingContext): StepByStepProcessingResult {
        if (!isDebugHelp(data)) {
            return {
                error: {
                    message: "Invalid debug_help structure",
                    originalData: data,
                },
            };
        }
        return {
            debugMessage: data,
            stateUpdate: {
                help: data.help,
            },
        };
    }
}
