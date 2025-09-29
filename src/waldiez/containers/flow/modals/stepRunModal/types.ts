/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type StepRunModalProps = {
    flowId: string;
    darkMode: boolean;
    onClose: () => void;
    onStart: (breakpoints: string[]) => void;
};
