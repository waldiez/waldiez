/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezNodeAgentData, WaldiezNodeAgentRemoteData } from "@waldiez/models/types";

export type WaldiezAgentRemoteTabProps = {
    id: string;
    data: WaldiezNodeAgentRemoteData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
};
