/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

const goToNestedChatsTab = () => {
    renderAgent("assistant", {
        openModal: true,
        includeNestedChats: true,
        dataOverrides: {
            nestedChats: [
                {
                    triggeredBy: ["test-agent0"],
                    messages: [{ id: "test-edge-1", isReply: true }],
                },
            ],
        },
    });
    // Click on the Nested Chats tab
    const nestedChatsTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-nested`);
    expect(nestedChatsTab).toBeInTheDocument();
    fireEvent.click(nestedChatsTab);
};

describe("Nested Chats tab triggers", () => {
    it("should add a new trigger", async () => {
        goToNestedChatsTab();
        const selectTrigger = screen.getByLabelText("Triggered by:");
        expect(selectTrigger).toBeInTheDocument();
        selectEvent.openMenu(selectTrigger);
        await selectEvent.select(selectTrigger, ["Agent 0", "Agent 1"]);
        fireEvent.change(selectTrigger, {
            target: [
                {
                    label: "Agent 0",
                    value: "test-agent0",
                },
                {
                    label: "Agent 1",
                    value: "test-agent1",
                },
            ],
        });
        submitAgentChanges();
    });
});
