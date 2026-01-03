/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezChatConfig } from "@waldiez/types";

export type ChatModalProps = {
    flowId: string;
    isDarkMode: boolean;
    chat?: WaldiezChatConfig;
};
