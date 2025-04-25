/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeType } from "@waldiez/types";

export type WaldiezFlowPanelsProps = {
    flowId: string;
    skipExport?: boolean;
    skipImport?: boolean;
    skipHub?: boolean;
    selectedNodeType: WaldiezNodeType;
    onAddNode: () => void;
    onRun: () => void;
    onConvertToPy: () => void;
    onConvertToIpynb: () => void;
    onOpenImportModal: () => void;
    onExport: (e: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
};
