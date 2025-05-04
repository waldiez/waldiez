/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAgent } from "../../common";
import { agentId, flowId } from "../../data";

describe("Nested Chats tab main", () => {
    it("should not render the Nested Chats tab if the agent has no connections", async () => {
        renderAgent("user_proxy");
        expect(screen.queryByTestId(`tab-id-wf-${flowId}-agent-nestedChats-${agentId}`)).toBeNull();
    });
    it("should render the Nested Chats tab if the agent has connections", async () => {
        renderAgent("user_proxy", {
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
        const nestedChatsTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-nestedChats-${agentId}`);
        expect(nestedChatsTab).toBeInTheDocument();
        fireEvent.click(nestedChatsTab);
    });
});
