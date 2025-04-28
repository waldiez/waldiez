/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { onChange, renderFlow } from "./common";

describe("WaldiezFlow Clone Nodes", () => {
    it("should clone a model node", async () => {
        act(() => {
            renderFlow();
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
    it("should clone a skill node", async () => {
        act(() => {
            renderFlow();
        });
        fireEvent.click(screen.getByTestId("show-skills"));
        fireEvent.click(screen.getByTestId("add-skill-node"));
        const skillFooter = screen.getByTestId("skill-footer-skill-0");
        expect(skillFooter).toBeTruthy();
        const cloneDiv = screen.getByTestId("clone-node-skill-0");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        expect(onChange).toHaveBeenCalled();
    });
    it("should clone an agent node", async () => {
        act(() => {
            renderFlow();
        });
        const agentFooter = screen.getByTestId("agent-footer-agent-0");
        expect(agentFooter).toBeTruthy();
        const cloneDiv = agentFooter.querySelector(".clone-agent");
        expect(cloneDiv).toBeTruthy();
        fireEvent.click(cloneDiv as HTMLElement);
        vi.advanceTimersByTime(50);
        expect(onChange).toHaveBeenCalled();
    });
});
