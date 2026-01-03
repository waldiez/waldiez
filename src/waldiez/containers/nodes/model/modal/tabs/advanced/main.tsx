/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC, memo } from "react";

import { Dict, NumberInput, StringList } from "@waldiez/components";
import { useModelModalAdvancedTab } from "@waldiez/containers/nodes/model/modal/tabs/advanced/hooks";
import { type WaldiezNodeModelModalAdvancedTabProps } from "@waldiez/containers/nodes/model/modal/tabs/advanced/types";

export const WaldiezNodeModelModalAdvancedTab: FC<WaldiezNodeModelModalAdvancedTabProps> = memo(
    (props: WaldiezNodeModelModalAdvancedTabProps) => {
        const { data } = props;
        const { temperature, topP, maxTokens, defaultHeaders, tags } = data;
        const {
            onTemperatureChange,
            onTopPChange,
            onMaxTokensChange,
            onUpdateHeaders,
            onDeleteHeader,
            onAddHeader,
            onAddTag,
            onUpdateTag,
            onDeleteTag,
        } = useModelModalAdvancedTab(props);
        return (
            <div className="flex flex-col">
                <NumberInput
                    name="temperature"
                    label={"Temperature:"}
                    value={temperature !== null ? temperature : -0.001}
                    onChange={onTemperatureChange}
                    min={-0.001}
                    max={1}
                    step={0.001}
                    setNullOnLower={true}
                    onLowerLabel="Unset"
                    dataTestId="model-modal-temperature"
                />
                <NumberInput
                    name="top-p"
                    label={"Top P:"}
                    labelInfo={
                        "Top P value for sampling (it is recommended to use either temperature or top P, not both)"
                    }
                    value={topP !== null ? topP : -0.001}
                    onChange={onTopPChange}
                    min={-0.001}
                    max={1}
                    step={0.001}
                    setNullOnLower={true}
                    onLowerLabel="Unset"
                    dataTestId="model-modal-top-p"
                />
                <NumberInput
                    name="max-tokens"
                    label="Max Tokens:"
                    value={maxTokens !== null ? maxTokens : 0}
                    onChange={onMaxTokensChange}
                    min={0}
                    max={50000}
                    step={1}
                    forceInt
                    setNullOnLower
                    onLowerLabel="No limit"
                    dataTestId="model-modal-max-tokens"
                />
                <Dict
                    viewLabel="Default Headers:"
                    viewLabelInfo="Optional headers to be included in every request"
                    items={defaultHeaders}
                    itemsType="model-header"
                    onUpdate={onUpdateHeaders}
                    onDelete={onDeleteHeader}
                    onAdd={onAddHeader}
                />
                <StringList
                    viewLabel="Tags:"
                    items={tags}
                    itemsType="tag"
                    placeholder="Tag"
                    onItemAdded={onAddTag}
                    onItemChange={onUpdateTag}
                    onItemDeleted={onDeleteTag}
                />
            </div>
        );
    },
);
