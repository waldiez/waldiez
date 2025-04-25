/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Collapsible } from "@waldiez/components/collapsible";

describe("Collapsible", () => {
    it("should render successfully", () => {
        const collapsibleProps = {
            title: "Collapsible Title",
            children: <div>Collapsible Content</div>,
        };
        const { baseElement } = render(<Collapsible {...collapsibleProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should toggle content", () => {
        const collapsibleProps = {
            title: "Collapsible Title",
            children: <div>Collapsible Content</div>,
        };
        render(<Collapsible {...collapsibleProps} />);
        const collapsibleHeader = screen.getByText("Collapsible Title");
        fireEvent.click(collapsibleHeader);
        const collapsibleContent = screen.getByText("Collapsible Content");
        expect(collapsibleContent).toBeVisible();
        fireEvent.click(collapsibleHeader);
        const collapsibleContentHidden = screen.queryByText("Collapsible Content");
        expect(collapsibleContentHidden).toBeNull();
    });
});
