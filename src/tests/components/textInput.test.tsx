/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useState } from "react";

import { TextInput } from "@waldiez/components/textInput";

describe("TextInput", () => {
    it("should render successfully", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: "test",
            onChange,
        };
        const { baseElement } = render(<TextInput {...textInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with label as React.JSX.Element", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: <div>test</div>,
            value: "test",
            onChange,
        };
        const { baseElement } = render(<TextInput {...textInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: "test",
            onChange,
            labelInfo: "test",
        };
        const { baseElement } = render(<TextInput {...textInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info as React.JSX.Element", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: "test",
            onChange,
            labelInfo: <div>test</div>,
        };
        const { baseElement } = render(<TextInput {...textInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should use onNull", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: null,
            onChange,
            onNull: "test",
        };
        render(<TextInput {...textInputProps} />);
        expect(screen.getByRole("textbox")).toHaveValue("test");
    });

    it("should render with info as React.JSX.Element", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: "test",
            onChange,
            labelInfo: <div>test</div>,
        };
        const { baseElement } = render(<TextInput {...textInputProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should handle change", () => {
        const textInputProps = {
            label: "test",
            value: "test",
        };
        const Wrapper = () => {
            const [value, setValue] = useState("test");
            return <TextInput {...textInputProps} value={value} onChange={e => setValue(e.target.value)} />;
        };
        render(<Wrapper />);
        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "test2" },
        });
        expect(screen.getByRole("textbox")).toHaveValue("test2");
    });

    it("should not change when disabled", () => {
        const onChange = vi.fn();
        const textInputProps = {
            label: "test",
            value: "test",
            onChange,
            disabled: true,
        };
        render(<TextInput {...textInputProps} />);
        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "test2" },
        });
        expect(onChange).not.toHaveBeenCalled();
    });
    // it("should toggle visibility if password", () => {
    //     const onChange = vi.fn();
    //     const textInputProps = {
    //         label: "test",
    //         value: "test",
    //         onChange,
    //         isPassword: true,
    //         dataTestId: "text-input",
    //     };
    //     render(<TextInput {...textInputProps} />);
    //     fireEvent.click(screen.getByTestId("visibility-text-input"));
    //     expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    //     fireEvent.click(screen.getByTestId("visibility-text-input"));
    //     expect(screen.getByRole("textbox")).toHaveAttribute("type", "password");
    // });
});
