/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { GroupBase, Select, SingleValue } from "@waldiez/components";
import { predefinedModels } from "@waldiez/containers/nodes/model/utils/predefined";
import { WaldiezModelAPIType } from "@waldiez/models";
import { LOGOS } from "@waldiez/theme";

export const ModelSelector = (props: {
    ref: React.Ref<any>;
    onChange: (value?: { label: string; apiType: WaldiezModelAPIType }) => void;
}) => {
    const groupedOptions = Object.entries(predefinedModels)
        .filter(([_, models]) => models.length > 0)
        .map(([apiType, models]) => ({
            label: apiType as WaldiezModelAPIType,
            options: models.map(model => ({
                label: model.label,
                value: model.value,
                apiType: apiType as WaldiezModelAPIType,
            })),
        }));

    const handleChange = (
        newValue: SingleValue<{
            label: WaldiezModelAPIType;
            options: {
                label: string;
                value: string;
                apiType: WaldiezModelAPIType;
            }[];
        }>,
    ) => {
        if (!newValue) {
            props.onChange(undefined);
            return;
        }
        // @ts-expect-error wrong type in react-select
        props.onChange({ label: newValue.value, apiType: newValue.apiType });
    };

    const formatGroupLabel = (
        group: GroupBase<{ label: WaldiezModelAPIType; options: { label: string; value: string }[] }>,
    ) => {
        const logo = LOGOS[group.label as WaldiezModelAPIType];
        return (
            <div style={{ display: "flex", alignItems: "center" }} className={`model-logo ${group.label}`}>
                <img
                    src={logo}
                    alt="logo"
                    style={{ width: 20, height: 20, marginRight: 10, backgroundColor: "transparent" }}
                />
                <strong>{group.label}</strong>
            </div>
        );
    };

    return (
        <div className="margin-bottom-10">
            <label>Predefined models:</label>
            <Select
                ref={props.ref}
                options={groupedOptions}
                onChange={handleChange}
                placeholder="Select a model..."
                formatGroupLabel={formatGroupLabel}
                isSearchable
                isClearable
            />
        </div>
    );
};
