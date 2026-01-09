/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import { useCallback, useEffect, useMemo } from "react";

import type { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import type { ThingsToImport } from "@waldiez/types";

/**
 * Custom hook for managing agent nodes selection in flow import
 */
export const useFlowAgents = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;

    // Extract agent nodes from flow data
    const agentNodes = useMemo(
        () => flowData?.nodes.filter(node => node.type === "agent") || [],
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
            `import-flow-modal-agents-all-none-${flowId}`,
        ) as HTMLInputElement;

        if (!allNoneCheckbox) {
            return;
        }

        const atLeastOneChecked = selectedProps.nodes.agents.length > 0;

        if (atLeastOneChecked) {
            const allChecked = selectedProps.nodes.agents.length === agentNodes.length;
            allNoneCheckbox.indeterminate = !allChecked;
            allNoneCheckbox.checked = allChecked;
        } else {
            allNoneCheckbox.indeterminate = false;
            allNoneCheckbox.checked = false;
        }
    }, [flowId, selectedProps.nodes.agents.length, agentNodes.length]);

    // Update indeterminate state when selections change
    useEffect(() => {
        checkAllNoneIndeterminate();
    }, [checkAllNoneIndeterminate]);

    /**
     * Toggle an agent node selection
     */
    const onAgentsChange = useCallback(
        (node: Node) => {
            const isSelected = selectedProps.nodes.agents.some(agent => agent.id === node.id);

            onSelectedPropsChange({
                nodes: {
                    models: selectedProps.nodes.models,
                    tools: selectedProps.nodes.tools,
                    agents: isSelected
                        ? selectedProps.nodes.agents.filter(agent => agent.id !== node.id)
                        : [...selectedProps.nodes.agents, node],
                },
            });
        },
        [selectedProps.nodes, onSelectedPropsChange],
    );

    /**
     * Select all or none of the agent nodes
     */
    const onAllNoneAgentsChange = useCallback(
        (checked: boolean) => {
            onSelectedPropsChange({
                nodes: {
                    models: selectedProps.nodes.models,
                    tools: selectedProps.nodes.tools,
                    agents: checked ? agentNodes : [],
                },
            });
        },
        [agentNodes, selectedProps.nodes.models, selectedProps.nodes.tools, onSelectedPropsChange],
    );

    return {
        agentNodes,
        onAgentsChange,
        onAllNoneAgentsChange,
    };
};
