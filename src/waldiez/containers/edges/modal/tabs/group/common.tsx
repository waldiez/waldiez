/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TextInput } from "@waldiez/components";
import { WaldiezEdgeData } from "@waldiez/models";

type WaldiezEdgeGroupCommonTabProps = {
    data: WaldiezEdgeData;
    edgeId: string;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};

export const WaldiezEdgeGroupCommonTab: React.FC<WaldiezEdgeGroupCommonTabProps> = props => {
    const { data, edgeId, onDataChange } = props;
    const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = event.target.value;
        onDataChange({ label: newLabel });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDescription = event.target.value;
        onDataChange({ description: newDescription });
    };
    return (
        <div className="flex-column">
            <TextInput
                label="Label:"
                placeholder="Enter a label"
                value={data.label}
                onChange={onLabelChange}
                dataTestId={`edge-${edgeId}-label-input`}
            />
            <label>Description:</label>
            <textarea
                rows={2}
                defaultValue={data.description}
                placeholder="Enter a description"
                onChange={onDescriptionChange}
                data-testid={`edge-${edgeId}-description-input`}
            />
        </div>
    );
};
