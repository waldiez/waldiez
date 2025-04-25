/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const goToCustomFunctionsTab = async () => {
    renderAgent("rag_user", {
        openModal: true,
    });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}`);
    fireEvent.click(ragUserTab);
    const customFunctionsTab = screen.getByTestId(
        `tab-id-wf-${flowId}-agent-ragUser-${agentId}-customFunctions`,
    );
    fireEvent.click(customFunctionsTab);
};

const expandCollapsible = (tabId: string) => {
    const collapsible = screen.getByTestId(`${flowId}-rag-use-custom-${tabId}`) as HTMLDivElement;
    const collapsibleHeader = collapsible.querySelector(".collapsible-header") as HTMLDivElement;
    fireEvent.click(collapsibleHeader);
};

describe("Rag User tab Custom Functions", () => {
    it("should render the Rag User tab Custom Functions", async () => {
        await goToCustomFunctionsTab();
    });
    it("should change the use custom embedding setting", async () => {
        await goToCustomFunctionsTab();
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-embedding-checkbox`)).not.toBeInTheDocument();
        expandCollapsible("embedding");
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-embedding-checkbox`)).toBeInTheDocument();
    });
    it("should change the embedding function content", async () => {
        await goToCustomFunctionsTab();
        expandCollapsible("embedding");
        const useCustomEmbeddingCheckbox = screen.queryByTestId(
            `${flowId}-rag-use-custom-embedding-checkbox`,
        ) as HTMLInputElement;
        fireEvent.click(useCustomEmbeddingCheckbox);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeInTheDocument();
        fireEvent.change(editor, {
            target: {
                value: "new-embedding-function",
            },
        });
        submitAgentChanges();
    });
    it("should change the use custom token count setting", async () => {
        await goToCustomFunctionsTab();
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-tokenCount-checkbox`)).not.toBeInTheDocument();
        expandCollapsible("tokenCount");
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-tokenCount-checkbox`)).toBeInTheDocument();
    });
    it("should change the token count function content", async () => {
        await goToCustomFunctionsTab();
        expandCollapsible("tokenCount");
        const useCustomTokenCountCheckbox = screen.queryByTestId(
            `${flowId}-rag-use-custom-tokenCount-checkbox`,
        ) as HTMLInputElement;
        fireEvent.click(useCustomTokenCountCheckbox);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeInTheDocument();
        fireEvent.change(editor, {
            target: {
                value: "new-token-count-function",
            },
        });
        submitAgentChanges();
    });
    it("should change the use custom text split setting", async () => {
        await goToCustomFunctionsTab();
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-textSplit-checkbox`)).not.toBeInTheDocument();
        expandCollapsible("textSplit");
        expect(screen.queryByTestId(`${flowId}-rag-use-custom-textSplit-checkbox`)).toBeInTheDocument();
    });
    it("should change the text split function content", async () => {
        await goToCustomFunctionsTab();
        expandCollapsible("textSplit");
        const useCustomTextSplitCheckbox = screen.queryByTestId(
            `${flowId}-rag-use-custom-textSplit-checkbox`,
        ) as HTMLInputElement;
        fireEvent.click(useCustomTextSplitCheckbox);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeInTheDocument();
        fireEvent.change(editor, {
            target: {
                value: "new-text-split-function",
            },
        });
        submitAgentChanges();
    });
});
