/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatConfig } from "@waldiez/types";

export type ChatModalProps = {
    flowId: string;
    isDarkMode: boolean;
    chat?: WaldiezChatConfig;
};
