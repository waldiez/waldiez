/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback } from "react";

import { WaldiezNodeToolModalProps } from "@waldiez/containers/nodes/tool/modal/types";
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_NAME,
    PREDEFINED_TOOL_TYPES,
} from "@waldiez/containers/nodes/tool/utils";
import { DEFAULT_TOOL_CONTENT_MAP, WaldiezToolType } from "@waldiez/models";

/**
 * Custom hook for managing tool node modal state and interactions
 */
export const useToolNodeModal = (props: WaldiezNodeToolModalProps) => {
    const { data, onDataChange } = props;

    /**
     * Update all secrets at once
     */
    const onUpdateSecrets = useCallback(
        (secrets: { [key: string]: unknown }) => {
            onDataChange({ secrets });
        },
        [onDataChange],
    );

    /**
     * Delete a specific secret by key
     */
    const onDeleteSecret = useCallback(
        (key: string) => {
            const { [key]: _deletedSecret, ...remainingSecrets } = data.secrets;
            onDataChange({ secrets: remainingSecrets });
        },
        [data.secrets, onDataChange],
    );

    /**
     * Add a new secret or update an existing one
     */
    const onAddSecret = useCallback(
        (key: string, value: string) => {
            onDataChange({
                secrets: {
                    ...data.secrets,
                    [key]: value,
                },
            });
        },
        [data.secrets, onDataChange],
    );

    /**
     * Change tool type and update content to default for that type
     */
    const onToolTypeChange = useCallback(
        (toolType: WaldiezToolType) => {
            const newContent = DEFAULT_TOOL_CONTENT_MAP[toolType];
            onDataChange({ toolType, content: newContent, kwargs: {}, secrets: {} });
        },
        [onDataChange],
    );

    /**
     * Update tool content (code)
     */
    const onToolContentChange = useCallback(
        (value: string | undefined) => {
            if (!value) {
                return;
            }
            onDataChange({ content: value });
        },
        [onDataChange],
    );

    /**
     * Update tool label
     */
    const onToolLabelChange = useCallback(
        (item: React.ChangeEvent<HTMLInputElement> | string) => {
            if (typeof item === "string") {
                onDataChange({ label: item });
                return;
            }
            const e = item as React.ChangeEvent<HTMLInputElement>;
            onDataChange({ label: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Update tool description
     */
    const onToolDescriptionChange = useCallback(
        (item: React.ChangeEvent<HTMLTextAreaElement> | string) => {
            if (typeof item === "string") {
                onDataChange({ description: item });
                return;
            }
            const e = item as React.ChangeEvent<HTMLTextAreaElement>;
            onDataChange({ description: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Change tool type and update content to default for that type
     */
    const onToolTypeSelectionChange = useCallback(
        (option: { value: string; label: string }) => {
            if (PREDEFINED_TOOL_TYPES.includes(option.value)) {
                onDataChange({
                    toolType: option.value as WaldiezToolType,
                    content: DEFAULT_TOOL_CONTENT_MAP[option.value as WaldiezToolType] || "",
                    kwargs: {},
                    secrets: {},
                    label: option.value,
                    description: DEFAULT_DESCRIPTION[option.value] || option.label,
                });
            } else {
                onDataChange({
                    toolType: option.value as WaldiezToolType,
                    content: "",
                    kwargs: {},
                    secrets: {},
                    label: DEFAULT_NAME[option.value] || "",
                    description: DEFAULT_DESCRIPTION[option.value] || option.label,
                });
            }
        },
        [onDataChange],
    );

    /**
     * Add a tag to the tool
     */
    const onAddTag = useCallback(
        (tag: string) => {
            onDataChange({
                tags: [...data.tags, tag],
            });
        },
        [data.tags, onDataChange],
    );

    /**
     * Remove a tag from the tool
     */
    const onDeleteTag = useCallback(
        (tag: string) => {
            onDataChange({
                tags: data.tags.filter(t => t !== tag),
            });
        },
        [data.tags, onDataChange],
    );

    /**
     * Change an existing tag
     */
    const onTagChange = useCallback(
        (oldItem: string, newItem: string) => {
            onDataChange({
                tags: data.tags.map(t => (t === oldItem ? newItem : t)),
            });
        },
        [data.tags, onDataChange],
    );

    /**
     * Add a requirement to the tool
     */
    const onAddRequirement = useCallback(
        (requirement: string) => {
            onDataChange({
                requirements: [...data.requirements, requirement],
            });
        },
        [data.requirements, onDataChange],
    );

    /**
     * Remove a requirement from the tool
     */
    const onDeleteRequirement = useCallback(
        (requirement: string) => {
            onDataChange({
                requirements: data.requirements.filter(r => r !== requirement),
            });
        },
        [data.requirements, onDataChange],
    );

    /**
     * Change an existing requirement
     */
    const onRequirementChange = useCallback(
        (oldRequirement: string, newRequirement: string) => {
            onDataChange({
                requirements: data.requirements.map(r => (r === oldRequirement ? newRequirement : r)),
            });
        },
        [data.requirements, onDataChange],
    );

    const onSetToolKwarg = useCallback(
        (key: string, value: string) => {
            const updatedKwargs = { ...data.kwargs, [key]: value };
            onDataChange({ kwargs: updatedKwargs });
        },
        [data.kwargs, onDataChange],
    );

    return {
        onUpdateSecrets,
        onDeleteSecret,
        onAddSecret,
        onToolContentChange,
        onToolLabelChange,
        onToolDescriptionChange,
        onToolTypeChange,
        onToolTypeSelectionChange,
        onAddTag,
        onDeleteTag,
        onTagChange,
        onAddRequirement,
        onDeleteRequirement,
        onRequirementChange,
        onSetToolKwarg,
    };
};
