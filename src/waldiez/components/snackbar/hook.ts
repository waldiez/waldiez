/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useContext } from "react";

import { SnackbarContext } from "@waldiez/components/snackbar/context";
import { SnackbarContextType } from "@waldiez/components/snackbar/types";

export const useSnackbar = (): SnackbarContextType => {
    const ctx = useContext(SnackbarContext);
    if (!ctx) {
        throw new Error("useSnackbar must be used within a SnackbarProvider");
    }
    return ctx;
};
