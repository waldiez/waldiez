/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NumberInput } from "@waldiez/components/numberInput";

describe("NumberInput", () => {
    it("should render successfully", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
        };
        const { baseElement } = render(<NumberInput {...numberInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with label as JSX.Element", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: <div>test</div>,
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
        };
        const { baseElement } = render(<NumberInput {...numberInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
            labelInfo: "test",
        };
        const { baseElement } = render(<NumberInput {...numberInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info as JSX.Element", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
            labelInfo: <div>test</div>,
        };
        const { baseElement } = render(<NumberInput {...numberInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should handle change", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: "2" },
        });
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("should handle change with forceInt", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 1,
            min: 0,
            max: 100,
            onChange,
            forceInt: true,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: "2.5" },
        });
        expect(onChange).toHaveBeenCalledWith(2);
    });

    // / check upper/lower limits
    it("should handle change with upper limit", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 90,
            min: 0,
            max: 100,
            setNullOnUpper: true,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: 100 },
        });
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should handle change with upper limit", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 90,
            min: 0,
            max: 100,
            setNullOnUpper: false,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: 100 },
        });
        expect(onChange).toHaveBeenCalledWith(100);
    });

    it("should handle change with lower limit", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 10,
            min: 0,
            max: 100,
            setNullOnLower: true,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: 0 },
        });
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should handle change with lower limit", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 10,
            min: 0,
            max: 100,
            setNullOnLower: false,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        fireEvent.change(screen.getByRole("spinbutton"), {
            target: { value: 0 },
        });
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it("should render correctly with upper label", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 100,
            min: 0,
            max: 100,
            onUpperLabel: "test",
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        // no <input> element
        expect(screen.queryByRole("spinbutton")).toBeNull();
    });
    it("should render correctly with upper label and no prop", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 100,
            min: 0,
            max: 100,
            setNullOnUpper: true,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        // no <input> element
        expect(screen.queryByRole("spinbutton")).toBeNull();
    });

    it("should render correctly with lower label", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 0,
            min: 0,
            max: 100,
            onLowerLabel: "test",
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        // no <input> element
        expect(screen.queryByRole("spinbutton")).toBeNull();
    });
    it("should render correctly with lower label and no prop", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: 0,
            min: 0,
            max: 100,
            setNullOnLower: true,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        // no <input> element
        expect(screen.queryByRole("spinbutton")).toBeNull();
    });

    it("should render correctly with null as value", () => {
        const onChange = vi.fn();
        const numberInputProps = {
            label: "test",
            name: "test",
            value: null,
            min: 0,
            max: 100,
            onChange,
        };
        render(<NumberInput {...numberInputProps} />);
        expect(screen.queryByRole("spinbutton")).toBeTruthy();
    });
});
