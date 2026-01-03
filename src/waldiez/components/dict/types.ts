/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
export type DictProps = {
    viewLabel: string;
    viewLabelInfo?: string;
    items: { [key: string]: unknown };
    itemsType: string;
    onUpdate: (items: { [key: string]: unknown }) => void;
    onDelete: (key: string) => void;
    onAdd: (key: string, value: string) => void;
    areValuesSecret?: boolean;
    allowEmptyValues?: boolean;
};
