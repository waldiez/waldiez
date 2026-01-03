/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SideBar, SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";
import type { WaldiezNodeType } from "@waldiez/types";

describe("SideBar", () => {
    let onSelectNodeType: (nodeType: WaldiezNodeType) => void;

    const renderSidebar = (selectedNodeType: WaldiezNodeType = "agent") => {
        onSelectNodeType = vi.fn();
        return render(
            <WaldiezThemeProvider>
                <SidebarProvider collapsed={false}>
                    <WaldiezProvider flowId="wf-1" nodes={[]} edges={[]}>
                        <SideBar
                            onSelectNodeType={onSelectNodeType}
                            selectedNodeType={selectedNodeType}
                            isReadonly={false}
                        />
                    </WaldiezProvider>
                </SidebarProvider>
            </WaldiezThemeProvider>,
        );
    };
    beforeEach(() => {
        document.body.classList.add("waldiez-sidebar-expanded");
    });
    afterEach(() => {
        vi.resetAllMocks();
    });
    it("should render", () => {
        renderSidebar();
        const sidebar = screen.getByTestId("sidebar-wf-1");
        expect(sidebar).toBeInTheDocument();
    });
    it("should toggle sidebar", () => {
        renderSidebar();
        const toggleButton = screen.getByTestId("sidebar-toggle");
        fireEvent.click(toggleButton);
        waitFor(() => {
            expect(toggleButton).toHaveTextContent("Open sidebar");
        });
    });
    it("should open the edit modal", () => {
        renderSidebar();
        const editButton = screen.getByTestId("edit-flow-wf-1-sidebar-button");
        fireEvent.click(editButton);
        expect(screen.getByTestId("edit-flow-modal-wf-1")).toBeInTheDocument();
    });
    it("should call onNodeTypeSelected with agent", () => {
        renderSidebar("model");
        fireEvent.click(screen.getByTestId("show-agents"));
        expect(onSelectNodeType).toBeCalledTimes(1);
    });

    it("should call onNodeTypeSelected with model", () => {
        renderSidebar();
        fireEvent.click(screen.getByTestId("show-models"));
        expect(onSelectNodeType).toBeCalledTimes(1);
    });

    it("should call onNodeTypeSelected with tool", () => {
        renderSidebar();
        fireEvent.click(screen.getByTestId("show-tools"));
        expect(onSelectNodeType).toBeCalledTimes(1);
    });
    const ensureAgentsView = () => {
        const userDnd = screen.queryAllByTestId("user-dnd");
        if (userDnd.length > 0) {
            return;
        }
        const toggleAgentsView = screen.getByTestId("show-agents");
        fireEvent.click(toggleAgentsView);
    };
    it("should drag start", () => {
        renderSidebar();
        ensureAgentsView();
        fireEvent.dragStart(screen.getByTestId("user-dnd"), {
            dataTransfer: { setData: vi.fn() },
        });
        fireEvent.dragStart(screen.getByTestId("assistant-dnd"), {
            dataTransfer: { setData: vi.fn() },
        });
    });
});

describe("SideBar Read Only", () => {
    it("should not be visible", () => {
        const onSelectNodeType = vi.fn();
        render(
            <WaldiezThemeProvider>
                <SidebarProvider collapsed={false}>
                    <WaldiezProvider flowId="wf-1" nodes={[]} edges={[]} isReadOnly>
                        <SideBar onSelectNodeType={onSelectNodeType} selectedNodeType={"agent"} isReadonly />
                    </WaldiezProvider>
                </SidebarProvider>
            </WaldiezThemeProvider>,
        );
        const sidebar = screen.queryByTestId("sidebar-wf-1");
        // it is in the document, but it should have visibility: hidden (and with,height,margin,padding 0)
        expect(sidebar).toBeInTheDocument();
        // className={`sidebar ${isReadonly ? "hidden" : ""}`}
        // data-testid={`sidebar-${flowId}`}
        const className = sidebar?.getAttribute("class");
        expect(className).toContain("hidden");
    });
});
