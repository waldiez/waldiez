/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModelData } from "@waldiez/models";

export type WaldiezNodeModelModalBasicTabProps = {
    id: string;
    data: WaldiezNodeModelData;
    onLogoChange: (newLogo: string) => void;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
};
