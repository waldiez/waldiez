/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { HandoffAvailability } from "@waldiez/components/handoffAvailability";
import type { WaldiezHandoffAvailability } from "@waldiez/models/types";

const setup = (
    dataOverrides: WaldiezHandoffAvailability,
    onDataChange = vi.fn(),
    contextVariables: string[] = ["var_name", "two"],
) => {
    render(
        <HandoffAvailability
            contextVariables={contextVariables}
            available={dataOverrides}
            onDataChange={onDataChange}
        />,
    );
    return { onDataChange };
};

describe("HandoffAvailability", () => {
    it("changes availability type to 'expression' and shows expression builder", async () => {
        const mock = vi.fn();
        setup(
            {
                type: "string",
                value: "var_name",
            },
            mock,
        );

        const select = screen.getByLabelText("Availability Type");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Use an expression");

        await waitFor(() => {
            // ExpressionBuilder renders this checkbox in builder mode
            expect(screen.getByTestId("toggle-free-form-expression-mode")).toBeInTheDocument();
        });
    });

    it("builds expression from variable and constant via ExpressionBuilder and emits value", async () => {
        const mock = vi.fn();
        setup(
            {
                type: "expression",
                value: "",
            },
            mock,
            ["var_name", "two"],
        );

        // In builder mode: variable select + constant input
        const variableSelect = screen.getByLabelText("Context variable");
        const constantInput = screen.getByTestId("expression-constant-input") as HTMLInputElement;

        // Select context variable: "var_name"
        selectEvent.openMenu(variableSelect);
        await selectEvent.select(variableSelect, "var_name");

        // Enter constant value: 3
        fireEvent.change(constantInput, { target: { value: "3" } });

        await waitFor(() => {
            expect(mock).toHaveBeenLastCalledWith({
                type: "expression",
                value: "${var_name} == 3",
            });
        });
    });

    it("enables availability check via checkbox, defaulting to 'string' type", () => {
        const mock = vi.fn();
        setup(
            {
                type: "none",
                value: "",
            },
            mock,
        );

        const checkbox = screen.getByTestId("availability-enabled-checkbox") as HTMLInputElement;
        expect(checkbox).not.toBeChecked();

        // Enable availability
        fireEvent.click(checkbox);

        expect(mock).toHaveBeenLastCalledWith({
            type: "string",
            value: "",
        });
    });

    it("disables availability check via checkbox", () => {
        const mock = vi.fn();
        setup(
            {
                type: "string",
                value: "var_name",
            },
            mock,
        );

        const checkbox = screen.getByTestId("availability-enabled-checkbox") as HTMLInputElement;
        expect(checkbox).toBeChecked();

        // Disable availability
        fireEvent.click(checkbox);

        expect(mock).toHaveBeenLastCalledWith({
            type: "none",
            value: "var_name",
        });
    });

    it("uses context variable <Select> in string mode and updates value", async () => {
        const mock = vi.fn();
        setup(
            {
                type: "string",
                value: "var_name",
            },
            mock,
            ["var_name", "two"],
        );

        const variableSelect = screen.getByLabelText("Variable Name");

        selectEvent.openMenu(variableSelect);
        await selectEvent.select(variableSelect, "two");

        await waitFor(() => {
            expect(mock).toHaveBeenLastCalledWith({
                type: "string",
                value: "two",
            });
        });
    });
});
