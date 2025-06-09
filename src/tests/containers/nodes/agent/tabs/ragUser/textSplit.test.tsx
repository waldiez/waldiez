/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

const goToTextSplitTab = () => {
    renderAgent("rag_user_proxy", {
        openModal: true,
    });
    // const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag`);
    // fireEvent.click(ragUserTab);
    const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-textSplit`);
    fireEvent.click(textSplitTab);
};

describe("Rag User tab Text Split", () => {
    it("should render the Rag User tab Text Split", () => {
        goToTextSplitTab();
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-textSplit`);
        expect(textSplitTab).toBeInTheDocument();
    });
    it("should change the chunk token size", () => {
        goToTextSplitTab();
        const chunkTokenSizeInput = screen.getByTestId(`rag-chunk-token-size-${agentId}`) as HTMLInputElement;
        expect(chunkTokenSizeInput).toBeInTheDocument();
        fireEvent.change(chunkTokenSizeInput, {
            target: {
                value: "100",
            },
        });
        submitAgentChanges();
    });
    it("should change the context max tokens", async () => {
        goToTextSplitTab();
        const contextMaxTokensInput = screen.getByTestId(
            `rag-context-max-tokens-${agentId}`,
        ) as HTMLInputElement;
        expect(contextMaxTokensInput).toBeInTheDocument();
        fireEvent.change(contextMaxTokensInput, {
            target: {
                value: "200",
            },
        });
        submitAgentChanges();
    });
    it("should change the chunk mode", async () => {
        goToTextSplitTab();
        const chunkModeSelect = screen.getByLabelText("Chunk Mode");
        selectEvent.openMenu(chunkModeSelect);
        await selectEvent.select(chunkModeSelect, "One Line");
        expect(chunkModeSelect).toBeInTheDocument();
        fireEvent.change(chunkModeSelect, {
            target: {
                label: "One Line",
                value: "one_line",
            },
        });
        submitAgentChanges();
    });
    it("should change the must break at empty line", async () => {
        goToTextSplitTab();
        const mustBreakAtEmptyLineCheckbox = screen.getByTestId(
            `rag-must-break-at-empty-line-${agentId}`,
        ) as HTMLInputElement;
        expect(mustBreakAtEmptyLineCheckbox).toBeInTheDocument();
        fireEvent.click(mustBreakAtEmptyLineCheckbox);
        submitAgentChanges();
    });
});
