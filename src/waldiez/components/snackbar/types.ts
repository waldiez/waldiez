/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type SnackbarLevel = "info" | "warning" | "error" | "success";
export type SnackbarDetails = string | Error | object | null;
export type ShowSnackbarProps = {
    flowId: string;
    message: string;
    level?: SnackbarLevel;
    details?: SnackbarDetails;
    duration?: number;
    withCloseButton?: boolean;
};
export type SnackbarItem = ShowSnackbarProps & {
    id: string;
};

export type SnackbarQueue = SnackbarItem[];

export type SnackbarContextType = {
    enqueueSnackbar: (props: ShowSnackbarProps) => void;
};
