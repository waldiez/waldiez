/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { onChange, renderFlow } from "./common";

describe("WaldiezFlow Nodes and Edges", () => {
    it("should add a model node", async () => {
        await act(async () => {
            await renderFlow();
        });
        expect(screen.queryByTestId("model-0")).toBeNull();
        fireEvent.click(screen.getByTestId("show-models"));
        fireEvent.click(screen.getByTestId("add-model-node"));
    });
    it("should add a tool node", async () => {
        await act(async () => {
            await renderFlow();
        });
        expect(screen.queryByTestId("tool-0")).toBeNull();
        fireEvent.click(screen.getByTestId("show-tools"));
        fireEvent.click(screen.getByTestId("add-tool-node"));
    });
    it("should open edge edit modal on double click", async () => {
        await act(async () => {
            await renderFlow();
        });
        const firstEdge = screen.getByTestId("rf__edge-edge-0");
        fireEvent.doubleClick(firstEdge);
    });
    it("should call on edgesChange when edge is un-selected", async () => {
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("rf__edge-edge-0"));
        fireEvent.click(screen.getByTestId("rf__edge-edge-1"));
        expect(onChange).toHaveBeenCalled();
    });
    it("should connect two agents with an edge", async () => {
        await act(async () => {
            await renderFlow();
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
