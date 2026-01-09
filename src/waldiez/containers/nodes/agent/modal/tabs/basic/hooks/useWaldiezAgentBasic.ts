/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ChangeEvent, useCallback } from "react";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezAgentHumanInputMode, WaldiezNodeAgentData } from "@waldiez/models/types";

/**
 * Custom hook for managing Waldiez Agent Basic settings
 * Handles data changes and propagates them to the parent component
 */
export const useWaldiezAgentBasic = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    onAgentTypeChange: (agentType: "rag_user_proxy" | "user_proxy") => void;
}) => {
    const { onDataChange, onAgentTypeChange } = props;
    /**
     * Handle RAG feature toggle change
     */
    const onRagChange = useCallback(
        (checked: boolean) => {
            const newAgentType = checked ? "rag_user_proxy" : "user_proxy";
            onAgentTypeChange(newAgentType);
        },
        [onAgentTypeChange],
    );

    /**
     * Handle multimodal feature toggle change
     */
    const onMultimodalChange = useCallback(
        (checked: boolean) => {
            onDataChange({ isMultimodal: checked });
        },
        [onDataChange],
    );

    /**
     * Handle agent name change
     */
    const onNameChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const label = event.target.value;
            onDataChange({ label });
        },
        [onDataChange],
    );

    /**
     * Handle agent description change
     */
    const onDescriptionChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            const description = event.target.value;
            onDataChange({ description });
        },
        [onDataChange],
    );

    /**
     * Handle system message change
     */
    const onSystemMessageChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            const systemMessage = event.target.value;
            onDataChange({ systemMessage });
        },
        [onDataChange],
    );

    /**
     * Handle human input mode change
     */
    const onHumanInputModeChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: WaldiezAgentHumanInputMode;
            }>,
        ) => {
            if (option) {
                const humanInputMode = option.value;
                onDataChange({ humanInputMode });
            }
        },
        [onDataChange],
    );

    /**
     * Handle max consecutive auto reply change
     */
    const onMaxConsecutiveAutoReplyChange = useCallback(
        (value: number | null) => {
            onDataChange({ maxConsecutiveAutoReply: value });
        },
        [onDataChange],
    );

    /**
     * Handle agent default auto reply change
     */
    const onAgentDefaultAutoReplyChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            const agentDefaultAutoReply = event.target.value;
            onDataChange({ agentDefaultAutoReply });
        },
        [onDataChange],
    );

    return {
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
