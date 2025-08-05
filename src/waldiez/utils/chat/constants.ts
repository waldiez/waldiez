/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const MESSAGE_CONSTANTS = {
    DEFAULT_PROMPT: "Enter your message to start the conversation:",
    GENERIC_PROMPTS: [">", "> "] as string[],
    WORKFLOW_END_MARKERS: [
        "<Waldiez> - Workflow finished",
        "<Waldiez> - Workflow stopped by user",
        "<Waldiez> - Workflow execution failed:",
        "<Waldiez> - Done running the flow.",
    ],
    PARTICIPANTS_KEY: "participants",
    SYSTEM_MESSAGES: {
        GROUP_CHAT_RUN: "Group chat run",
        CODE_EXECUTION_REPLY: "Generate code execution reply",
        SPEAKER_SELECTION_HEADER: "## Select a speaker",
        SPEAKER_SELECTION_PROMPT: "Please select a speaker from the following list:",
        SPEAKER_SELECTION_NOTE: "**Note:** You can select a speaker by entering the corresponding number.",
    },
} as const;
