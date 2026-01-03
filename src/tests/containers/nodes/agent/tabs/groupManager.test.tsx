/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect } from "vitest";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId } from "../data";

describe("WaldiezAgentNode Group Manager", () => {
    it("Updates the agent name", async () => {
        renderAgent("group_manager", { openModal: true });
        const nameInput = screen.getByTestId(`agent-name-input-${agentId}`);
        fireEvent.change(nameInput, {
            target: { value: "New Name" },
        });
        await waitFor(() => {
            expect(nameInput).toHaveValue("New Name");
        });
        submitAgentChanges();
    });
});
