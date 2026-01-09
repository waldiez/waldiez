/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

export class WaldiezChatRunCompletionHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "run_completion";
    }

    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || !data.content || typeof data.content !== "object") {
            return undefined;
        }

        return { isWorkflowEnd: true, runCompletion: data.content };
    }
}
