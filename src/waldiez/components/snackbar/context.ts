/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { createContext } from "react";

import type { SnackbarContextType } from "@waldiez/components/snackbar/types";

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);
