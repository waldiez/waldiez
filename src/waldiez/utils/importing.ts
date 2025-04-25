/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const importItem = <T>(
    event: React.ChangeEvent<HTMLInputElement>,
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
                } catch (e) {
                    console.error(e);
                }
            }
        };
        reader.readAsText(file);
    }
};
