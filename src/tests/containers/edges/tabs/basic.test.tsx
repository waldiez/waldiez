/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderEdge } from "../common";
import { edgeId, edgeProps } from "../data";

describe("WaldiezEdgeModalTab basic", () => {
    it("changes edge type", async () => {
        renderEdge("chat");
        // "Message" tab in the modal
        const chatTypeSelect = screen.getByLabelText("Chat Type:");
        expect(chatTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(chatTypeSelect);
        await selectEvent.select(chatTypeSelect, "Nested Chat");
        fireEvent.change(chatTypeSelect, {
            label: "Nested Chat",
            target: { value: "nested" },
        });
        // no "Message" tab in the modal, "Nested Chat" tab is present
    });
    it("discards changes on cancel", () => {
        renderEdge("chat");
        const labelDescription = screen.getByTestId(
            `edge-${edgeId}-description-input`,
        ) as HTMLTextAreaElement;
        fireEvent.change(labelDescription, {
            target: { value: "Updated description" },
        });
        const cancelButton = screen.getByTestId(`modal-cancel-btn-${edgeId}`);
        fireEvent.click(cancelButton);
        const toGainFocus = screen.getByTestId(`edge-${edgeId}-box`);
        fireEvent.click(toGainFocus);
        // open again the modal
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const labelDescriptionAfterCancel = screen.getByTestId(
            `edge-${edgeId}-description-input`,
        ) as HTMLTextAreaElement;
        expect(labelDescriptionAfterCancel.value).toBe("Edge description");
    });
    it("Stores changes on submit", async () => {
        renderEdge("chat");
        const labelDescription = screen.getByTestId(
            `edge-${edgeId}-description-input`,
        ) as HTMLTextAreaElement;
        fireEvent.change(labelDescription, {
            target: { value: "Updated description" },
        });
        const chatTypeSelect = screen.getByLabelText("Chat Type:");
        selectEvent.openMenu(chatTypeSelect);
        await selectEvent.select(chatTypeSelect, "Nested Chat");
        fireEvent.change(chatTypeSelect, {
            label: "Nested Chat",
            target: { value: "nested" },
        });
        const submitButton = screen.getByTestId(`modal-submit-btn-${edgeId}`);
        fireEvent.click(submitButton);
        // open again the modal
        const toGainFocus = screen.getByTestId(`edge-${edgeId}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const labelDescriptionAfterSubmit = screen.getByTestId(
            `edge-${edgeId}-description-input`,
        ) as HTMLTextAreaElement;
        expect(labelDescriptionAfterSubmit.value).toBe("Updated description");
    });
    it("Updates edge description", () => {
        renderEdge("chat");
        const descriptionInput = screen.getByTestId(
            `edge-${edgeId}-description-input`,
        ) as HTMLTextAreaElement;
        fireEvent.change(descriptionInput, {
            target: { value: "Updated description" },
        });
        expect(descriptionInput.value).toBe("Updated description");
    });
    it("Updates clear history", () => {
        renderEdge("chat");
        const clearHistoryCheckbox = screen.getByTestId(
            `edge-${edgeId}-clear-history-checkbox`,
        ) as HTMLInputElement;
        fireEvent.click(clearHistoryCheckbox);
        expect(clearHistoryCheckbox.checked).toBe(true);
    });
    it("Updates max turns", () => {
        renderEdge("chat");
        const maxTurnsInput = screen.getByTestId(`edge-${edgeId}-max-turns-input`) as HTMLInputElement;
        fireEvent.change(maxTurnsInput, { target: { value: "5" } });
        expect(maxTurnsInput.value).toBe("5");
    });
    it("changes the summary method type", async () => {
        renderEdge("chat", {
            summary: {
                method: null,
                prompt: "",
                args: {},
            },
        });
        const summaryMethodSelect = screen.getByLabelText("Summary Method:");
        expect(summaryMethodSelect).toBeInTheDocument();
        selectEvent.openMenu(summaryMethodSelect);
        await selectEvent.select(summaryMethodSelect, "Last Message");
        fireEvent.change(summaryMethodSelect, {
            target: { label: "Last Message", value: "lastMsg" },
        });
    });
    it("updates the LLM prompt", () => {
        renderEdge("chat", {
            summary: {
                method: "reflectionWithLlm",
                prompt: "",
                args: { summary_role: "user" },
            },
        });
        const llmPromptInput = screen.getByTestId(`edge-${edgeId}-llm-prompt-input`) as HTMLTextAreaElement;
        fireEvent.change(llmPromptInput, {
            target: { value: "Updated LLM prompt" },
        });
        expect(llmPromptInput.value).toBe("Updated LLM prompt");
    });
    it("updates the LLM summary role", async () => {
        renderEdge("chat", {
            summary: {
                method: "reflectionWithLlm",
                prompt: "",
                args: { summary_role: "user" },
            },
        });
        const llmSummaryRoleSelect = screen.getByLabelText("Summary Role:");
        expect(llmSummaryRoleSelect).toBeInTheDocument();
        selectEvent.openMenu(llmSummaryRoleSelect);
        await selectEvent.select(llmSummaryRoleSelect, "Assistant");
        fireEvent.change(llmSummaryRoleSelect, {
            target: { label: "Assistant", value: "assistant" },
        });
    });
});
