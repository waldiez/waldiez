/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

export class RunCompletionHandler implements MessageHandler {
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
