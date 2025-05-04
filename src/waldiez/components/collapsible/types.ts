/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ReactNode } from "react";

export type CollapsibleProps = {
    title: string;
    className?: string;
    children: ReactNode;
    expanded?: boolean;
    fullWidth?: boolean;
    dataTestId?: string;
};
export type CollapsibleViewProps = {
    title: string;
    className?: string;
    children: ReactNode;
    isOpen: boolean;
    dataTestId?: string;
    onToggle: () => void;
};
