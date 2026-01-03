/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezNodeModelData } from "@waldiez/models";

export type WaldiezNodeModelModalBasicTabProps = {
    id: string;
    data: WaldiezNodeModelData;
    onLogoChange: (newLogo: string) => void;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
};
