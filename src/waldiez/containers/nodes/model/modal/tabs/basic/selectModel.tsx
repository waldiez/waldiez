/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { GroupBase, Select, SingleValue } from "@waldiez/components";
import { predefinedModels } from "@waldiez/containers/nodes/model/utils";
import { WaldiezModelAPIType } from "@waldiez/models";
import { LOGOS } from "@waldiez/theme";

/**
 * Interface for model item
 */
interface IModelItem {
    label: string;
    value: string;
    apiType: WaldiezModelAPIType;
}

/**
 * Interface for ModelSelector props
 */
interface IModelSelectorProps {
    ref: React.Ref<any>;
    onChange: (value?: { label: string; apiType: WaldiezModelAPIType }) => void;
}

/**
 * Component for selecting predefined models from a dropdown
 */
export const ModelSelector = memo((props: IModelSelectorProps) => {
    const { ref, onChange } = props;

    // Memoize grouped options to prevent recreation on each render
    const groupedOptions = useMemo(
        () =>
            Object.entries(predefinedModels)
                .filter(([_, models]) => models.length > 0)
                .map(([apiType, models]) => ({
                    label: apiType as WaldiezModelAPIType,
                    options: models.map(model => ({
                        label: model.label,
                        value: model.value,
                        apiType: apiType as WaldiezModelAPIType,
                    })),
                })),
        [],
    );

    /**
     * Handle change in selected model
     */
    const handleChange = (
        newValue: SingleValue<{
            label: WaldiezModelAPIType;
            options: IModelItem[];
        }>,
    ) => {
        if (!newValue) {
            onChange(undefined);
            return;
        }

        // @ts-expect-error wrong type in react-select
        onChange({ label: newValue.value, apiType: newValue.apiType });
    };

    /**
     * Format group label with appropriate logo
     */
    const formatGroupLabel = (
        group: GroupBase<{
            label: WaldiezModelAPIType;
            options: IModelItem[];
        }>,
    ) => {
        const logo = LOGOS[group.label as WaldiezModelAPIType];

        return (
            <div className={`model-logo ${group.label} flex items-center`}>
                <img
                    src={logo}
                    alt={`${group.label} logo`}
                    style={{
                        width: 20,
                        height: 20,
                        marginRight: 10,
                        backgroundColor: "transparent",
                    }}
                />
                <strong>{group.label}</strong>
            </div>
        );
    };

    return (
        <div className="margin-bottom-5">
            <label htmlFor="predefined-models-select">Predefined models:</label>
            <div className="margin-top-10" />
            <Select
                ref={ref}
                inputId="predefined-models-select"
                options={groupedOptions}
                onChange={handleChange}
                placeholder="Select a model..."
                formatGroupLabel={formatGroupLabel}
                isSearchable
                isClearable
                aria-label="Predefined models"
                className="full-width"
            />
        </div>
    );
});

ModelSelector.displayName = "ModelSelector";
