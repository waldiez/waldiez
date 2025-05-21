/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Dict, NumberInput, StringList, TextInput } from "@waldiez/components";
import { useModelModalAdvancedTab } from "@waldiez/containers/nodes/model/modal/tabs/advanced/hooks";
import { WaldiezNodeModelModalAdvancedTabProps } from "@waldiez/containers/nodes/model/modal/tabs/advanced/types";

export const WaldiezNodeModelModalAdvancedTab = (props: WaldiezNodeModelModalAdvancedTabProps) => {
    const { data } = props;
    const { temperature, topP, maxTokens, defaultHeaders, tags, apiType } = data;
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
        onAwsAccessKeyChange,
        onAwsSecretKeyChange,
        onAwsRegionChange,
        onAwsProfileNameChange,
        onAwsSessionTokenChange,
    } = useModelModalAdvancedTab(props);
    return (
        <div className="flex-column">
            <NumberInput
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
            {apiType === "bedrock" && (
                <>
                    <TextInput
                        value={data.aws?.accessKey}
                        label="AWS Access Key:"
                        onChange={onAwsAccessKeyChange}
                    />
                    <TextInput
                        value={data.aws?.secretKey}
                        label="AWS Secret Key:"
                        onChange={onAwsSecretKeyChange}
                    />
                    <TextInput value={data.aws?.region} label={"AWS Region:"} onChange={onAwsRegionChange} />
                    <TextInput
                        value={data.aws?.profileName}
                        label={"AWS Profile Name:"}
                        onChange={onAwsProfileNameChange}
                    />
                    <TextInput
                        value={data.aws?.sessionToken}
                        label={"AWS Session Token:"}
                        onChange={onAwsSessionTokenChange}
                    />
                </>
            )}
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
                onItemAdded={onAddTag}
                onItemChange={onUpdateTag}
                onItemDeleted={onDeleteTag}
            />
        </div>
    );
};
