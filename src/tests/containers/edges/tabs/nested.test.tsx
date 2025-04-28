/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderEdge } from "../common";
import { edgeId, edgeProps, flowId } from "../data";

describe("WaldiezEdgeModalTabNested", () => {
    it("updates the nested chat message type", async () => {
        renderEdge("nested");
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeId}`);
        fireEvent.click(tab);
        const messageTypeSelect = screen.getByLabelText("Message Type:");
        expect(messageTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(messageTypeSelect);
        await selectEvent.select(messageTypeSelect, "Text");
        fireEvent.change(messageTypeSelect, {
            label: "Text",
            target: { value: "string" },
        });
    });
    it("updates the nested chat message content", async () => {
        renderEdge("nested");
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeId}`);
        fireEvent.click(tab);
        const messageTypeSelect = screen.getByLabelText("Message Type:");
        expect(messageTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(messageTypeSelect);
        await selectEvent.select(messageTypeSelect, "Text");
        fireEvent.change(messageTypeSelect, {
            label: "Text",
            target: { value: "string" },
        });
        const messageContentInput = screen.getByTestId("message-text") as HTMLTextAreaElement;
        fireEvent.change(messageContentInput, {
            target: { value: "Updated message content" },
        });
        expect(messageContentInput.value).toBe("Updated message content");
    });
    it("updates the nested chat reply type", async () => {
        renderEdge("nested");
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
        const replyTab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-chat-${edgeProps.id}-reply`);
        fireEvent.click(replyTab);
        const replyTypeSelect = screen.getByLabelText("Reply Type:");
        expect(replyTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(replyTypeSelect);
        await selectEvent.select(replyTypeSelect, "Text");
        fireEvent.change(replyTypeSelect, {
            label: "Text",
            target: { value: "string" },
        });
    });
    it("updates the nested chat reply content", async () => {
        renderEdge("nested");
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
        const replyTab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-chat-${edgeProps.id}-reply`);
        fireEvent.click(replyTab);
        const replyTypeSelect = screen.getByLabelText("Reply Type:");
        expect(replyTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(replyTypeSelect);
        await selectEvent.select(replyTypeSelect, "Text");
        fireEvent.change(replyTypeSelect, {
            label: "Text",
            target: { value: "string" },
        });
        const replyContentInput = screen.getByTestId("message-text") as HTMLTextAreaElement;
        fireEvent.change(replyContentInput, {
            target: { value: "Updated reply content" },
        });
        expect(replyContentInput.value).toBe("Updated reply content");
    });
});
