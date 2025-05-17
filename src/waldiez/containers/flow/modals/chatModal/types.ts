/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatConfig, WaldiezChatUserInput } from "@waldiez/types";

export type ChatModalProps = {
    flowId: string;
    chat?: WaldiezChatConfig;
};
export type ChatModalViewProps = {
    flowId: string;
    chat?: WaldiezChatConfig;
    onClose: () => void;
    oncancel: () => void;
    onSubmit: (userInput: WaldiezChatUserInput) => void;
};
