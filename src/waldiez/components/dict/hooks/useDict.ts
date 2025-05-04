/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { DictProps } from "@waldiez/components/dict/types";

export const useDict = (props: DictProps) => {
    const { items, onUpdate, onDelete, onAdd, allowEmptyValues } = props;
    const [visible, setVisible] = useState<{ [key: string]: boolean }>({});
    // tmp state to save on submit, discard on cancel
    const [stateItems, setStateItems] = useState<[string, unknown][]>(Object.entries(items));
    const [newEntry, setNewEntry] = useState<{ key: string; value: string }>({
        key: "",
        value: "",
    });
    useEffect(() => {
        setStateItems(Object.entries(items));
    }, [items]);
    const onKeyChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        setStateItems(
            stateItems.map(([key, value], idx) => {
                if (idx === index) {
                    return [event.target.value, value];
                }
                return [key, value];
            }),
        );
    };
    const onValueChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        setStateItems(
            stateItems.map(([key, value], idx) => {
                if (idx === index) {
                    return [key, event.target.value];
                }
                return [key, value];
            }),
        );
    };
    const onVisibilityChange = (key: string) => {
        setVisible({
            ...visible,
            [key]: !visible[key],
        });
    };
    const onAddEntry = () => {
        if (!newEntry.key) {
            return;
        }
        if (!allowEmptyValues && !newEntry.value) {
            return;
        }
        onAdd(newEntry.key, newEntry.value);
        setNewEntry({ key: "", value: "" });
        setStateItems([...stateItems, [newEntry.key, newEntry.value]]);
    };
    const onNewEntryKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewEntry({ ...newEntry, key: event.target.value });
    };
    const onNewEntryValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewEntry({ ...newEntry, value: event.target.value });
    };
    const onDeleteEntry = (key: string) => {
        onDelete(key);
        setStateItems(stateItems.filter(([k]) => k !== key));
    };
    const onSaveEntry = () => {
        const itemsToSend: { [key: string]: unknown } = {};
        stateItems.forEach(([key, value]) => {
            itemsToSend[key] = value;
        });
        onUpdate(itemsToSend);
    };
    const isDirty = (index: number) => {
        if (index >= stateItems.length) {
            return true;
        }
        const [key, value] = stateItems[index];
        if (!(key in items)) {
            return true;
        }
        return items[key] !== value;
    };
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
