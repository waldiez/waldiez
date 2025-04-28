/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezPreviousMessage, WaldiezUserInputType } from "@waldiez/types";

export type UserInputModalProps = {
    flowId: string;
    isOpen: boolean;
    onUserInput: (userInput: WaldiezUserInputType) => void;
    inputPrompt: {
        previousMessages: WaldiezPreviousMessage[];
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
        previousMessages: WaldiezPreviousMessage[];
        prompt: string;
    };
};
