/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

export const useWaldiezAgentRagUserTextSplit = (props: {
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const { data, onDataChange } = props;
    const setRetrieveConfigConfigData = (
        partialData: Partial<WaldiezNodeAgentRagUserData["retrieveConfig"]>,
    ) => {
        onDataChange({
            ...data,
            retrieveConfig: {
                ...data.retrieveConfig,
                ...partialData,
            },
        });
    };
    const onChunkTokenSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = parseInt(event.target.value, 10);
            if (isNaN(value) || value < 1) {
                return;
            }
            setRetrieveConfigConfigData({ chunkTokenSize: value });
        } catch (_) {
            return;
        }
    };
    const onContextMaxTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = parseInt(event.target.value, 10);
            if (isNaN(value) || value < 1) {
                return;
            }
            setRetrieveConfigConfigData({ contextMaxTokens: value });
        } catch (_) {
            return;
        }
    };
    const onChunkModeChange = (
        option: SingleValue<{
            label: string;
            value: "multi_lines" | "one_line";
        }>,
    ) => {
        if (option) {
            setRetrieveConfigConfigData({ chunkMode: option.value });
        }
    };
    const onMustBreakAtEmptyLineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRetrieveConfigConfigData({
            mustBreakAtEmptyLine: event.target.checked,
        });
    };
    return {
        onChunkTokenSizeChange,
        onContextMaxTokensChange,
        onChunkModeChange,
        onMustBreakAtEmptyLineChange,
    };
};
