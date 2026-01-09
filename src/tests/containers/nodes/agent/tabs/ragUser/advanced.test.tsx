/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

const goToAdvancedTab = () => {
    renderAgent("rag_user_proxy", {
        openModal: true,
    });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag`);
    fireEvent.click(ragUserTab);
    const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-advanced`);
    fireEvent.click(advancedTab);
};

describe("Rag User tab Advanced", () => {
    it("should render the Rag User tab Advanced", async () => {
        goToAdvancedTab();
        const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-advanced`);
        expect(advancedTab).toBeInTheDocument();
    });
    it("should change the customized prompt", async () => {
        goToAdvancedTab();
        const customizedPromptInput = screen.getByTestId(
            `rag-customized-prompt-${agentId}`,
        ) as HTMLInputElement;
        expect(customizedPromptInput).toBeInTheDocument();
        fireEvent.change(customizedPromptInput, {
            target: {
                value: "new-customized-prompt",
            },
        });
        submitAgentChanges();
    });
    it("should change the customized answer prefix", async () => {
        goToAdvancedTab();
        const customizedAnswerPrefixInput = screen.getByTestId(
            `rag-customized-answer-prefix-${agentId}`,
        ) as HTMLInputElement;
        expect(customizedAnswerPrefixInput).toBeInTheDocument();
        fireEvent.change(customizedAnswerPrefixInput, {
            target: {
                value: "new-customized-answer-prefix",
            },
        });
        submitAgentChanges();
    });
    it("should change the update context", async () => {
        goToAdvancedTab();
        const updateContextCheckbox = screen.getByTestId(`rag-update-context-${agentId}`) as HTMLInputElement;
        expect(updateContextCheckbox).toBeInTheDocument();
        fireEvent.click(updateContextCheckbox);
        submitAgentChanges();
    });
    it("should change the get or create", async () => {
        goToAdvancedTab();
        const getOrCreateCheckbox = screen.getByTestId(`rag-get-or-create-${agentId}`) as HTMLInputElement;
        expect(getOrCreateCheckbox).toBeInTheDocument();
        fireEvent.click(getOrCreateCheckbox);
        submitAgentChanges();
    });
    it("should change the new docs", async () => {
        goToAdvancedTab();
        const newDocsCheckbox = screen.getByTestId(`rag-new-docs-${agentId}`) as HTMLInputElement;
        expect(newDocsCheckbox).toBeInTheDocument();
        fireEvent.click(newDocsCheckbox);
        submitAgentChanges();
    });
    it("should change the overwrite", async () => {
        goToAdvancedTab();
        const overwriteCheckbox = screen.getByTestId(`rag-overwrite-${agentId}`) as HTMLInputElement;
        expect(overwriteCheckbox).toBeInTheDocument();
        fireEvent.click(overwriteCheckbox);
        submitAgentChanges();
    });
    it("should change the recursive", async () => {
        goToAdvancedTab();
        const recursiveCheckbox = screen.getByTestId(`rag-recursive-${agentId}`) as HTMLInputElement;
        expect(recursiveCheckbox).toBeInTheDocument();
        fireEvent.click(recursiveCheckbox);
        submitAgentChanges();
    });
});
