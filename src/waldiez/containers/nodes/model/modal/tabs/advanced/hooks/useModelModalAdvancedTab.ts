/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback } from "react";

import type { WaldiezNodeModelModalAdvancedTabProps } from "@waldiez/containers/nodes/model/modal/tabs/types";

/**
 * Custom hook for handling model modal advanced tab functionality
 */
export const useModelModalAdvancedTab = (props: WaldiezNodeModelModalAdvancedTabProps) => {
    const { data, onDataChange } = props;

    /**
     * Handle temperature parameter changes
     */
    const onTemperatureChange = useCallback(
        (value: number | null) => {
            let temperature: number | null = null;
            if ((value as number) >= 0) {
                temperature = value as number;
            }
            onDataChange({ temperature });
        },
        [onDataChange],
    );

    /**
     * Handle topP parameter changes
     */
    const onTopPChange = useCallback(
        (value: number | null) => {
            let topP: number | null = null;
            if ((value as number) >= 0) {
                topP = value as number;
            }
            onDataChange({ topP });
        },
        [onDataChange],
    );

    /**
     * Handle maxTokens parameter changes
     */
    const onMaxTokensChange = useCallback(
        (value: number | null) => {
            let maxTokens: number | null = null;
            if ((value as number) >= 0) {
                maxTokens = value as number;
            }
            onDataChange({ maxTokens });
        },
        [onDataChange],
    );
    /**
     * Update all headers at once
     */
    const onUpdateHeaders = useCallback(
        (items: { [key: string]: unknown }) => {
            onDataChange({ defaultHeaders: items });
        },
        [onDataChange],
    );

    /**
     * Delete a specific header by key
     */
    const onDeleteHeader = useCallback(
        (headerKey: string) => {
            const headers = { ...data.defaultHeaders };
            delete headers[headerKey];
            onDataChange({ defaultHeaders: headers });
        },
        [data.defaultHeaders, onDataChange],
    );

    /**
     * Add a new header with key and value
     */
    const onAddHeader = useCallback(
        (headerKey: string, headerValue: string) => {
            const headers = { ...data.defaultHeaders };
            headers[headerKey] = headerValue;
            onDataChange({ defaultHeaders: headers });
        },
        [data.defaultHeaders, onDataChange],
    );

    /**
     * Add a new tag if it doesn't already exist
     */
    const onAddTag = useCallback(
        (tag: string) => {
            const { tags } = data;
            if (!tags.includes(tag)) {
                const newTags = [...tags, tag];
                onDataChange({ tags: newTags });
            }
        },
        [data, onDataChange],
    );

    /**
     * Update an existing tag
     */
    const onUpdateTag = useCallback(
        (oldTag: string, newTag: string) => {
            const { tags } = data;
            const index = tags.indexOf(oldTag);
            if (index >= 0) {
                const updatedTags = [...tags];
                updatedTags[index] = newTag;
                onDataChange({ tags: updatedTags });
            }
        },
        [data, onDataChange],
    );

    /**
     * Delete a tag by value
     */
    const onDeleteTag = useCallback(
        (tag: string) => {
            const currentTags = [...data.tags];
            const index = currentTags.indexOf(tag);
            if (index >= 0) {
                currentTags.splice(index, 1);
                onDataChange({ tags: currentTags });
            }
        },
        [data.tags, onDataChange],
    );

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
