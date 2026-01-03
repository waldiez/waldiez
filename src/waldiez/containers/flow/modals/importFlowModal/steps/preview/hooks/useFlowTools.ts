/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import { useCallback, useEffect, useMemo } from "react";

import type { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import type { ThingsToImport } from "@waldiez/types";

/**
 * Custom hook for managing tool nodes selection in flow import
 */
export const useFlowTools = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;

    // Extract tool nodes from flow data
    const toolNodes = useMemo(
        () => flowData?.nodes.filter(node => node.type === "tool") || [],
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
            `import-flow-modal-tools-all-none-${flowId}`,
        ) as HTMLInputElement;

        if (!allNoneCheckbox) {
            return;
        }

        const atLeastOneChecked = selectedProps.nodes.tools.length > 0;

        if (atLeastOneChecked) {
            const allChecked = selectedProps.nodes.tools.length === toolNodes.length;
            allNoneCheckbox.indeterminate = !allChecked;
            allNoneCheckbox.checked = allChecked;
        } else {
            allNoneCheckbox.indeterminate = false;
            allNoneCheckbox.checked = false;
        }
    }, [flowId, selectedProps.nodes.tools.length, toolNodes.length]);

    // Update indeterminate state when selections change
    useEffect(() => {
        checkAllNoneIndeterminate();
    }, [checkAllNoneIndeterminate]);

    /**
     * Toggle a tool node selection
     */
    const onToolsChange = useCallback(
        (node: Node) => {
            const isSelected = selectedProps.nodes.tools.some(tool => tool.id === node.id);

            onSelectedPropsChange({
                nodes: {
                    models: selectedProps.nodes.models,
                    tools: isSelected
                        ? selectedProps.nodes.tools.filter(tool => tool.id !== node.id)
                        : [...selectedProps.nodes.tools, node],
                    agents: selectedProps.nodes.agents,
                },
            });
        },
        [selectedProps.nodes, onSelectedPropsChange],
    );

    /**
     * Select all or none of the tool nodes
     */
    const onAllNoneToolsChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                nodes: {
                    models: selectedProps.nodes.models,
                    tools: checked ? toolNodes : [],
                    agents: selectedProps.nodes.agents,
                },
            });
        },
        [toolNodes, selectedProps.nodes.models, selectedProps.nodes.agents, onSelectedPropsChange],
    );

    return {
        toolNodes,
        onToolsChange,
        onAllNoneToolsChange,
    };
};
