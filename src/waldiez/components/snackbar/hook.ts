/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useContext } from "react";

import { SnackbarContext } from "@waldiez/components/snackbar/context";
import type { SnackbarContextType } from "@waldiez/components/snackbar/types";

export const useSnackbar = (): SnackbarContextType => {
    const ctx = useContext(SnackbarContext);
    /* c8 ignore start -- @preserve */
    if (!ctx) {
        throw new Error("useSnackbar must be used within a SnackbarProvider");
    }
    /* c8 ignore end -- @preserve */
    return ctx;
};
