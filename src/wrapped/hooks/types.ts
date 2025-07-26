/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatMessage, WaldiezChatUserInput, WaldiezTimelineData } from "@waldiez/types";

export type WebSocketMessage = {
    action: "run" | "stop" | "save" | "upload" | "convert" | "userInput" | "getInputPrompt";
    flow?: string;
    files?: {
        name: string;
        content: string;
    }[];
    to?: "py" | "ipynb";
    input?: WaldiezChatUserInput;
};

export type WebSocketResponse = {
    type: string;
    request_id?: string;
    filePaths?: string[];
    outputPath?: string;
    response?: string;
    prompt?: string;
    success?: boolean;
    [key: string]: unknown;
};

export type WaldiezWrapperState = {
    timeline: WaldiezTimelineData | undefined;
    messages: WaldiezChatMessage[];
    userParticipants: string[];
    isRunning: boolean;
    connected: boolean;
    error: string | null;
    inputPrompt?: {
        prompt: string;
        request_id: string;
        password?: boolean;
    };
};

export type WaldiezWrapperActions = {
    handleRun: (flow: string) => void;
    handleStop: () => void;
    handleSave: (flow: string) => void;
    handleUpload: (files: File[]) => Promise<string[]>;
    handleConvert: (flow: string, to: "py" | "ipynb") => void;
    handleUserInput: (input: WaldiezChatUserInput) => void;
    sendMessage: (data: unknown) => void;
    reset: () => void;
};
