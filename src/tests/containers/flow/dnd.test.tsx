/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, it } from "vitest";

import {
    assistantDataTransfer,
    captainDataTransfer,
    reasoningDataTransfer,
    renderFlow,
    userDataTransfer,
} from "./common";
import { flowId } from "./data";

describe("Flow DnD", () => {
    const ensureAgentsView = () => {
        const userDnd = screen.queryAllByTestId("user-dnd");
        if (userDnd.length > 0) {
            return;
        }
        const toggleAgentsView = screen.getByTestId("show-agents");
        fireEvent.click(toggleAgentsView);
    };
    it("should add a user agent node on drag and drop", async () => {
        act(() => {
            renderFlow();
        });
        ensureAgentsView();
        const sourceElement = screen.getByTestId("user-dnd");
        const targetElement = screen.getByTestId(`drop-area-${flowId}`);
        fireEvent.mouseDown(sourceElement);
        fireEvent.dragStart(sourceElement, {
            dataTransfer: userDataTransfer,
        });
        fireEvent.dragOver(targetElement, {
            dataTransfer: userDataTransfer,
        });
        fireEvent.drop(targetElement, {
            dataTransfer: userDataTransfer,
        });
        fireEvent.mouseUp(targetElement);
    });
    it("should add an assistant agent node on drag and drop", async () => {
        act(() => {
            renderFlow();
        });
        ensureAgentsView();
        const sourceElement = screen.getByTestId("assistant-dnd");
        const targetElement = screen.getByTestId(`drop-area-${flowId}`);
        fireEvent.mouseDown(sourceElement);
        fireEvent.dragStart(sourceElement, {
            dataTransfer: assistantDataTransfer,
        });
        fireEvent.dragOver(targetElement, {
            dataTransfer: assistantDataTransfer,
        });
        fireEvent.drop(targetElement, {
            dataTransfer: assistantDataTransfer,
        });
        fireEvent.mouseUp(targetElement);
    });
    it("should add a reasoning agent node on drag and drop", async () => {
        act(() => {
            renderFlow();
        });
        ensureAgentsView();
        const sourceElement = screen.getByTestId("reasoning-dnd");
        const targetElement = screen.getByTestId(`drop-area-${flowId}`);
        fireEvent.mouseDown(sourceElement);
        fireEvent.dragStart(sourceElement, {
            dataTransfer: reasoningDataTransfer,
        });
        fireEvent.dragOver(targetElement, {
            dataTransfer: reasoningDataTransfer,
        });
        fireEvent.drop(targetElement, {
            dataTransfer: reasoningDataTransfer,
        });
        fireEvent.mouseUp(targetElement);
    });
    it("should add a captain agent node on drag and drop", async () => {
        act(() => {
            renderFlow();
        });
        ensureAgentsView();
        const sourceElement = screen.getByTestId("captain-dnd");
        const targetElement = screen.getByTestId(`drop-area-${flowId}`);
        fireEvent.mouseDown(sourceElement);
        fireEvent.dragStart(sourceElement, {
            dataTransfer: captainDataTransfer,
        });
        fireEvent.dragOver(targetElement, {
            dataTransfer: captainDataTransfer,
        });
        fireEvent.drop(targetElement, {
            dataTransfer: captainDataTransfer,
        });
        fireEvent.mouseUp(targetElement);
    });
});
