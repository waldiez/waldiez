/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent, type KeyboardEvent, type MouseEvent, useCallback, useState } from "react";

import type { StringListProps } from "@waldiez/components/stringList/types";

/**
 * Custom hook for managing string list functionality
 */
export const useStringList = (props: StringListProps) => {
    const [newEntry, setNewEntry] = useState<string>("");
    const { items, onItemAdded, onItemChange, onItemDeleted } = props;

    // Handler for adding a new entry
    const onAddEntry = useCallback(() => {
        if (!onItemAdded || !newEntry.trim()) {
            return;
        }

        onItemAdded(newEntry);
        setNewEntry("");
    }, [newEntry, onItemAdded]);

    // Handler for deleting an entry
    const onDeleteEntry = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            if (!onItemDeleted) {
                return;
            }

            const valueToDelete = event.currentTarget.value;
            onItemDeleted(valueToDelete);
        },
        [onItemDeleted],
    );

    // Handler for changing an existing entry
    const onEntryChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            if (!onItemChange) {
                return;
            }
            const index = parseInt(event.currentTarget.getAttribute("data-index") || "0");
            const newValue = event.target.value;
            const originalValue = items[index];

            if (originalValue !== undefined && originalValue !== null) {
                onItemChange(originalValue, newValue);
            }
        },
        [onItemChange, items],
    );

    // Handler for changing the new entry input
    const onNewEntryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setNewEntry(event.target.value);
    }, []);

    // Handler for key down events - allow Enter to add new item
    const onNewEntryKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                event.preventDefault();
                onAddEntry();
            }
        },
        [onAddEntry],
    );

    return {
        newEntry,
        onAddEntry,
        onDeleteEntry,
        onEntryChange,
        onNewEntryChange,
        onNewEntryKeyDown,
    };
};
