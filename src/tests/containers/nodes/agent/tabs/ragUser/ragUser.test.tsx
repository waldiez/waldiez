/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
// import userEvent from '@testing-library/user-event';
import { describe, expect, it } from "vitest";

import { renderAgent } from "../../common";
import { agentId, flowId } from "../../data";

const goToRagTab = () => {
    renderAgent("rag_user_proxy", { openModal: true });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}`);
    fireEvent.click(ragUserTab);
};

describe("Rag User tab main", () => {
    it("should render the Rag User tab", async () => {
        goToRagTab();
        const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}`);
        expect(ragUserTab).toBeInTheDocument();
    });
    it("should render the Rag User sub-tabs", async () => {
        goToRagTab();
        const configTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-retrieveConfig`);
        expect(configTab).toBeInTheDocument();
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-textSplit`);
        expect(textSplitTab).toBeInTheDocument();
        const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-vectorDb`);
        expect(vectorDbTab).toBeInTheDocument();
        const customFunctionsTab = screen.getByTestId(
            `tab-id-wf-${flowId}-agent-ragUser-${agentId}-customFunctions`,
        );
        expect(customFunctionsTab).toBeInTheDocument();
        const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-advanced`);
        expect(advancedTab).toBeInTheDocument();
    });
    // eslint-disable-next-line max-statements
    it("should change the active tab", async () => {
        goToRagTab();
        const retrieveConfigTab = screen.getByTestId(
            `tab-id-wf-${flowId}-agent-ragUser-${agentId}-retrieveConfig`,
        );
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-textSplit`);
        const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-vectorDb`);
        const customFunctionsTab = screen.getByTestId(
            `tab-id-wf-${flowId}-agent-ragUser-${agentId}-customFunctions`,
        );
        const advancedTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-advanced`);
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
