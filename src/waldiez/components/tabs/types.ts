/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ReactNode } from "react";

export type TabItemProps = {
    id: string;
    label: string;
    children: ReactNode;
};
export type TabItemsProps = {
    activeTabIndex: number;
    children: ReactNode;
};
