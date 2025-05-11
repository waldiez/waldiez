/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { ChatAvailability } from "@waldiez/components/chatAvailability";
import { WaldiezHandoffCondition } from "@waldiez/models";

const setup = (dataOverrides: WaldiezHandoffCondition | null = null, onDataChange = vi.fn()) => {
    render(<ChatAvailability condition={dataOverrides} onDataChange={onDataChange} />);
};

describe("ChatAvailability", () => {
    it("renders with availability checkbox unchecked by default", () => {
        setup();
        const checkbox = screen.getByTestId("availability-enabled-checkbox") as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it("toggles availability checkbox", () => {
        const mock = vi.fn();
        setup(
            {
                condition_type: "string_llm",
                prompt: "initial",
            },
            mock,
        );
        const checkbox = screen.getByTestId("availability-enabled-checkbox");
        // expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        fireEvent.click(checkbox);
        // expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(mock).toHaveBeenCalledWith(null);
    });

    it("shows select input when availability is enabled", async () => {
        setup({
            condition_type: "string_llm",
            prompt: "",
        });
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("changes condition type to 'expression_context'", async () => {
        const mock = vi.fn();
        setup({ condition_type: "string_llm", prompt: "Prompt" }, mock);

        const select = screen.getByRole("combobox");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Expression check");

        expect(screen.getByTestId("expression-input")).toBeInTheDocument();
    });

    it("updates LLM prompt", () => {
        const mock = vi.fn();
        setup({ condition_type: "string_llm", prompt: "initial prompt" }, mock);
        const input = screen.getByTestId("llm-prompt-input");
        fireEvent.change(input, { target: { value: "updated prompt" } });
        expect(mock).toHaveBeenCalledWith({
            condition_type: "string_llm",
            prompt: "updated prompt",
        });
    });

    it("updates context LLM prompt", () => {
        const mock = vi.fn();
        setup({ condition_type: "context_str_llm", context_str: "" }, mock);
        const input = screen.getByTestId("context-llm-prompt-input");
        fireEvent.change(input, { target: { value: "context prompt" } });
        expect(mock).toHaveBeenCalledWith({
            condition_type: "context_str_llm",
            context_str: "context prompt",
        });
    });

    it("updates variable name", () => {
        const mock = vi.fn();
        setup({ condition_type: "string_context", variable_name: "" }, mock);
        const input = screen.getByTestId("variable-name-input");
        fireEvent.change(input, { target: { value: "user_logged_in" } });
        expect(mock).toHaveBeenCalledWith({
            condition_type: "string_context",
            variable_name: "user_logged_in",
        });
    });

    it("updates expression", () => {
        const mock = vi.fn();
        setup({ condition_type: "expression_context", expression: "" }, mock);
        const input = screen.getByTestId("expression-input");
        fireEvent.change(input, { target: { value: "len(${orders}) > 0" } });
        expect(mock).toHaveBeenCalledWith({
            condition_type: "expression_context",
            expression: "len(${orders}) > 0",
        });
    });

    it("clears selected condition", async () => {
        const mock = vi.fn();
        setup({ condition_type: "string_llm", prompt: "..." }, mock);
        const select = screen.getByRole("combobox");
        selectEvent.clearFirst(select);
        expect(mock).toHaveBeenCalledWith(null);
    });
});
