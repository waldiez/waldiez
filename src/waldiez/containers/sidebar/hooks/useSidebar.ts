/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { createContext, useContext } from "react";

type SidebarContextType = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider context");
    }
    return context;
};
