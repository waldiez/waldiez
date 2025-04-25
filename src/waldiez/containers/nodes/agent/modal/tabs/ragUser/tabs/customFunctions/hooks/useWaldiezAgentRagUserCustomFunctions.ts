/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentRagUserData } from "@waldiez/models";

export const useWaldiezAgentRagUserCustomFunctions = (props: {
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentRagUserData) => void;
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
    const onUseCustomEmbeddingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRetrieveConfigConfigData({
            useCustomEmbedding: event.target.checked,
        });
    };
    const onEmbeddingFunctionChange = (value: string | undefined) => {
        setRetrieveConfigConfigData({
            embeddingFunction: value,
        });
    };
    const onUseCustomTokenCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRetrieveConfigConfigData({
            useCustomTokenCount: event.target.checked,
        });
    };
    const onCustomTokenCountFunctionChange = (value: string | undefined) => {
        if (value) {
            setRetrieveConfigConfigData({
                customTokenCountFunction: value,
            });
        }
    };
    const onUseCustomTextSplitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRetrieveConfigConfigData({
            useCustomTextSplit: event.target.checked,
        });
    };
    const onCustomTextSplitFunctionChange = (value: string | undefined) => {
        if (value) {
            setRetrieveConfigConfigData({
                customTextSplitFunction: value,
            });
        }
    };
    return {
        onUseCustomEmbeddingChange,
        onEmbeddingFunctionChange,
        onUseCustomTokenCountChange,
        onCustomTokenCountFunctionChange,
        onUseCustomTextSplitChange,
        onCustomTextSplitFunctionChange,
    };
};
