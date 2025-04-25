/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type EditorProps = {
    value: string;
    onChange: (value: string | undefined) => void;
    darkMode: boolean;
};
