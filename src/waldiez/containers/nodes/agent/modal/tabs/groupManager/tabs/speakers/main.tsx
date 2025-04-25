/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Editor, InfoLabel, Select } from "@waldiez/components";
import { useGroupManagerSpeakers } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/tabs/speakers/hooks";
import { GroupManagerSpeakersTransition } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/tabs/speakers/speakersTransition";
import {
    GroupChatSpeakerSelectionMethodOption,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentGroupManagerData,
} from "@waldiez/types";

export const GroupManagerSpeakers = (props: {
    id: string;
    data: WaldiezNodeAgentGroupManagerData;
    isDarkMode: boolean;
    defaultSpeakerSelectionMethodContent: string;
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
        };
    };
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { id, data, isDarkMode, defaultSpeakerSelectionMethodContent } = props;
    const {
        allConnectedNodes,
        selectAgentOptions,
        transitionSource,
        transitionTargets,
        getAgentName,
        onAllowRepeatChange,
        onSpeakerRepetitionModeChange,
        onAddTransition,
        onRemoveTransition,
        onTransitionsTargetsChange,
        onTransitionsSourceChange,
        onTransitionsTypeChange,
        onSelectionCustomMethodChange,
        onSelectionMethodChange,
        getSpeakerRepetitionModeValue,
    } = useGroupManagerSpeakers(props);
    const speakerRepetitionModelValue = getSpeakerRepetitionModeValue();
    return (
        <div className="flex-column" data-testid={`manager-speakers-tab-${id}`}>
            <label
                className="speaker-repetition-mode-label"
                htmlFor={`manager-speaker-repetition-mode-${id}`}
            >
                Speaker repetition mode:
            </label>
            <Select
                options={speakerRepetitionOptions}
                value={speakerRepetitionModelValue}
                onChange={onSpeakerRepetitionModeChange}
                inputId={`manager-speaker-repetition-mode-${id}`}
            />
            {data.speakers?.selectionMode === "repeat" && typeof data.speakers?.allowRepeat !== "boolean" && (
                <div className="padding-10">
                    <label htmlFor={`manager-allowed-speakers-${id}`}>Allowed Speakers:</label>
                    <div className="margin-bottom-10" />
                    <Select
                        name="Allowed Speakers"
                        isMulti
                        value={((data.speakers?.allowRepeat ?? []) as string[]).map(agent => ({
                            label: getAgentName(agent),
                            value: agent,
                        }))}
                        options={selectAgentOptions}
                        onChange={onAllowRepeatChange}
                        inputId={`manager-allowed-speakers-${id}`}
                    />
                </div>
            )}
            {data.speakers?.selectionMode === "transition" && (
                <GroupManagerSpeakersTransition
                    id={id}
                    data={data}
                    transitionSource={transitionSource}
                    transitionTargets={transitionTargets}
                    allConnectedNodes={allConnectedNodes}
                    selectAgentOptions={selectAgentOptions}
                    getAgentName={getAgentName}
                    onAddTransition={onAddTransition}
                    onRemoveTransition={onRemoveTransition}
                    onTransitionsTypeChange={onTransitionsTypeChange}
                    onTransitionsSourceChange={onTransitionsSourceChange}
                    onTransitionsTargetsChange={onTransitionsTargetsChange}
                />
            )}
            <InfoLabel label="Speaker Selection Method:" info={getInfoLabelView} />
            <label className="hidden" htmlFor={`manager-speaker-selection-method-${id}`}>
                Speaker Selection Method:
            </label>
            <Select
                options={speakerSelectionOptions}
                value={{
                    label:
                        speakerSelectionOptions.find(
                            option => option.value === data.speakers?.selectionMethod,
                        )?.label ?? "Auto",
                    value: data.speakers?.selectionMethod ?? "auto",
                }}
                onChange={onSelectionMethodChange}
                inputId={`manager-speaker-selection-method-${id}`}
            />
            {data.speakers?.selectionMethod === "custom" && (
                <div className="margin-top-10">
                    <Editor
                        value={defaultSpeakerSelectionMethodContent}
                        darkMode={isDarkMode}
                        onChange={onSelectionCustomMethodChange}
                    />
                </div>
            )}
        </div>
    );
};

const speakerRepetitionOptions = [
    { label: "Allowed", value: true },
    { label: "Not allowed", value: false },
    { label: "Specific agents", value: "custom" },
    {
        label: "Use transition rules",
        value: "disabled",
    },
];

const speakerSelectionOptions: {
    label: string;
    value: GroupChatSpeakerSelectionMethodOption;
}[] = [
    { label: "Auto", value: "auto" },
    { label: "Manual", value: "manual" },
    { label: "Random", value: "random" },
    { label: "Round Robin", value: "round_robin" },
    { label: "Custom method", value: "custom" },
];
export const DEFAULT_CUSTOM_SPEAKER_SELECTION_CONTENT = `"""Custom speaker selection function."""
# provide the function to select the next speaker in the group chat
# complete the \`custom_speaker_selection\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the next speaker.
# example:
# def custom_speaker_selection(last_speaker, groupchat):
#    # type: (Agent, GroupChat) -> Agent | str | None
#    return groupchat.agents[0]
#
def custom_speaker_selection(last_speaker, groupchat):
    """Complete the custom speaker selection function"""
    ...
`;
const getInfoLabelView = () => (
    <InfoLabel
        label="Speaker Selection Method:"
        info={() => (
            <>
                The method for selecting the next speaker. Default is "auto". Could be any of the following:
                <ul>
                    <li>
                        <strong>"Auto"</strong>: the next speaker is selected automatically by LLM.
                    </li>
                    <li>
                        <strong>"Manual"</strong>: the next speaker is selected manually by user input.
                    </li>
                    <li>
                        <strong>"Random"</strong>: the next speaker is selected randomly.
                    </li>
                    <li>
                        <strong>"Round Robin"</strong>: the next speaker is selected in a round robin fashion,
                        i.e., iterating in the same order as provided in agents.
                    </li>
                    <li>
                        <strong>"Custom Method"</strong>: A customized speaker selection function (Callable):
                        the function will be called to select the next speaker. The function should take the
                        last speaker and the group chat as input and return one of the following:
                        <ul>
                            <li>an Agent class, it must be one of the agents in the group chat.</li>
                            <li>
                                a string from ['auto', 'manual', 'random', 'round_robin'] to select a default
                                method to use.
                            </li>
                            <li>None, which would terminate the conversation gracefully.</li>
                        </ul>
                    </li>
                </ul>
            </>
        )}
    />
);
