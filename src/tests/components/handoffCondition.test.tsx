/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { HandoffCondition } from "@waldiez/components/handoffCondition";
import type { WaldiezHandoffCondition } from "@waldiez/models/types";

const setup = (
    dataOverrides: WaldiezHandoffCondition,
    onDataChange = vi.fn(),
    contextVariables: string[] = [],
) => {
    render(
        <HandoffCondition
            condition={dataOverrides}
            contextVariables={contextVariables}
            onDataChange={onDataChange}
        />,
    );
    return { onDataChange };
};

describe("HandoffCondition", () => {
    it("changes condition type to 'expression_context' and shows expression builder", async () => {
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

        await waitFor(() => {
            expect(screen.getByTestId("toggle-free-form-expression-mode")).toBeInTheDocument();
        });
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

    it("uses context variable <Select> in string_context mode and updates variable_name", async () => {
        const mock = vi.fn();
        setup(
            {
                conditionType: "string_context",
                variable_name: "",
            },
            mock,
            ["user_logged_in", "user_is_admin"],
        );

        const variableSelect = screen.getByLabelText("Variable Name:");
        selectEvent.openMenu(variableSelect);
        await selectEvent.select(variableSelect, "user_logged_in");

        await waitFor(() => {
            expect(mock).toHaveBeenLastCalledWith({
                conditionType: "string_context",
                variable_name: "user_logged_in",
            });
        });
    });

    it("updates expression via advanced mode textarea in expression_context", () => {
        const mock = vi.fn();
        setup(
            {
                conditionType: "expression_context",
                expression: "",
            },
            mock,
            ["orders"],
        );

        // Switch ExpressionBuilder to advanced mode
        const toggle = screen.getByTestId("toggle-free-form-expression-mode") as HTMLInputElement;
        fireEvent.click(toggle);
        expect(toggle).toBeChecked();

        const textarea = screen.getByTestId("expression-input");
        fireEvent.change(textarea, {
            target: { value: "len(${orders}) > 0" },
        });

        expect(mock).toHaveBeenLastCalledWith({
            conditionType: "expression_context",
            expression: "len(${orders}) > 0",
        });
    });
});
