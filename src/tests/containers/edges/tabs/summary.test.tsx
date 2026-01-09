/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import type { WaldiezEdgeType } from "@waldiez/models";

import { renderEdge } from "../common";
import { edgeId, flowId } from "../data";

const goToSummaryTab = (edgeType: WaldiezEdgeType, dataOverrides: { [key: string]: any } = {}) => {
    renderEdge(edgeType, dataOverrides);
    const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-summary-${edgeId}`);
    fireEvent.click(tab);
};

describe("WaldiezEdgeModalTab summary", () => {
    it("changes the summary method type", async () => {
        goToSummaryTab("chat", {
            summary: {
                method: null,
                prompt: "",
                args: {},
                content: "",
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
        goToSummaryTab("chat", {
            summary: {
                method: "reflectionWithLlm",
                prompt: "",
                args: { summary_role: "user" },
                content: "",
            },
        });
        const llmPromptInput = screen.getByTestId(`edge-${edgeId}-llm-prompt-input`) as HTMLTextAreaElement;
        fireEvent.change(llmPromptInput, {
            target: { value: "Updated LLM prompt" },
        });
        expect(llmPromptInput.value).toBe("Updated LLM prompt");
    });
    it("updates the LLM summary role", async () => {
        goToSummaryTab("chat", {
            summary: {
                method: "reflectionWithLlm",
                prompt: "",
                args: { summary_role: "user" },
                content: "",
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
