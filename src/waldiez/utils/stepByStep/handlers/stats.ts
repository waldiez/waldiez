/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { isDebugStats } from "@waldiez/components/stepByStep/guard";
import { type WaldiezDebugMessage } from "@waldiez/components/stepByStep/types";
import type {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_stats messages
 * These contain execution statistics from the runner
 */
export class DebugStatsHandler implements WaldiezStepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_stats" || type === "stats";
    }

    handle(
        data: WaldiezDebugMessage,
        _context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult {
        if (!isDebugStats(data)) {
            return {
                error: {
                    message: "Invalid debug_stats structure",
                    originalData: data,
                },
            };
        }

        return {
            debugMessage: data,
            stateUpdate: {
                stats: data.stats,
                stepMode: data.stats.step_mode,
                autoContinue: data.stats.auto_continue,
                breakpoints: data.stats.breakpoints || [],
            },
        };
    }
}
