/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezPreviousMessage, WaldiezUserInput } from "@waldiez/types";

export type UserInputModalProps = {
    flowId: string;
    isOpen: boolean;
    onUserInput: (userInput: WaldiezUserInput) => void;
    inputPrompt: {
        previousMessages: WaldiezPreviousMessage[];
        request_id: string;
        prompt: string;
    };
};
export type UserInputModalViewProps = {
    flowId: string;
    isOpen: boolean;
    onClose: () => void;
    oncancel: () => void;
    onSubmit: (userInput: WaldiezUserInput) => void;
    inputPrompt: {
        previousMessages: WaldiezPreviousMessage[];
        request_id: string;
        prompt: string;
    };
};
