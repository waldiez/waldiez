/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect } from "vitest";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId } from "../data";

describe("WaldiezAgentNode User Tab", () => {
    it("Updates the agent name", async () => {
        renderAgent("user_proxy", { openModal: true });
        const nameInput = screen.getByTestId(`agent-name-input-${agentId}`);
        fireEvent.change(nameInput, {
            target: { value: "New Name" },
        });
        await waitFor(() => {
            expect(nameInput).toHaveValue("New Name");
        });
        submitAgentChanges();
    });
    it("Updates the agent's auto-reply", async () => {
        renderAgent("user_proxy", { openModal: true });
        const autoReplyInput = screen.getByTestId(`agent-default-auto-reply-input-${agentId}`);
        fireEvent.change(autoReplyInput, {
            target: { value: "Auto reply" },
        });
        await waitFor(() => {
            expect(autoReplyInput).toHaveValue("Auto reply");
        });
        submitAgentChanges();
    });
    it("Updates the agent's max-consecutive-auto-reply", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: {
                maxConsecutiveAutoReply: 3,
            },
        });
        const maxConsecutiveAutoReplyInput = screen.getByTestId(
            `agent-max-consecutive-auto-reply-input-${agentId}`,
        );
        fireEvent.change(maxConsecutiveAutoReplyInput, {
            target: { value: "4" },
        });
        await waitFor(() => {
            expect(maxConsecutiveAutoReplyInput).toHaveValue(4);
        });
        submitAgentChanges();
    });
});
