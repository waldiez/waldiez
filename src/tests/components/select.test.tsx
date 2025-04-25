/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { Select } from "@waldiez/components/select";

describe("Select", () => {
    it("should render successfully", () => {
        const onChange = vi.fn();
        const selectProps = {
            options: [{ label: "Test", value: "test" }],
            value: { label: "Test", value: "test" },
            styles: {},
            onChange,
        };
        const { baseElement } = render(<Select {...selectProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should handle change", async () => {
        const onChange = vi.fn();
        const selectProps = {
            options: [
                { label: "Test", value: "test" },
                { label: "Test2", value: "test2" },
            ],
            value: { label: "Test", value: "test" },
            styles: {},
            onChange,
        };
        render(<Select {...selectProps} inputId="test-item" />);
        selectEvent.openMenu(screen.getByText("Test"));
        await selectEvent.select(screen.getByText("Test2"), "Test2");
        expect(onChange).toHaveBeenCalledWith(
            {
                label: "Test2",
                value: "test2",
            },
            {
                action: "select-option",
                name: undefined,
                option: undefined,
            },
        );
    });
});
