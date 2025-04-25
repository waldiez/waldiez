/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabItem, TabItems } from "@waldiez/components/tabs";

describe("TabItems", () => {
    it("should render successfully", () => {
        const tabItemsProps = {
            activeTabIndex: 0,
            children: [
                <TabItem key="tab1" id="tab1" label="Tab 1">
                    <div>Tab 1 Content</div>
                </TabItem>,
                <TabItem key="tab2" id="tab2" label="Tab 2">
                    <div>Tab 2 Content</div>
                </TabItem>,
            ],
        };
        const { baseElement } = render(<TabItems {...tabItemsProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should switch tab", () => {
        const tabItemsProps = {
            activeTabIndex: 0,
            children: [
                <TabItem key="tab1" id="tab1" label="Tab 1">
                    <div>Tab 1 Content</div>
                </TabItem>,
                <TabItem key="tab2" id="tab2" label="Tab 2">
                    <div>Tab 2 Content</div>
                </TabItem>,
            ],
        };
        render(<TabItems {...tabItemsProps} />);
        const tab2Button = screen.getByTestId("tab-id-tab2");
        expect(tab2Button).not.toHaveClass("tab-btn--active");
        fireEvent.click(tab2Button);
        expect(tab2Button).toHaveClass("tab-btn--active");
    });
});
