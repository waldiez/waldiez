/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { onChange, renderFlow } from "./common";

describe("WaldiezFlow Nodes and Edges", () => {
    it("should add a model node", () => {
        renderFlow();
        expect(screen.queryByTestId("model-0")).toBeNull();
        fireEvent.click(screen.getByTestId("show-models"));
        fireEvent.click(screen.getByTestId("add-model-node"));
    });
    it("should add a tool node", () => {
        renderFlow();
        expect(screen.queryByTestId("tool-0")).toBeNull();
        fireEvent.click(screen.getByTestId("show-tools"));
        fireEvent.click(screen.getByTestId("add-tool-node"));
    });
    it("should open edge edit modal on double click", async () => {
        act(() => {
            renderFlow();
        });
        const firstEdge = screen.getByTestId("rf__edge-edge-0");
        fireEvent.doubleClick(firstEdge);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should call on edgesChange when edge is un-selected", async () => {
        act(() => {
            renderFlow();
        });
        fireEvent.click(screen.getByTestId("rf__edge-edge-0"));
        fireEvent.click(screen.getByTestId("rf__edge-edge-1"));
        expect(onChange).toHaveBeenCalled();
    });
    it("should display the agent's linked models", async () => {
        act(() => {
            renderFlow({
                withLinkedModels: true,
            });
        });
        const linkedModelNameView = screen.getByTestId("agent-agent-0-linked-model-0");
        expect(linkedModelNameView.textContent).toBe("Model Node 0");
    });
    it("should display the agents' linked tools", async () => {
        act(() => {
            renderFlow({
                withLinkedTools: true,
            });
        });
        const linkedToolNameView = screen.getByTestId("agent-agent-0-linked-tool-0");
        expect(linkedToolNameView.textContent).toBe("Tool Node 0");
    });
    it("should display the agents' linked models and tools", async () => {
        act(() => {
            renderFlow({
                withLinkedModels: true,
                withLinkedTools: true,
            });
        });
        const linkedModelNameView = screen.getByTestId("agent-agent-0-linked-model-0");
        expect(linkedModelNameView.textContent).toBe("Model Node 0");
        const linkedToolNameView = screen.getByTestId("agent-agent-0-linked-tool-0");
        expect(linkedToolNameView.textContent).toBe("Tool Node 0");
    });
    it("should connect two agents with an edge", async () => {
        act(() => {
            renderFlow();
        });
        // ["source", "target"].forEach(type => {
        ["left", "right", "top", "bottom"].forEach(sourcePosition => {
            const sourceHandle = screen.getByTestId(`agent-handle-${sourcePosition}-source-agent-0`);
            expect(sourceHandle).toBeTruthy();
            ["left", "right", "top", "bottom"].forEach(targetPosition => {
                const targetHandle = screen.getByTestId(`agent-handle-${targetPosition}-target-agent-3`);
                expect(targetHandle).toBeTruthy();
                fireEvent.click(sourceHandle);
                fireEvent.click(targetHandle);
                vi.advanceTimersByTime(500);
            });
        });
    });
});
