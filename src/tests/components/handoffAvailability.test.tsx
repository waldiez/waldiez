/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { HandoffAvailability } from "@waldiez/components/handoffAvailability";
import type { WaldiezHandoffAvailability } from "@waldiez/models/types";

const setup = (dataOverrides: WaldiezHandoffAvailability, onDataChange = vi.fn()) => {
    render(<HandoffAvailability available={dataOverrides} onDataChange={onDataChange} />);
};

describe("HandoffAvailability", () => {
    it("changes Availability type to 'expression'", async () => {
        const mock = vi.fn();
        setup(
            {
                type: "string",
                value: "var_name",
            },
            mock,
        );

        const select = screen.getByRole("combobox");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Use an expression");

        expect(screen.getByTestId("expression-input")).toBeInTheDocument();
    });

    it("updates variable name", () => {
        const mock = vi.fn();
        setup({ type: "string", value: "" }, mock);
        const input = screen.getByTestId("string-input");
        fireEvent.change(input, { target: { value: "user_logged_in" } });
        expect(mock).toHaveBeenCalledWith({
            type: "string",
            value: "user_logged_in",
        });
    });

    it("updates expression", () => {
        const mock = vi.fn();
        setup({ type: "expression", value: "" }, mock);
        const input = screen.getByTestId("expression-input");
        fireEvent.change(input, { target: { value: "len(${orders}) > 0" } });
        expect(mock).toHaveBeenCalledWith({
            type: "expression",
            value: "len(${orders}) > 0",
        });
    });
});
