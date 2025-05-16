/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback } from "react";

import { TextInput, TextareaInput } from "@waldiez/components";
import { WaldiezEdgeData } from "@waldiez/models";

type WaldiezEdgeGroupTabProps = {
    data: WaldiezEdgeData;
    edgeId: string;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};

/**
 * Group edge tab component for editing group-specific edge properties
 */
export const WaldiezEdgeGroupTab = memo<WaldiezEdgeGroupTabProps>(props => {
    const { data, edgeId, onDataChange } = props;

    /**
     * Handle label change
     */
    const onLabelChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ label: event.target.value });
        },
        [onDataChange],
    );

    /**
     * Handle description change
     */
    const onDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({ description: event.target.value });
        },
        [onDataChange],
    );

    // Generate test IDs for consistent accessibility
    const labelInputId = `edge-${edgeId}-label-input`;
    const descriptionInputId = `edge-${edgeId}-description-input`;

    return (
        <div className="flex-column">
            <TextInput
                label="Label:"
                placeholder="Enter a label"
                value={data.label || ""}
                onChange={onLabelChange}
                dataTestId={labelInputId}
                aria-label="Edge label"
            />

            <div className="margin-top-10">
                <label htmlFor={descriptionInputId}>Description:</label>
                <TextareaInput
                    id={descriptionInputId}
                    rows={2}
                    value={data.description || ""}
                    placeholder="Enter a description"
                    onChange={onDescriptionChange}
                    data-testid={descriptionInputId}
                    className="margin-top-5 full-width"
                    aria-label="Edge description"
                />
            </div>
        </div>
    );
});

WaldiezEdgeGroupTab.displayName = "WaldiezEdgeGroupTab";
