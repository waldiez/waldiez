/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type JSX } from "react";

export type StringListProps = {
    viewLabel: string | JSX.Element | (() => JSX.Element | string);
    viewLabelInfo?: string | JSX.Element | (() => JSX.Element | string);
    items: Array<string>;
    itemsType: string;
    placeholder?: string;
    onItemChange?: (oldItem: string, newItem: string) => void;
    onItemAdded?: (item: string) => void;
    onItemDeleted?: (item: string) => void;
};
