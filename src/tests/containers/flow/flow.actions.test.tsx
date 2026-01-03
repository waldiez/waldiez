/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, it } from "vitest";

import { onConvert, onSave, renderFlow } from "./common";
import { flowId } from "./data";

const undoAction = async (user: UserEvent) => {
    await act(async () => {
        await renderFlow();
    });
    fireEvent.click(screen.getByTestId("show-models"));
    const modelFooter = screen.getByTestId("model-footer-model-0");
    expect(modelFooter).toBeTruthy();
    const cloneDiv = screen.getByTestId("clone-node-model-0");
    expect(cloneDiv).toBeTruthy();
    const modelParent = document.querySelectorAll(".model-node");
    expect(modelParent.length).toBe(2); // two initial models
    fireEvent.click(cloneDiv as HTMLElement);
    vi.advanceTimersByTime(50);
    const modelDivBeforeUndo = document.querySelectorAll(".model-node");
    expect(modelDivBeforeUndo.length).toBe(3);
    await user.keyboard("{Control>}z{/Control}");
    vi.advanceTimersByTime(50);
    const modelDivAfterUndo = document.querySelectorAll(".model-node");
    expect(modelDivAfterUndo.length).toBe(2);
};

describe("Flow Undo Redo", () => {
    const user = userEvent.setup();
    it("should undo an action", async () => {
        await undoAction(user);
    });
    it("should redo an action", async () => {
        await undoAction(user);
        const modelDivBeforeRedo = document.querySelectorAll(".model-node");
        expect(modelDivBeforeRedo.length).toBeGreaterThanOrEqual(1);
        await user.keyboard("{Control>}y{/Control}");
        vi.advanceTimersByTime(50);
        const modelDivAfterRedo = document.querySelectorAll(".model-node");
        expect(modelDivAfterRedo.length).toBe(modelDivBeforeRedo.length + 1);
    });
});

describe("Flow Save", () => {
    it("should save the flow", async () => {
        onSave.mockClear();
        const user = userEvent.setup();
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-models"));
        const cloneDiv = screen.getByTestId("clone-node-model-0");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        await user.keyboard("{Control>}s{/Control}");
        vi.advanceTimersByTime(50);
        expect(onSave).toHaveBeenCalledTimes(1);
        onSave.mockClear();
    });
});

describe("Flow Convert", () => {
    it("should convert the flow to python", async () => {
        onConvert.mockClear();
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-agents"));
        const convertToPyButton = screen.getByTestId(`convert-${flowId}-to-py`);
        expect(convertToPyButton).toBeTruthy();
        fireEvent.click(convertToPyButton);
        vi.advanceTimersByTime(50);
        expect(onConvert).toHaveBeenCalledTimes(1);
        onConvert.mockClear();
    });
    it("should convert the flow to ipynb", async () => {
        onConvert.mockClear();
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-agents"));
        const convertToIpynbButton = screen.getByTestId(`convert-${flowId}-to-ipynb`);
        expect(convertToIpynbButton).toBeTruthy();
        fireEvent.click(convertToIpynbButton);
        vi.advanceTimersByTime(50);
        expect(onConvert).toHaveBeenCalledTimes(1);
        onConvert.mockClear();
    });
});
