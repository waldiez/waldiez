/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { onChange, renderFlow } from "./common";

describe("WaldiezFlow Clone Nodes", () => {
    it("should clone an agent node", async () => {
        await act(async () => {
            await renderFlow();
        });
        // let's first 'select' the agent node
        const agentDiv = screen.getByTestId("agent-node-agent-0-view");
        expect(agentDiv).toBeTruthy();
        fireEvent.click(agentDiv as HTMLElement);
        // now the "copy" icon should be visible
        const cloneDiv = agentDiv.querySelector(".copy-icon");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        vi.advanceTimersByTime(50);
        expect(onChange).toHaveBeenCalled();
    });
    it("should clone a model node", async () => {
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-models"));
        fireEvent.click(screen.getByTestId("add-model-node"));
        const modelFooter = screen.getByTestId("model-footer-model-0");
        expect(modelFooter).toBeTruthy();
        const cloneDiv = screen.getByTestId("clone-node-model-0");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        expect(onChange).toHaveBeenCalled();
    });
    it("should clone a tool node", async () => {
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-tools"));
        fireEvent.click(screen.getByTestId("add-tool-node"));
        const toolFooter = screen.getByTestId("tool-footer-tool-0");
        expect(toolFooter).toBeTruthy();
        const cloneDiv = screen.getByTestId("clone-node-tool-0");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        expect(onChange).toHaveBeenCalled();
    });
});
