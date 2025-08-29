/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useEffect, useState } from "react";

import type { DictProps } from "@waldiez/components/dict/types";

/**
 * Custom hook for managing dictionary-like key-value pairs
 */
export const useDict = (props: DictProps) => {
    const { items, onUpdate, onDelete, onAdd, allowEmptyValues = true } = props;

    // State for visibility toggle of values
    const [visible, setVisible] = useState<Record<string, boolean>>({});

    // State for items (key-value pairs)
    const [stateItems, setStateItems] = useState<[string, unknown][]>(Object.entries(items));

    // State for new entry being added
    const [newEntry, setNewEntry] = useState<{ key: string; value: string }>({
        key: "",
        value: "",
    });

    // Sync with props when items change
    useEffect(() => {
        setStateItems(Object.entries(items));
    }, [items]);

    // Handle key change for existing entry
    const onKeyChange = useCallback((index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = event.target.value;

        setStateItems(prevItems =>
            prevItems.map(([key, value], idx) => (idx === index ? [newKey, value] : [key, value])),
        );
    }, []);

    // Handle value change for existing entry
    const onValueChange = useCallback((index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        setStateItems(prevItems =>
            prevItems.map(([key, value], idx) => (idx === index ? [key, newValue] : [key, value])),
        );
    }, []);

    // Toggle visibility of a value
    const onVisibilityChange = useCallback((key: string) => {
        setVisible(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    }, []);

    // Add a new entry
    const onAddEntry = useCallback(() => {
        // Validate entry
        if (!newEntry.key) {
            return;
        }

        if (!allowEmptyValues && !newEntry.value) {
            return;
        }

        // Update parent component
        onAdd(newEntry.key, newEntry.value);

        // Update local state
        setStateItems(prev => [...prev, [newEntry.key, newEntry.value]]);

        // Reset new entry form
        setNewEntry({ key: "", value: "" });
    }, [newEntry, allowEmptyValues, onAdd]);

    // Handle key change for new entry
    const onNewEntryKeyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = event.target.value;
        setNewEntry(prev => ({ ...prev, key: newKey }));
    }, []);

    // Handle value change for new entry
    const onNewEntryValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setNewEntry(prev => ({ ...prev, value: newValue }));
    }, []);

    // Delete an existing entry
    const onDeleteEntry = useCallback(
        (key: string) => {
            // Update parent component
            onDelete(key);

            // Update local state
            setStateItems(prev => prev.filter(([k]) => k !== key));
        },
        [onDelete],
    );

    // Save all changes
    const onSaveEntry = useCallback(() => {
        const itemsToSend = stateItems.reduce<Record<string, unknown>>((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

        onUpdate(itemsToSend);
    }, [stateItems, onUpdate]);

    // Check if an entry has been modified
    const isDirty = useCallback(
        (index: number) => {
            if (index >= stateItems.length || !stateItems[index]) {
                return true;
            }

            const [key, value] = stateItems[index];

            if (!(key in items)) {
                return true;
            }

            return items[key] !== value;
        },
        [stateItems, items],
    );

    return {
        stateItems,
        newEntry,
        visible,
        onKeyChange,
        onValueChange,
        onVisibilityChange,
        onAddEntry,
        onNewEntryKeyChange,
        onNewEntryValueChange,
        onDeleteEntry,
        onSaveEntry,
        isDirty,
    };
};
