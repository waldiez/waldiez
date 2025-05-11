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
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const isChecked = event.target.checked;

            onSelectedPropsChange({
                name: isChecked,
                description: isChecked,
                tags: isChecked,
                requirements: isChecked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Toggle import everything option
     */
    const onImportEverythingChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({
                everything: event.target.checked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Toggle override option
     */
    const onOverrideChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({
                override: event.target.checked,
            });
        },
        [onSelectedPropsChange],
    );

    /**
     * Individual property toggle handlers
     */
    const onNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({ name: event.target.checked });
        },
        [onSelectedPropsChange],
    );

    const onDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({ description: event.target.checked });
        },
        [onSelectedPropsChange],
    );

    const onTagsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({ tags: event.target.checked });
        },
        [onSelectedPropsChange],
    );

    const onRequirementsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({ requirements: event.target.checked });
        },
        [onSelectedPropsChange],
    );

    const onIsASyncChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSelectedPropsChange({ isAsync: event.target.checked });
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
