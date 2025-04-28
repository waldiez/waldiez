/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { describe, it } from "vitest";

import { onConvert, onSave, renderFlow } from "./common";
import { flowId } from "./data";

const undoAction = async (user: UserEvent) => {
    act(() => {
        renderFlow();
    });
    fireEvent.click(screen.getByTestId("show-agents"));
    const agentFooter = screen.getByTestId("agent-footer-agent-0");
    expect(agentFooter).toBeTruthy();
    const cloneDiv = agentFooter.querySelector(".clone-agent");
    expect(cloneDiv).toBeTruthy();
    fireEvent.click(cloneDiv as HTMLElement);
    vi.advanceTimersByTime(50);
    const clonedAgentView = screen.queryAllByText("Node 0 (copy)");
    expect(clonedAgentView.length).toBeGreaterThanOrEqual(1);
    await user.keyboard("{Control>}z{/Control}");
    vi.advanceTimersByTime(50);
    const clonedAgentViewAfterUndo = screen.queryAllByText("Node 0 (copy)");
    expect(clonedAgentViewAfterUndo).toHaveLength(0);
};

describe("Flow Undo Redo", () => {
    const user = userEvent.setup();
    it("should undo an action", async () => {
        await undoAction(user);
    });
    it("should redo an action", async () => {
        await undoAction(user);
        await user.keyboard("{Control>}y{/Control}");
        vi.advanceTimersByTime(50);
        const clonedAgentViewAfterRedo = screen.queryAllByText("Node 0 (copy)");
        expect(clonedAgentViewAfterRedo.length).toBeGreaterThanOrEqual(1);
    });
});

describe("Flow Save", () => {
    it("should save the flow", async () => {
        onSave.mockClear();
        const user = userEvent.setup();
        act(() => {
            renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-agents"));
        const agentFooter = screen.getByTestId("agent-footer-agent-0");
        expect(agentFooter).toBeTruthy();
        const cloneDiv = agentFooter.querySelector(".clone-agent");
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
        act(() => {
            renderFlow();
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
        act(() => {
            renderFlow();
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
