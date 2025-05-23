/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ShowSnackbarProps } from "@waldiez/components/snackbar/types";

let globalEnqueue: ((props: ShowSnackbarProps) => void) | null = null;

export const showSnackbar = (props: ShowSnackbarProps): void => {
    if (globalEnqueue) {
        globalEnqueue(props);
    } else if (import.meta.env.DEV) {
        console.warn("SnackbarProvider is not mounted, snackbar not shown:", props);
    }
};

export const _registerSnackbarEnqueue = (fn: typeof globalEnqueue) => {
    globalEnqueue = fn;
};
export const _unregisterSnackbarEnqueue = () => {
    globalEnqueue = null;
};
