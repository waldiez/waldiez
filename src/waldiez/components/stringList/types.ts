/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

export type StringListProps = {
    viewLabel: string | React.JSX.Element | (() => React.JSX.Element | string);
    viewLabelInfo?: string | React.JSX.Element | (() => React.JSX.Element | string);
    items: Array<string>;
    itemsType: string;
    placeholder?: string;
    onItemChange?: (oldItem: string, newItem: string) => void;
    onItemAdded?: (item: string) => void;
    onItemDeleted?: (item: string) => void;
};
