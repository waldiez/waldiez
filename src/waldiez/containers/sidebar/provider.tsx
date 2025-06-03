/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactNode, useEffect, useState } from "react";

import { SidebarContext } from "@waldiez/containers/sidebar";

export const SidebarProvider: React.FC<{
    children: ReactNode;
    collapsed?: boolean;
}> = ({ children, collapsed }) => {
    const initiallyCollapsed = typeof collapsed === "boolean" ? collapsed : getIsSidebarCollapsedFromBody();
    const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
    useEffect(() => {
        setSidebarCollapsedToBody(isCollapsed);
    }, [isCollapsed]);

    const toggleSidebar = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>{children}</SidebarContext.Provider>
    );
};

const setSidebarCollapsedToBody = (isCollapsed: boolean) => {
    if (isCollapsed) {
        document.body.classList.add("waldiez-sidebar-collapsed");
        document.body.classList.remove("waldiez-sidebar-expanded");
    } else {
        document.body.classList.add("waldiez-sidebar-expanded");
        document.body.classList.remove("waldiez-sidebar-collapsed");
    }
};

const getIsSidebarCollapsedFromBody = () => {
    if (document.body.classList.contains("waldiez-sidebar-collapsed")) {
        return true;
    }
    if (document.body.classList.contains("waldiez-sidebar-expanded")) {
        return false;
    }
    // if mobile/small screen, let's have it collapsed by default
    return window.innerWidth < 768;
};
