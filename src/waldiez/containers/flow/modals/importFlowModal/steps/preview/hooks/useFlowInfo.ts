/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

/**
 * Custom hook for managing flow info selection in flow import
 */
export const useFlowInfo = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps } = state;

    /**
     * Update selection options in state
     */
    const onSelectedPropsChange = useCallback(
        (thingsToImport: Partial<ThingsToImport>) => {
            onStateChange({
                selectedProps: {
                    ...selectedProps,
                    ...thingsToImport,
                },
            });
        },
        [selectedProps, onStateChange],
    );

    /**
     * Determine if any info properties are selected
     */
    const infoCheckStatus = useMemo(() => {
        const infoProps = [
            selectedProps.name,
            selectedProps.description,
            selectedProps.tags,
            selectedProps.requirements,
        ];

        const selected = infoProps.filter(Boolean).length;

        return {
            anySelected: selected > 0,
            allSelected: selected === infoProps.length,
            partiallySelected: selected > 0 && selected < infoProps.length,
        };
    }, [selectedProps.name, selectedProps.description, selectedProps.tags, selectedProps.requirements]);

    /**
     * Update checkbox indeterminate state
     */
    const checkInfoIndeterminate = useCallback(() => {
        const allNoneCheckbox = document.getElementById(
            `import-flow-info-all-none-${flowId}`,
        ) as HTMLInputElement;

        if (!allNoneCheckbox) {
            return;
        }

        if (infoCheckStatus.anySelected) {
            allNoneCheckbox.indeterminate = infoCheckStatus.partiallySelected;
            allNoneCheckbox.checked = infoCheckStatus.allSelected;
        } else {
            allNoneCheckbox.indeterminate = false;
            allNoneCheckbox.checked = false;
        }
    }, [flowId, infoCheckStatus]);

    // Update indeterminate state when selections change
    useEffect(() => {
        checkInfoIndeterminate();
    }, [checkInfoIndeterminate]);

    /**
     * Select all or none of the info properties
     */
    const onAllNoneInfoChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                name: checked,
                description: checked,
                tags: checked,
                requirements: checked,
                isAsync: checked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Toggle import everything option
     */
    const onImportEverythingChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                everything: checked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Toggle override option
     */
    const onOverrideChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                override: checked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Individual property toggle handlers
     */
    const onNameChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({ name: checked });
        },
        [onSelectedPropsChange],
    );

    const onDescriptionChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({ description: checked });
        },
        [onSelectedPropsChange],
    );

    const onTagsChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({ tags: checked });
        },
        [onSelectedPropsChange],
    );

    const onRequirementsChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({ requirements: checked });
        },
        [onSelectedPropsChange],
    );

    const onIsASyncChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({ isAsync: checked });
        },
        [onSelectedPropsChange],
    );

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
