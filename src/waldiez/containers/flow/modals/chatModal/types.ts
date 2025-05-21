/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatConfig, WaldiezChatUserInput } from "@waldiez/types";

export type ChatModalProps = {
    flowId: string;
    isDarkMode: boolean;
    chat?: WaldiezChatConfig;
};
export type ChatModalViewProps = {
    flowId: string;
    chat?: WaldiezChatConfig;
    isDarkMode: boolean;
    onClose: () => void;
    oncancel: () => void;
    onSubmit: (userInput: WaldiezChatUserInput) => void;
};
