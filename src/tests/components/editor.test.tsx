/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Editor } from "@waldiez/components/editor";

const onChange = vi.fn();

const renderEditor = (overrides: { [key: string]: any } = {}) => {
    const editorProps = {
        value: "test",
        onChange,
        darkMode: false,
        ...overrides,
    };
    return render(<Editor {...editorProps} />);
};

describe("Editor", () => {
    afterEach(() => {
        onChange.mockClear();
    });
    it("should render successfully", () => {
        const { baseElement } = renderEditor();
        expect(baseElement).toBeTruthy();
    });

    it("should handle value change", () => {
        renderEditor({ value: "test" });
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeTruthy();
        // user types in new value
        fireEvent.change(editor, { target: { value: "newTest" } });
        expect(onChange).toHaveBeenCalledWith("newTest");
    });

    it("should handle dark mode", () => {
        renderEditor({ darkMode: true });
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeTruthy();
        expect(editor.className).toContain("vs-dark");
    });
});
