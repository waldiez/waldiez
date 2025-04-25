/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { StringListProps } from "@waldiez/components/stringList/types";

export const useStringList = (props: StringListProps) => {
    const [newEntry, setNewEntry] = useState<string>("");
    const { onItemAdded, onItemChange, onItemDeleted } = props;
    const onAddEntry = () => {
        if (!onItemAdded) {
            return;
        }
        if (!newEntry) {
            return;
        }
        onItemAdded(newEntry);
        setNewEntry("");
    };
    const onDeleteEntry = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (onItemDeleted) {
            onItemDeleted(event.currentTarget.value);
        }
    };
    const onEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const dataValue = event.currentTarget.getAttribute("data-value");
        if (dataValue && onItemChange) {
            onItemChange(dataValue, event.target.value);
        }
    };
    const onNewEntryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewEntry(event.target.value);
    };
    return {
        newEntry,
        onAddEntry,
        onDeleteEntry,
        onEntryChange,
        onNewEntryChange,
    };
};
