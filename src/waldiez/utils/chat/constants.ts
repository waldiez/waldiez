/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
export const WORKFLOW_DONE = "<Waldiez> - Done running the flow." as const;
export const WORKFLOW_CHAT_END_MARKERS = [
    WORKFLOW_DONE,
    "<Waldiez> - Workflow finished",
    "<Waldiez> - Workflow stopped by user",
    "<Waldiez> - Workflow execution failed:",
] as const;
export const MESSAGE_CONSTANTS = {
    DEFAULT_PROMPT: "Enter your message to start the conversation:",
    GENERIC_PROMPTS: [">", "> "] as string[],
    WORKFLOW_END_MARKERS: WORKFLOW_CHAT_END_MARKERS,
    PARTICIPANTS_KEY: "participants",
    SYSTEM_MESSAGES: {
        GROUP_CHAT_RUN: "Group chat run",
        CODE_EXECUTION_REPLY: "Generate code execution reply",
        SPEAKER_SELECTION_HEADER: "## Select a speaker",
        SPEAKER_SELECTION_PROMPT: "Please select a speaker from the following list:",
        SPEAKER_SELECTION_NOTE: "**Note:** You can select a speaker by entering the corresponding number.",
    },
} as const;
