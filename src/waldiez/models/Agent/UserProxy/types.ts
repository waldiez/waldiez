/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type WaldiezNodeAgentUserProxyData = WaldiezAgentCommonData & {
    label: string;
};
export type WaldiezNodeAgentUserProxy = Node<WaldiezNodeAgentUserProxyData, "agent">;
