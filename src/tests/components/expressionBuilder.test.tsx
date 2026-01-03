/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { ExpressionBuilder } from "@waldiez/components/expressionBuilder";

const setup = (
    value = "",
    {
        contextVariables = ["orders", "is_logged_in"],
        defaultAdvanced = false,
        onChange = vi.fn(),
    }: {
        contextVariables?: string[];
        defaultAdvanced?: boolean;
        onChange?: (value: string) => void;
    } = {},
) => {
    render(
        <ExpressionBuilder
            value={value}
            onChange={onChange}
            contextVariables={contextVariables}
            defaultAdvanced={defaultAdvanced}
        />,
    );

    return { onChange };
};

describe("ExpressionBuilder", () => {
    it("builds expression from variable, operator and constant using ${var} syntax", async () => {
        const { onChange } = setup();

        const [variableSelect, operatorSelect] = screen.getAllByRole("combobox");
        const constantInput = screen.getByTestId("expression-constant-input");
        // Select context variable: "orders"
        selectEvent.openMenu(variableSelect!);
        await selectEvent.select(variableSelect!, "orders");

        // Enter constant value: 3
        fireEvent.change(constantInput, { target: { value: "3" } });

        // By default operator is "=="
        expect(onChange).toHaveBeenLastCalledWith("${orders} == 3");

        // Change operator to ">"
        selectEvent.openMenu(operatorSelect!);
        await selectEvent.select(operatorSelect!, ">");

        expect(onChange).toHaveBeenLastCalledWith("${orders} > 3");
    });

    it("allows editing free-form expression in advanced mode", () => {
        const { onChange } = setup("", { defaultAdvanced: true });
        const checkbox = screen.getByLabelText("Use advanced free-form expression");
        expect(checkbox).toBeChecked();
        const textarea = screen.getByTestId("expression-input");
        fireEvent.change(textarea, {
            target: { value: "len(${orders}) > 3" },
        });
        expect(onChange).toHaveBeenLastCalledWith("len(${orders}) > 3");
    });

    it("parses existing ${var} expression when switching from advanced to builder", () => {
        const initial = "${orders} >= 2";
        setup(initial, { defaultAdvanced: true });

        const checkbox = screen.getByLabelText("Use advanced free-form expression");

        // Switch to builder mode
        fireEvent.click(checkbox);
        waitFor(() => {
            expect(checkbox).toBeChecked();
        });

        // Builder should have parsed the constant part "2"
        const constantInput = screen.getByTestId("expression-constant-input") as HTMLInputElement;

        expect(constantInput.value).toBe("2");
    });

    it("does not crash when no context variables are provided", async () => {
        const { onChange } = setup("", { contextVariables: [] });

        // There should be only operator select, no variable options
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThanOrEqual(1);

        const constantInput = screen.getByTestId("expression-constant-input");
        fireEvent.change(constantInput, { target: { value: "42" } });

        // With no variable, builder falls back to just the value
        expect(onChange).toHaveBeenLastCalledWith("42");
    });
});
