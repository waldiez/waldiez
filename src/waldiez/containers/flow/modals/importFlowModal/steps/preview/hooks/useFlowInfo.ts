/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

export const useFlowInfo = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps } = state;
    useEffect(() => {
        checkInfoIndeterminate();
    }, [selectedProps]);
    const onSelectedPropsChange = (thingsToImport: Partial<ThingsToImport>) => {
        onStateChange({
            selectedProps: {
                ...selectedProps,
                ...thingsToImport,
            },
        });
    };
    const checkInfoIndeterminate = () => {
        const allNoneCheckbox = document.getElementById(
            `import-flow-info-all-none-${flowId}`,
        ) as HTMLInputElement;
        if (allNoneCheckbox) {
            const atLeastOneChecked =
                selectedProps.name ||
                selectedProps.description ||
                selectedProps.tags ||
                selectedProps.requirements;
            if (atLeastOneChecked) {
                const allChecked =
                    selectedProps.name &&
                    selectedProps.description &&
                    selectedProps.tags &&
                    selectedProps.requirements;
                allNoneCheckbox.indeterminate = !allChecked;
                allNoneCheckbox.checked = allChecked;
            } else {
                allNoneCheckbox.indeterminate = false;
                allNoneCheckbox.checked = false;
            }
        }
    };
    const onAllNoneInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            name: event.target.checked,
            description: event.target.checked,
            tags: event.target.checked,
            requirements: event.target.checked,
        });
    };
    const onImportEverythingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            everything: event.target.checked,
        });
    };
    const onOverrideChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ override: event.target.checked });
    };
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ name: event.target.checked });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ description: event.target.checked });
    };
    const onTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ tags: event.target.checked });
    };
    const onRequirementsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ requirements: event.target.checked });
    };
    const onIsASyncChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({ isAsync: event.target.checked });
    };
    return {
        onOverrideChange,
        onNameChange,
        onDescriptionChange,
        onTagsChange,
        onRequirementsChange,
        onIsASyncChange,
        onAllNoneInfoChange,
        onImportEverythingChange,
    };
};
