/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { InfoCheckbox, NumberInput, TextInput } from "@waldiez/components";
import { useGroupManagerConfig } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/tabs/config/hooks";
import { WaldiezNodeAgentData, WaldiezNodeAgentGroupManagerData } from "@waldiez/models";

export const GroupManagerConfig = (props: {
    data: WaldiezNodeAgentGroupManagerData;
    id: string;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { data, id, onDataChange } = props;
    const {
        onAdminNameChange,
        onMaxRoundChange,
        onEnableClearHistoryChange,
        onSendIntroductionsChange,
        onMaxRetriesForSelectingChange,
    } = useGroupManagerConfig({ data, onDataChange });
    return (
        <div className="flex-column">
            <TextInput
                label="Admin Name:"
                value={data.adminName ?? ""}
                labelInfo={
                    "The name of the admin agent if there is one. Default is 'Admin'. A 'KeyBoardInterrupt' will make the admin agent take over."
                }
                onChange={onAdminNameChange}
                dataTestId={`manager-admin-name-input-${id}`}
            />
            <div className="margin-bottom-10">
                <NumberInput
                    label="Max Rounds:"
                    value={data.maxRound ?? 0}
                    onChange={onMaxRoundChange}
                    min={0}
                    max={1000}
                    step={1}
                    onNull={0}
                    setNullOnLower={true}
                    onLowerLabel="Unset"
                    labelInfo={"The maximum number of conversation rounds in the group."}
                    dataTestId={`manager-max-rounds-input-${id}`}
                />
            </div>
            <InfoCheckbox
                label="Enable clear history"
                checked={data.enableClearHistory === true}
                info="Enable the possibility to clear history of messages for agents manually by providing 'clear history' phrase in user prompt."
                onChange={onEnableClearHistoryChange}
                dataTestId={`manager-enable-clear-history-checkbox-${id}`}
            />
            <InfoCheckbox
                label="Send introductions"
                checked={data.sendIntroductions === true}
                info="Send a round of introductions at the start of the group chat, so agents know who they can speak to (default: False)"
                onChange={onSendIntroductionsChange}
                dataTestId={`manager-send-introductions-checkbox-${id}`}
            />
            <div className="margin-bottom-10">
                <NumberInput
                    label="Max Retries for Selecting Speaker:"
                    value={data.speakers?.maxRetriesForSelecting ?? 0}
                    onChange={onMaxRetriesForSelectingChange}
                    min={0}
                    max={100}
                    step={1}
                    onNull={0}
                    setNullOnLower={true}
                    onLowerLabel="Unset"
                    labelInfo="The maximum number of times the speaker selection re-query process will run. If, during speaker selection, multiple agent names or no agent names are returned by the LLM as the next agent, it will be queried again up to the maximum number of times until a single agent is returned or it exhausts the maximum attempts. Applies only to 'auto' speaker selection method."
                    dataTestId={`manager-max-retries-for-selecting-input-${id}`}
                />
            </div>
        </div>
    );
};
