/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
// import userEvent from '@testing-library/user-event';
import { describe, expect, it } from "vitest";

import { renderAgent } from "../../common";
import { agentId, flowId } from "../../data";

const goToRagTab = () => {
    renderAgent("rag_user_proxy", { openModal: true });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag`);
    fireEvent.click(ragUserTab);
};

describe("Rag User tab main", () => {
    it("should render the Rag User tab", async () => {
        goToRagTab();
        const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag`);
        expect(ragUserTab).toBeInTheDocument();
    });
    it("should render the Rag User sub-tabs", async () => {
        goToRagTab();
        const configTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-retrieveConfig`);
        expect(configTab).toBeInTheDocument();
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-textSplit`);
        expect(textSplitTab).toBeInTheDocument();
        const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-vectorDb`);
        expect(vectorDbTab).toBeInTheDocument();
        const customFunctionsTab = screen.getByTestId(
            `tab-id-wf-${flowId}-wa-${agentId}-rag-customFunctions`,
        );
        expect(customFunctionsTab).toBeInTheDocument();
        const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-advanced`);
        expect(advancedTab).toBeInTheDocument();
    });

    it("should change the active tab", async () => {
        goToRagTab();
        const retrieveConfigTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-retrieveConfig`);
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-textSplit`);
        const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-vectorDb`);
        const customFunctionsTab = screen.getByTestId(
            `tab-id-wf-${flowId}-wa-${agentId}-rag-customFunctions`,
        );
        const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-advanced`);
        expect(retrieveConfigTab).toBeInTheDocument();
        expect(textSplitTab).toBeInTheDocument();
        expect(vectorDbTab).toBeInTheDocument();
        expect(customFunctionsTab).toBeInTheDocument();
        expect(advancedTab).toBeInTheDocument();
        fireEvent.click(textSplitTab);
        expect(retrieveConfigTab).not.toHaveClass("tab-btn--active");
        expect(textSplitTab).toHaveClass("tab-btn--active");
        fireEvent.click(vectorDbTab);
        expect(textSplitTab).not.toHaveClass("tab-btn--active");
        expect(vectorDbTab).toHaveClass("tab-btn--active");
        fireEvent.click(customFunctionsTab);
        expect(vectorDbTab).not.toHaveClass("tab-btn--active");
        expect(customFunctionsTab).toHaveClass("tab-btn--active");
        fireEvent.click(advancedTab);
        expect(customFunctionsTab).not.toHaveClass("tab-btn--active");
        expect(advancedTab).toHaveClass("tab-btn--active");
    });
});
