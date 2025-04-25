/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type UserInputModalProps = {
    flowId: string;
    isOpen: boolean;
    onUserInput: (userInput: string) => void;
    inputPrompt: {
        previousMessages: string[];
        prompt: string;
    };
};
export type UserInputModalViewProps = {
    flowId: string;
    isOpen: boolean;
    onClose: () => void;
    oncancel: () => void;
    onSubmit: () => void;
    inputPrompt: {
        previousMessages: string[];
        prompt: string;
    };
};
