/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { OnConditionAvailable } from "@waldiez/components/swarm/onConditionAvailable/main";
import { DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT } from "@waldiez/models/Agent/Swarm/OnCondition";

describe("OnConditionAvailable", () => {
    let onDataChange: any;
    let props: any;

    beforeEach(() => {
        onDataChange = vi.fn();
        props = {
            data: { type: "none", value: null },
            flowId: "flowId",
            darkMode: true,
            onDataChange,
        };
    });

    it("renders", () => {
        render(<OnConditionAvailable {...props} />);
        expect(screen.getByText("Enable Availability Check")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).not.toBeChecked();
        expect(screen.queryByText("Availability Check Type:")).toBeNull();
    });

    it("renders enabled", () => {
        props.data = { type: "string", value: "" };
        render(<OnConditionAvailable {...props} />);
        expect(screen.getByText("Enable Availability Check")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        expect(screen.getByText("Availability Check Type:")).toBeInTheDocument();
    });
    it("switches to enabled", () => {
        render(<OnConditionAvailable {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        expect(onDataChange).toHaveBeenCalledWith({ type: "string", value: "" });
    });
    it("switches to disabled", () => {
        props.data = { type: "string", value: "" };
        render(<OnConditionAvailable {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        expect(onDataChange).toHaveBeenCalledWith({ type: "none", value: null });
    });
    it("handles type change", async () => {
        props.data = { type: "string", value: "" };
        render(<OnConditionAvailable {...props} />);
        const select = screen.getByLabelText("Availability Check Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        // selectEvent.openMenu(screen.getByLabelText("Availability Check Type:"));
        await selectEvent.select(screen.getByText("Method"), "Method");
        expect(onDataChange).toHaveBeenCalledWith({
            type: "callable",
            value: DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT,
        });
    });
    it("handles string change", () => {
        props.data = { type: "string", value: "" };
        render(<OnConditionAvailable {...props} />);
        fireEvent.change(screen.getByTestId("onConditionAvailableVariableInput"), {
            target: { value: "test" },
        });
        expect(onDataChange).toHaveBeenCalledWith({ type: "string", value: "test" });
    });
    it("handles callable change", () => {
        props.data = { type: "callable", value: "" };
        render(<OnConditionAvailable {...props} />);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeInTheDocument();
        fireEvent.change(editor, { target: { value: "test" } });
        expect(onDataChange).toHaveBeenCalledWith({ type: "callable", value: "test" });
    });
});
