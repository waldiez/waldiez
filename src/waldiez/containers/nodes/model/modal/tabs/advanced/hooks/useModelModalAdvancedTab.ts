/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModelModalAdvancedTabProps } from "@waldiez/containers/nodes/model/modal/tabs/types";

export const useModelModalAdvancedTab = (props: WaldiezNodeModelModalAdvancedTabProps) => {
    const { data, onDataChange } = props;
    const onTemperatureChange = (value: number | null) => {
        let temperature: number | null = null;
        if ((value as number) >= 0) {
            temperature = value as number;
        }
        onDataChange({ temperature });
    };
    const onTopPChange = (value: number | null) => {
        let topP: number | null = null;
        if ((value as number) >= 0) {
            topP = value as number;
        }
        onDataChange({ topP });
    };
    const onMaxTokensChange = (value: number | null) => {
        let maxTokens: number | null = null;
        if ((value as number) >= 0) {
            maxTokens = value as number;
        }
        onDataChange({ maxTokens });
    };
    const onUpdateHeaders = (items: { [key: string]: unknown }) => {
        onDataChange({ defaultHeaders: items });
    };
    const onDeleteHeader = (headerKey: string) => {
        const headers = { ...data.defaultHeaders };
        delete headers[headerKey];
        onDataChange({ defaultHeaders: headers });
    };
    const onAddHeader = (headerKey: string, headerValue: string) => {
        const headers = { ...data.defaultHeaders };
        headers[headerKey] = headerValue;
        onDataChange({ defaultHeaders: headers });
    };
    const onAddTag = (tag: string) => {
        const { tags } = data;
        if (!tags.includes(tag)) {
            const newTags = [...tags, tag];
            onDataChange({ tags: newTags });
        }
    };
    const onUpdateTag = (oldTag: string, newTag: string) => {
        const { tags } = data;
        const index = tags.indexOf(oldTag);
        if (index >= 0) {
            tags[index] = newTag;
            onDataChange({ tags });
        }
    };
    const onDeleteTag = (tag: string) => {
        const currentTags = data.tags;
        const index = currentTags.indexOf(tag);
        if (index >= 0) {
            currentTags.splice(index, 1);
            onDataChange({ tags: currentTags });
        }
    };
    return {
        onTemperatureChange,
        onTopPChange,
        onMaxTokensChange,
        onUpdateHeaders,
        onDeleteHeader,
        onAddHeader,
        onAddTag,
        onUpdateTag,
        onDeleteTag,
    };
};
