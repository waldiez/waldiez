/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderEdge } from "../common";
import { edgeProps, flowId } from "../data";

describe("WaldiezEdgeModalTab message", () => {
    it("updates the message type", async () => {
        renderEdge("chat");
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
        const messageTypeSelect = screen.getByLabelText("Message Type:");
        expect(messageTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(messageTypeSelect);
        await selectEvent.select(messageTypeSelect, "None");
        fireEvent.change(messageTypeSelect, {
            label: "None",
            target: { value: "none" },
        });
    });
    it("updates the message content", async () => {
        renderEdge("chat");
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
        const messageContentInput = screen.getByTestId("message-text") as HTMLTextAreaElement;
        fireEvent.change(messageContentInput, {
            target: { value: "Updated message content" },
        });
        expect(messageContentInput.value).toBe("Updated message content");
    });
    it("adds a message context entry", async () => {
        renderEdge("chat");
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
        const newKeyInput = screen.getByTestId("new-dict-message-context-key") as HTMLInputElement;
        fireEvent.change(newKeyInput, { target: { value: "key" } });
        const newValueInput = screen.getByTestId("new-dict-message-context-value") as HTMLInputElement;
        fireEvent.change(newValueInput, { target: { value: "value" } });
        const addButton = screen.getByTestId("add-new-dict-message-context-item");
        fireEvent.click(addButton);
    });
    it("removes a message context entry", () => {
        renderEdge("chat", {
            message: {
                type: "string",
                content: "content",
                context: { key1: "value1" },
            },
        });
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
        // `delete-dict-item-${index}`
        const deleteButton = screen.getByTestId("delete-dict-item-message-context-0");
        fireEvent.click(deleteButton);
    });
    it("updates a message context entry", () => {
        renderEdge("chat", {
            message: {
                type: "string",
                content: "content",
                context: { key1: "value1" },
            },
        });
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
        const keyInput = screen.getByTestId("key-input-message-context-0") as HTMLInputElement;
        fireEvent.change(keyInput, { target: { value: "updatedKey" } });
        const valueInput = screen.getByTestId("value-input-message-context-0") as HTMLInputElement;
        fireEvent.change(valueInput, { target: { value: "updatedValue" } });
        // `save-dict-item-${index}`
        const saveButton = screen.getByTestId("save-dict-item-message-context-0");
        fireEvent.click(saveButton);
    });
});
