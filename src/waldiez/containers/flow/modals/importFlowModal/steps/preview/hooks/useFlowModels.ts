/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import { useCallback, useEffect, useMemo } from "react";

import type { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import type { ThingsToImport } from "@waldiez/types";

/**
 * Custom hook for managing model nodes selection in flow import
 */
export const useFlowModels = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;

    // Extract model nodes from flow data
    const modelNodes = useMemo(
        () => flowData?.nodes.filter(node => node.type === "model") || [],
        [flowData?.nodes],
    );

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
     * Update checkbox indeterminate state
     */
    const checkAllNoneIndeterminate = useCallback(() => {
        const allNoneCheckbox = document.getElementById(
            `import-flow-modal-models-all-none-${flowId}`,
        ) as HTMLInputElement;

        if (!allNoneCheckbox) {
            return;
        }

        const atLeastOneChecked = selectedProps.nodes.models.length > 0;

        if (atLeastOneChecked) {
            const allChecked = selectedProps.nodes.models.length === modelNodes.length;
            allNoneCheckbox.indeterminate = !allChecked;
            allNoneCheckbox.checked = allChecked;
        } else {
            allNoneCheckbox.indeterminate = false;
            allNoneCheckbox.checked = false;
        }
    }, [flowId, selectedProps.nodes.models.length, modelNodes.length]);

    // Update indeterminate state when selections change
    useEffect(() => {
        checkAllNoneIndeterminate();
    }, [checkAllNoneIndeterminate]);

    /**
     * Toggle a model node selection
     */
    const onModelsChange = useCallback(
        (node: Node) => {
            const isSelected = selectedProps.nodes.models.some(model => model.id === node.id);

            onSelectedPropsChange({
                nodes: {
                    models: isSelected
                        ? selectedProps.nodes.models.filter(model => model.id !== node.id)
                        : [...selectedProps.nodes.models, node],
                    tools: selectedProps.nodes.tools,
                    agents: selectedProps.nodes.agents,
                },
            });
        },
        [selectedProps.nodes, onSelectedPropsChange],
    );

    /**
     * Select all or none of the model nodes
     */
    const onAllNoneModelsChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                nodes: {
                    models: checked ? modelNodes : [],
                    tools: selectedProps.nodes.tools,
                    agents: selectedProps.nodes.agents,
                },
            });
        },
        [modelNodes, selectedProps.nodes.tools, selectedProps.nodes.agents, onSelectedPropsChange],
    );

    return {
        modelNodes,
        onModelsChange,
        onAllNoneModelsChange,
    };
};
