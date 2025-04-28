/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { flowId } from "../data";
import { renderFlow } from "./common";

describe("WaldiezFlow User Input modal", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    it("should open the user input modal", () => {
        act(() => {
            renderFlow(true);
        });
        expect(screen.getByTestId(`rf-${flowId}-user-input-modal`)).toBeTruthy();
    });
    it("should close the user input modal on submit", async () => {
        act(() => {
            renderFlow(true);
        });
        const submitButton = screen.getByTestId(`rf-${flowId}-user-input-modal-submit`);
        expect(submitButton).toBeTruthy();
        const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
        expect(input).toBeTruthy();
        fireEvent.change(input, { target: { value: "User Input" } });
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
        });
    });
    it("should close the user input modal on Cancel", async () => {
        act(() => {
            renderFlow(true);
        });
        const cancelButton = screen.getByTestId(`rf-${flowId}-user-input-modal-cancel`);
        expect(cancelButton).toBeTruthy();
        fireEvent.click(cancelButton);
        await waitFor(() => {
            expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
        });
    });
    it("should submit on Enter key press", async () => {
        act(() => {
            renderFlow(true);
        });
        const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
        fireEvent.keyDown(input, { key: "Enter" });
        await waitFor(() => {
            expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
        });
    });
    it("should cancel on Esc key press", async () => {
        act(() => {
            renderFlow(true);
        });
        const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
        fireEvent.keyDown(input, { key: "Escape" });
        await waitFor(() => {
            expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
        });
    });
});
