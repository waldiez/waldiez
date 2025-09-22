/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type FC, memo, useMemo } from "react";

import { InfoLabel } from "@waldiez/components";
import { useModelModalPriceTab } from "@waldiez/containers/nodes/model/modal/tabs/price/hooks";
import { type WaldiezNodeModelModalPriceTabProps } from "@waldiez/containers/nodes/model/modal/tabs/price/types";

/**
 * Component for managing model pricing in the model modal
 */
export const WaldiezNodeModelModalPriceTab: FC<WaldiezNodeModelModalPriceTabProps> = memo(
    (props: WaldiezNodeModelModalPriceTabProps) => {
        const { modelId, data } = props;
        const { onPricePromptChange, onPriceCompletionChange } = useModelModalPriceTab(props);

        // Calculate display values
        const promptPriceValue = useMemo(
            () => (data.price?.promptPricePer1k !== null ? data.price.promptPricePer1k : -1),
            [data.price?.promptPricePer1k],
        );

        const completionPriceValue = useMemo(
            () =>
                data.price?.completionTokenPricePer1k !== null ? data.price.completionTokenPricePer1k : -1,
            [data.price?.completionTokenPricePer1k],
        );

        // Set test IDs
        const promptTestId = `model-modal-price-prompt-${modelId}`;
        const completionTestId = `model-modal-price-completion-${modelId}`;

        // Set input IDs for accessibility
        const promptInputId = `price-prompt-${modelId}`;
        const completionInputId = `price-completion-${modelId}`;

        return (
            <div className="flex-column">
                <div className="model-price">
                    <InfoLabel
                        label="Price:"
                        info="Price in USD ($). Use 0 if it's free, -1 to skip setting a value"
                        htmlFor="prompt-price-inputs"
                    />

                    <div className="flex-column margin-left-10 margin-bottom-10 padding-left-10">
                        {/* Prompt Price Input */}
                        <div className="flex-column margin-bottom-10">
                            <label htmlFor={promptInputId}>Prompt price per 1K tokens:</label>
                            <input
                                id={promptInputId}
                                title="Prompt price per 1K tokens"
                                type="number"
                                min="-1"
                                step="0.0001"
                                className="number-max-width"
                                value={promptPriceValue}
                                onChange={onPricePromptChange}
                                data-testid={promptTestId}
                                aria-label="Prompt price per 1000 tokens"
                            />
                        </div>

                        {/* Completion Price Input */}
                        <div className="flex-column">
                            <label htmlFor={completionInputId}>Completion price per 1K tokens:</label>
                            <input
                                id={completionInputId}
                                title="Completion price per 1K tokens"
                                type="number"
                                min="-1"
                                step="0.0001"
                                className="number-max-width"
                                value={completionPriceValue}
                                onChange={onPriceCompletionChange}
                                data-testid={completionTestId}
                                aria-label="Completion price per 1000 tokens"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

WaldiezNodeModelModalPriceTab.displayName = "WaldiezNodeModelModalPriceTab";
