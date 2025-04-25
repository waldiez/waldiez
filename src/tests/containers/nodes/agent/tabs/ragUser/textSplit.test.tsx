/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

const goToTextSplitTab = () => {
    renderAgent("rag_user", {
        openModal: true,
    });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}`);
    fireEvent.click(ragUserTab);
    const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-textSplit`);
    fireEvent.click(textSplitTab);
};

describe("Rag User tab Text Split", () => {
    it("should render the Rag User tab Text Split", () => {
        goToTextSplitTab();
        const textSplitTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-textSplit`);
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

/*
   return (
        <>
            <div className="flex-column">
                <InfoLabel
                    label="Chunk Token Size:"
                    info={
                        'The chunk token size for the retrieve chat. ' +
                        'If not provided, a default size `max_tokens * 0.4` will be used.'
                    }
                />
                <input
                    type="number"
                    value={retrieveConfig.chunkTokenSize ?? ''}
                    onChange={onChunkTokenSizeChange}
                    data-testid={`rag-chunk-token-size-${id}`}
                />
            </div>
            <div className="flex-column">
                <InfoLabel
                    label="Context Max Tokens:"
                    info={
                        'The context max token size for the retrieve chat. ' +
                        'If not provided, a default size `max_tokens * 0.8` will be used.'
                    }
                />
                <input
                    type="number"
                    value={retrieveConfig.contextMaxTokens ?? ''}
                    onChange={onContextMaxTokensChange}
                    data-testid={`rag-context-max-tokens-${id}`}
                />
            </div>
            <div className="flex-column">
                <InfoLabel
                    label="Chunk Mode:"
                    info={
                        'The chunk mode for the retrieve chat. ' +
                        'Possible values are "multi_lines" and "one_line". ' +
                        'If not provided, a default mode `multi_lines` will be used.'
                    }
                />
                <label className="hidden" htmlFor={`rag-chunk-mode-${id}`}>
                    Chunk Mode
                </label>
                <Select
                    options={chunkModeOptions}
                    value={{
                        label: chunkModeValuesMap[
                            retrieveConfig.chunkMode ?? 'multi_lines'
                        ],
                        value: retrieveConfig.chunkMode ?? 'multi_lines'
                    }}
                    onChange={onChunkModeChange}
                    inputId={`rag-chunk-mode-${id}`}
                />
            </div>
            {retrieveConfig.chunkMode === 'multi_lines' && (
                <div className="flex-column">
                    <InfoCheckbox
                        label="Must Break at Empty Line "
                        info={
                            'Chunk will only break at empty line if True. Default is True. ' +
                            'If chunk_mode is "one_line", this parameter will be ignored.'
                        }
                        checked={retrieveConfig.mustBreakAtEmptyLine}
                        onChange={onMustBreakAtEmptyLineChange}
                        dataTestId={`rag-must-break-at-empty-line-${id}`}
                    />
                </div>
            )}
        </>
    );
};
const chunkModeOptions: { label: string; value: 'multi_lines' | 'one_line' }[] =
    [
        { label: 'Multi Lines', value: 'multi_lines' },
        { label: 'One Line', value: 'one_line' }
    ];

const chunkModeValuesMap = {
    multi_lines: 'Multi Lines',
    one_line: 'One Line'
};

*/
