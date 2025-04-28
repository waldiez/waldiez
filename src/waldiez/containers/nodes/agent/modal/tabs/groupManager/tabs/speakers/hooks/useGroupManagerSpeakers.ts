/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { MultiValue, SingleValue } from "@waldiez/components";
import {
    GroupChatSpeakerSelectionMethodOption,
    GroupChatSpeakerTransitionsType,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentGroupManagerData,
} from "@waldiez/models";

export const useGroupManagerSpeakers = (props: {
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
        };
    };
    data: WaldiezNodeAgentGroupManagerData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { data, agentConnections, onDataChange } = props;
    const [transitionSource, setTransitionSource] = useState<string | null>(null);
    const [transitionTargets, setTransitionTargets] = useState<string[]>([]);
    const setSpeakersData = (partialData: Partial<WaldiezNodeAgentGroupManagerData["speakers"]>) => {
        onDataChange({
            ...data,
            speakers: { ...data.speakers, ...partialData },
        });
    };
    const onAllowRepeatChange = (options: MultiValue<{ label: string; value: string }>) => {
        if (options) {
            setSpeakersData({
                allowRepeat: options.map(option => option.value),
            });
        }
    };
    const onSpeakerRepetitionModeChange = (option: { label: string; value: boolean | string } | null) => {
        if (option) {
            if (option.value === "disabled") {
                setSpeakersData({
                    selectionMode: "transition",
                });
            } else {
                const currentValue = data.speakers?.allowRepeat ?? true;
                if (typeof option.value === "string") {
                    const newValue = typeof currentValue === "boolean" ? [] : currentValue;
                    setSpeakersData({
                        selectionMode: "repeat",
                        allowRepeat: newValue,
                    });
                } else {
                    setSpeakersData({
                        selectionMode: "repeat",
                        allowRepeat: option.value,
                    });
                }
            }
        }
    };
    const onAddTransition = () => {
        if (transitionSource && transitionTargets.length > 0) {
            setSpeakersData({
                allowedOrDisallowedTransitions: {
                    ...data.speakers?.allowedOrDisallowedTransitions,
                    [transitionSource]: transitionTargets,
                },
            });
            setTransitionSource(null);
            setTransitionTargets([]);
        }
    };
    const onRemoveTransition = (source: string) => {
        setSpeakersData({
            allowedOrDisallowedTransitions: Object.fromEntries(
                Object.entries(data.speakers?.allowedOrDisallowedTransitions ?? {}).filter(
                    ([key]) => key !== source,
                ),
            ),
        });
    };
    const allConnectedNodes = [...agentConnections.source.nodes, ...agentConnections.target.nodes];
    const selectAgentOptions = allConnectedNodes.map(node => ({
        label: node.data.label as string,
        value: node.id,
    }));
    const onTransitionsTargetsChange = (options: MultiValue<{ label: string; value: string }>) => {
        setTransitionTargets(options.map(option => option.value));
    };
    const onTransitionsSourceChange = (option: { label: string; value: string } | null) => {
        if (option) {
            setTransitionSource(option.value);
        }
    };
    const onTransitionsTypeChange = (
        option: SingleValue<{
            label: string;
            value: GroupChatSpeakerTransitionsType;
        }>,
    ) => {
        if (option) {
            setSpeakersData({ transitionsType: option.value });
        }
    };
    const onSelectionCustomMethodChange = (value?: string) => {
        setSpeakersData({
            selectionCustomMethod: value ?? "",
        });
    };
    const onSelectionMethodChange = (
        option: {
            label: string;
            value: GroupChatSpeakerSelectionMethodOption;
        } | null,
    ) => {
        if (option) {
            setSpeakersData({ selectionMethod: option.value });
        }
    };
    const getAgentName = (id: string) => {
        return allConnectedNodes.find(node => node.id === id)?.data.label as string;
    };
    const getSpeakerRepetitionModeValue = () => {
        if (data.speakers?.selectionMode === "transition") {
            return {
                label: "Use transition rules",
                value: "disabled",
            };
        }
        if (data.speakers?.allowRepeat === false) {
            return {
                label: "Not allowed",
                value: false,
            };
        }
        if (data.speakers?.allowRepeat === true) {
            return {
                label: "Allowed",
                value: true,
            };
        }
        return {
            label: "Specific agents",
            value: "custom",
        };
    };
    return {
        selectAgentOptions,
        transitionSource,
        transitionTargets,
        allConnectedNodes,
        getAgentName,
        getSpeakerRepetitionModeValue,
        onAllowRepeatChange,
        onSpeakerRepetitionModeChange,
        onAddTransition,
        onRemoveTransition,
        onTransitionsTargetsChange,
        onTransitionsSourceChange,
        onTransitionsTypeChange,
        onSelectionCustomMethodChange,
        onSelectionMethodChange,
    };
};
