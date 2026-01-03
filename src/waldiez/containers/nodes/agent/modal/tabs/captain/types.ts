/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezNodeAgentCaptainData, WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentCaptainTabProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentCaptainData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
