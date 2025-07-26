/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { HandoffCondition } from "@waldiez/components/handoffCondition";
import { WaldiezHandoffCondition } from "@waldiez/models";

const setup = (dataOverrides: WaldiezHandoffCondition, onDataChange = vi.fn()) => {
    render(<HandoffCondition condition={dataOverrides} onDataChange={onDataChange} />);
};

describe("HandoffCondition", () => {
    it("changes condition type to 'expression_context'", async () => {
        const mock = vi.fn();
        setup(
            {
                conditionType: "string_llm",
                prompt: "Prompt",
            },
            mock,
        );

        const select = screen.getByRole("combobox");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Expression check");

        expect(screen.getByTestId("expression-input")).toBeInTheDocument();
    });

    it("updates LLM prompt", () => {
        const mock = vi.fn();
        setup({ conditionType: "string_llm", prompt: "initial prompt" }, mock);
        const input = screen.getByTestId("llm-prompt-input");
        fireEvent.change(input, { target: { value: "updated prompt" } });
        expect(mock).toHaveBeenCalledWith({
            conditionType: "string_llm",
            prompt: "updated prompt",
        });
    });

    it("updates context LLM prompt", () => {
        const mock = vi.fn();
        setup({ conditionType: "context_str_llm", context_str: "" }, mock);
        const input = screen.getByTestId("context-llm-prompt-input");
        fireEvent.change(input, { target: { value: "context prompt" } });
        expect(mock).toHaveBeenCalledWith({
            conditionType: "context_str_llm",
            context_str: "context prompt",
        });
    });

    it("updates variable name", () => {
        const mock = vi.fn();
        setup({ conditionType: "string_context", variable_name: "" }, mock);
        const input = screen.getByTestId("variable-name-input");
        fireEvent.change(input, { target: { value: "user_logged_in" } });
        expect(mock).toHaveBeenCalledWith({
            conditionType: "string_context",
            variable_name: "user_logged_in",
        });
    });

    it("updates expression", () => {
        const mock = vi.fn();
        setup({ conditionType: "expression_context", expression: "" }, mock);
        const input = screen.getByTestId("expression-input");
        fireEvent.change(input, { target: { value: "len(${orders}) > 0" } });
        expect(mock).toHaveBeenCalledWith({
            conditionType: "expression_context",
            expression: "len(${orders}) > 0",
        });
    });

    it("clears selected condition", async () => {
        const mock = vi.fn();
        setup({ conditionType: "string_llm", prompt: "..." }, mock);
        const select = screen.getByRole("combobox");
        await selectEvent.clearFirst(select);
        expect(mock).not.toHaveBeenCalled();
    });
});
