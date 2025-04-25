/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SidebarContext, SidebarProvider, useSidebar } from "@waldiez/containers/sidebar";

describe("SidebarProvider", () => {
    afterEach(() => {
        document.body.classList.remove("waldiez-sidebar-collapsed");
        document.body.classList.remove("waldiez-sidebar-expanded");
    });

    it("should render children", () => {
        const { getByText } = render(
            <SidebarProvider>
                <SidebarContext.Consumer>{() => <div>test</div>}</SidebarContext.Consumer>
            </SidebarProvider>,
        );
        expect(getByText("test")).toBeInTheDocument();
    });
    it("should toggle sidebar", () => {
        const { result } = renderHook(() => useSidebar(), {
            wrapper: SidebarProvider,
        });
        waitFor(() => {
            expect(result.current.isCollapsed).toBe(false);
        });
        result.current.toggleSidebar();
        waitFor(() => {
            expect(result.current.isCollapsed).toBe(true);
        });
    });
    it("should throw in not in provider", () => {
        expect(() => {
            renderHook(() => useSidebar());
        }).toThrowError("useSidebar must be used within a SidebarProvider context");
    });
    it("should get the isCollapsed true from the document body", () => {
        document.body.classList.add("waldiez-sidebar-collapsed");
        const { result } = renderHook(() => useSidebar(), {
            wrapper: SidebarProvider,
        });
        waitFor(() => {
            expect(result.current.isCollapsed).toBe(true);
        });
    });
    it("should set the isCollapsed false the document body", () => {
        document.body.classList.add("waldiez-sidebar-expanded");
        const { result } = renderHook(() => useSidebar(), {
            wrapper: SidebarProvider,
        });
        waitFor(() => {
            expect(result.current.isCollapsed).toBe(false);
        });
    });
});
