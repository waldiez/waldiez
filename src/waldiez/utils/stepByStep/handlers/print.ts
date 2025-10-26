/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezDebugMessage } from "@waldiez/components/stepByStep/types";
import { WaldiezChatParticipantsHandler } from "@waldiez/utils/chat/handlers/participants";
import { WORKFLOW_STEP_END_MARKERS } from "@waldiez/utils/stepByStep/constants";
import type {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

/**
 * Handles debug_print messages
 * These contain general debug output and may indicate workflow end
 */
export class DebugPrintHandler implements WaldiezStepByStepHandler {
    canHandle(type: string): boolean {
        return type === "debug_print" || type === "print";
    }

    // eslint-disable-next-line max-statements
    handle(
        data: WaldiezDebugMessage,
        _context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult {
        if (data.type !== "debug_print" && data.type !== "print") {
            return {
                error: {
                    message: "Invalid debug_print structure",
                    originalData: data,
                },
            };
        }
        const printData = data as any;
        if (
            typeof printData === "object" &&
            "participants" in printData &&
            typeof printData.participants === "object"
        ) {
            const participantsResult = WaldiezChatParticipantsHandler.extractParticipants(printData);
            if (participantsResult?.participants) {
                return {
                    stateUpdate: {
                        participants: participantsResult.participants,
                    },
                };
            }
        }
        let content = data.content;
        if (typeof printData.content !== "string") {
            if (typeof printData.data === "string") {
                content = printData.data;
            } else {
                return {
                    error: {
                        message: "Invalid debug_print structure",
                        originalData: data,
                    },
                };
            }
        }
        // Check for workflow end markers
        const isWorkflowEnd = this.isWorkflowEndMessage(content);

        const result: WaldiezStepByStepProcessingResult = {
            debugMessage: data,
            isWorkflowEnd,
        };

        if (isWorkflowEnd) {
            result.controlAction = {
                type: "workflow_ended",
                reason: this.extractEndReason(content),
            };
            // Also clear pending control input when workflow ends
            result.stateUpdate = {
                pendingControlInput: null,
                activeRequest: null,
            };
        }

        return result;
    }

    private isWorkflowEndMessage(content: string): boolean {
        if (!content) {
            return false;
        }
        return WORKFLOW_STEP_END_MARKERS.some(marker => content.includes(marker));
    }

    private extractEndReason(content: string): string | undefined {
        if (content.includes("Workflow finished")) {
            return "completed";
        }
        if (content.includes("stopped by user")) {
            return "user_stopped";
        }
        if (content.includes("execution failed")) {
            return "error";
            /* c8 ignore next 3 -- @preserve */
        }
        return undefined;
    }
}
