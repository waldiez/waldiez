/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezAgentHumanInputMode, WaldiezNodeAgentData } from "@waldiez/models";

export const useWaldiezAgentBasic = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    onAgentTypeChange: (agentType: "rag_user" | "user") => void;
}) => {
    const { data, onDataChange, onAgentTypeChange } = props;
    const [localData, setLocalData] = useState<WaldiezNodeAgentData>(data);
    const onRagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAgentType = event.target.checked ? "rag_user" : "user";
        onAgentTypeChange(newAgentType);
    };
    const onMultimodalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({ ...localData, isMultimodal: event.target.checked });
        onDataChange({ isMultimodal: event.target.checked });
    };
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({ ...localData, label: event.target.value });
        onDataChange({ label: event.target.value });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalData({ ...localData, description: event.target.value });
        onDataChange({ description: event.target.value });
    };
    const onSystemMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalData({ ...localData, systemMessage: event.target.value });
        onDataChange({ systemMessage: event.target.value });
    };
    const onHumanInputModeChange = (
        option: SingleValue<{
            label: string;
            value: WaldiezAgentHumanInputMode;
        }>,
    ) => {
        if (option) {
            setLocalData({ ...localData, humanInputMode: option.value });
            onDataChange({ humanInputMode: option.value });
        }
    };
    const onMaxConsecutiveAutoReplyChange = (value: number | null) => {
        setLocalData({ ...localData, maxConsecutiveAutoReply: value });
        onDataChange({ maxConsecutiveAutoReply: value });
    };
    const onAgentDefaultAutoReplyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({
            ...localData,
            agentDefaultAutoReply: event.target.value,
        });
        onDataChange({ agentDefaultAutoReply: event.target.value });
    };
    return {
        data: localData,
        onRagChange,
        onMultimodalChange,
        onNameChange,
        onDescriptionChange,
        onSystemMessageChange,
        onHumanInputModeChange,
        onMaxConsecutiveAutoReplyChange,
        onAgentDefaultAutoReplyChange,
    };
};
