/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent } from "react";

/**
 * Utility function to import an item from a JSON file.
 * This function reads a file input, parses the JSON content,
 * and calls the provided onLoad callback with the item and parsed data.
 * @param event - The change event from the file input.
 * @param itemGetter - A function that retrieves the item to be imported.
 * @param onLoad - A callback function that is called with the item and parsed JSON data.
 * @returns void
 */
export const importItem = <T>(
    event: ChangeEvent<HTMLInputElement>,
    itemGetter: () => T | null,
    onLoad: (item: T, data: { [key: string]: unknown }) => void,
) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const item = itemGetter();
            if (item) {
                const result = reader.result as string;
                try {
                    const jsonData = JSON.parse(result);
                    onLoad(item, jsonData);
                    /* c8 ignore next 3 */
                } catch (e) {
                    console.error(e);
                }
            }
        };
        reader.readAsText(file);
    }
};
