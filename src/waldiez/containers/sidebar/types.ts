/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeType } from "@waldiez/types";

export type SidebarViewProps = {
    isReadonly: boolean;
    selectedNodeType: WaldiezNodeType;
    onSelectNodeType: (nodeType: WaldiezNodeType) => void;
};
