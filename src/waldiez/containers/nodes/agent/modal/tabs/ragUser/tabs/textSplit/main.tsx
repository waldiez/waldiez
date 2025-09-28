/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { InfoCheckbox, InfoLabel, Select } from "@waldiez/components";
import { useWaldiezAgentRagUserTextSplit } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/textSplit/hooks";
import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

/**
 * Chunk mode options for the dropdown
 */
const chunkModeOptions = [
    { label: "Multi Lines", value: "multi_lines" as const },
    { label: "One Line", value: "one_line" as const },
];

/**
 * Mapping of chunk mode values to display labels
 */
const chunkModeValuesMap = {
    multi_lines: "Multi Lines",
    one_line: "One Line",
};

type WaldiezAgentRagUserTextSplitProps = {
    id: string;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
};

/**
 * Component for configuring text splitting settings for RAG
 * Handles token sizes, chunk modes, and splitting behavior
 */
export const WaldiezAgentRagUserTextSplit = memo((props: WaldiezAgentRagUserTextSplitProps) => {
    const { id, data } = props;
    const { retrieveConfig } = data;

    // Use the hook for handlers
    const {
        onChunkTokenSizeChange,
        onContextMaxTokensChange,
        onChunkModeChange,
        onMustBreakAtEmptyLineChange,
    } = useWaldiezAgentRagUserTextSplit(props);

    /**
     * Current chunk mode value for the dropdown
     */
    const chunkModeValue = useMemo(
        () => ({
            label: chunkModeValuesMap[retrieveConfig.chunkMode],
            value: retrieveConfig.chunkMode,
        }),
        [retrieveConfig.chunkMode],
    );

    /**
     * Determine if empty line break settings should be shown
     */
    const showEmptyLineBreak = retrieveConfig.chunkMode === "multi_lines";

    return (
        <div className="text-split-config" data-testid={`rag-text-split-config-${id}`}>
            {/* Chunk Token Size */}
            <div className="flex flex-col">
                <InfoLabel
                    label="Chunk Token Size:"
                    info={
                        "The chunk token size for the retrieve chat. " +
                        "If not provided, a default size `max_tokens * 0.4` will be used."
                    }
                    htmlFor={`rag-chunk-token-size-${id}`}
                />

                <input
                    title="Chunk token size"
                    type="number"
                    value={retrieveConfig.chunkTokenSize ?? ""}
                    onChange={onChunkTokenSizeChange}
                    data-testid={`rag-chunk-token-size-${id}`}
                    id={`rag-chunk-token-size-${id}`}
                    aria-label="Chunk token size"
                />
            </div>

            {/* Context Max Tokens */}
            <div className="flex flex-col">
                <InfoLabel
                    label="Context Max Tokens:"
                    info={
                        "The context max token size for the retrieve chat. " +
                        "If not provided, a default size `max_tokens * 0.8` will be used."
                    }
                    htmlFor={`rag-context-max-tokens-${id}`}
                />

                <input
                    title="Context max tokens"
                    type="number"
                    value={retrieveConfig.contextMaxTokens ?? ""}
                    onChange={onContextMaxTokensChange}
                    data-testid={`rag-context-max-tokens-${id}`}
                    id={`rag-context-max-tokens-${id}`}
                    aria-label="Context maximum tokens"
                />
            </div>

            {/* Chunk Mode */}
            <div className="flex flex-col">
                <InfoLabel
                    htmlFor={`rag-chunk-mode-${id}`}
                    label="Chunk Mode:"
                    info={
                        "The chunk mode for the retrieve chat. " +
                        'Possible values are "Multi Lines" and "One Line". ' +
                        'If not provided, a default mode "Multi Lines" will be used.'
                    }
                />

                <label className="hidden" htmlFor={`rag-select-chunk-mode-${id}`}>
                    Chunk Mode
                </label>

                <Select
                    options={chunkModeOptions}
                    value={chunkModeValue}
                    onChange={onChunkModeChange}
                    inputId={`rag-select-chunk-mode-${id}`}
                    aria-label="Select chunk mode"
                />
            </div>

            {/* Must Break at Empty Line (only for multi_lines mode) */}
            {showEmptyLineBreak && (
                <div className="flex flex-col">
                    <InfoCheckbox
                        label="Must Break at Empty Line "
                        info={
                            "Chunk will only break at empty line if True. Default is True. " +
                            'If chunk_mode is "one_line", this parameter will be ignored.'
                        }
                        id={`rag-must-break-at-empty-line-${id}`}
                        checked={retrieveConfig.mustBreakAtEmptyLine}
                        onChange={onMustBreakAtEmptyLineChange}
                        aria-label="Must break at empty line"
                    />
                </div>
            )}
        </div>
    );
});

WaldiezAgentRagUserTextSplit.displayName = "WaldiezAgentRagUserTextSplit";
