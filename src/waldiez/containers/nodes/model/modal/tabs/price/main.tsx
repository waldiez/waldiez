/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { InfoLabel } from "@waldiez/components";
import { useModelModalPriceTab } from "@waldiez/containers/nodes/model/modal/tabs/price/hooks";
import { WaldiezNodeModelModalPriceTabProps } from "@waldiez/containers/nodes/model/modal/tabs/price/types";

export const WaldiezNodeModelModalPriceTab = (props: WaldiezNodeModelModalPriceTabProps) => {
    const { modelId, data } = props;
    const { onPricePromptChange, onPriceCompletionChange } = useModelModalPriceTab(props);
    return (
        <div className="flex-column">
            <div className="model-price">
                <InfoLabel
                    label={"Price:"}
                    info={"Price in USD ($). Use 0 if it's free, -1 to skip setting a value"}
                />
                <div className="flex-column margin-left-10 margin-bottom-10 padding-left-10">
                    <div className="flex-column">
                        <label>Prompt price per 1K tokens:</label>
                        <input
                            title="Prompt price per 1K tokens"
                            type="number"
                            min="-1"
                            className="number-max-width"
                            value={data.price?.promptPricePer1k !== null ? data.price?.promptPricePer1k : -1}
                            onChange={onPricePromptChange}
                            data-testid={`model-modal-price-prompt-${modelId}`}
                        />
                    </div>
                    <div className="flex-column">
                        <label>Completion price per 1K tokens:</label>
                        <input
                            title="Completion price per 1K tokens"
                            type="number"
                            min="-1"
                            className="number-max-width"
                            value={
                                data.price?.completionTokenPricePer1k !== null
                                    ? data.price?.completionTokenPricePer1k
                                    : -1
                            }
                            onChange={onPriceCompletionChange}
                            data-testid={`model-modal-price-completion-${modelId}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
