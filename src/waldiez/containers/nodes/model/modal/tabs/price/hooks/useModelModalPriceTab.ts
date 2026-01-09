/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ChangeEvent, useCallback } from "react";

import type { WaldiezNodeModelModalPriceTabProps } from "@waldiez/containers/nodes/model/modal/tabs/types";

/**
 * Custom hook for managing price tab functionality in the model modal
 */
export const useModelModalPriceTab = (props: WaldiezNodeModelModalPriceTabProps) => {
    const { data, onDataChange } = props;

    /**
     * Handle prompt price change
     */
    const onPricePromptChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const parsedValue = parseFloat(e.target.value);

            // Skip if value is not a number
            if (isNaN(parsedValue)) {
                return;
            }

            // Keep existing completion price value
            const completionTokenPricePer1k = data.price?.completionTokenPricePer1k ?? null;

            // Update based on parsed value
            onDataChange({
                price: {
                    completionTokenPricePer1k,
                    promptPricePer1k: parsedValue >= 0 ? parsedValue : null,
                },
            });
        },
        [data.price?.completionTokenPricePer1k, onDataChange],
    );

    /**
     * Handle completion price change
     */
    const onPriceCompletionChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const parsedValue = parseFloat(e.target.value);

            // Skip if value is not a number
            if (isNaN(parsedValue)) {
                return;
            }

            // Keep existing prompt price value
            const promptPricePer1k = data.price?.promptPricePer1k ?? null;

            // Update based on parsed value
            onDataChange({
                price: {
                    completionTokenPricePer1k: parsedValue >= 0 ? parsedValue : null,
                    promptPricePer1k,
                },
            });
        },
        [data.price?.promptPricePer1k, onDataChange],
    );

    return {
        onPricePromptChange,
        onPriceCompletionChange,
    };
};
