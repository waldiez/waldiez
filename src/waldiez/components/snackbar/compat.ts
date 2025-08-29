/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
import type { ShowSnackbarProps } from "@waldiez/components/snackbar/types";

let globalEnqueue: ((props: ShowSnackbarProps) => void) | null = null;

/**
 * Show a snackbar notification.
 * @param props - The properties of the snackbar to show
 * @param props.flowId - The ID of the flow associated with the snackbar
 * @param props.message - The message to display in the snackbar
 * @param props.level - The level of the snackbar (default: "info")
 * @param props.details - Additional details to display in the snackbar
 * @param props.duration - The duration in milliseconds for which the snackbar should be visible (default: 3000)
 * @param props.withCloseButton - Whether to show a close button in the snackbar (default: true)
 * @see {@link ShowSnackbarProps}
 */
export const showSnackbar = (props: {
    flowId?: string;
    message: string;
    level?: "info" | "success" | "warning" | "error";
    details?: string | Error | object | null;
    duration?: number;
    withCloseButton?: boolean;
}): void => {
    if (!props.flowId) {
        // let's try to detect it (data-flow-id={flowId})
        const flowIdMatch = document.querySelectorAll("[data-flow-id]");
        if (flowIdMatch.length === 1) {
            // only if only one match (multiple tabs?)
            props.flowId = flowIdMatch[0]?.getAttribute("data-flow-id") || undefined;
        }
    }
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
