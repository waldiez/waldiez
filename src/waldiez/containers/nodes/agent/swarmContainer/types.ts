/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { NodeProps } from "@xyflow/react";

import { WaldiezNodeAgent } from "@waldiez/models";

export type WaldiezSwarmContainerProps = NodeProps<WaldiezNodeAgent> & {
    isNodeModalOpen: boolean;
    onOpenNodeModal: () => void;
    onCloseNodeModal: () => void;
};
