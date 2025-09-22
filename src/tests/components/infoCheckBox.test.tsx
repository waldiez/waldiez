/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InfoCheckbox } from "@waldiez/components/infoCheckBox";

describe("InfoCheckbox", () => {
    it("should render successfully", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: "test",
            info: "test",
            checked: false,
            id: "test-id",
            onChange,
        };
        const { baseElement } = render(<InfoCheckbox {...infoCheckboxProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with label as JSX.Element", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: <div>test</div>,
            info: "test",
            checked: false,
            id: "test-id",
            onChange,
        };
        const { baseElement } = render(<InfoCheckbox {...infoCheckboxProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with label as function", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: () => <div>test</div>,
            info: "test",
            checked: false,
            id: "test-id",
            onChange,
        };
        const { baseElement } = render(<InfoCheckbox {...infoCheckboxProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info as JSX.Element", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: "test",
            info: <div>test</div>,
            checked: false,
            id: "test-id",
            onChange,
        };
        const { baseElement } = render(<InfoCheckbox {...infoCheckboxProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info as function", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: "test",
            info: () => <div>test</div>,
            checked: false,
            id: "test-id",
            onChange,
        };
        const { baseElement } = render(<InfoCheckbox {...infoCheckboxProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should handle change", () => {
        const onChange = vi.fn();
        const infoCheckboxProps = {
            label: "test",
            info: "test",
            checked: false,
            id: "test-id",
            onChange,
        };
        render(<InfoCheckbox {...infoCheckboxProps} />);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeTruthy();
        fireEvent.click(checkbox);
        expect(onChange).toHaveBeenCalled();
    });
});
