/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useEffect } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

export const useFlowAgents = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;
    const agentNodes = flowData?.nodes.filter(node => node.type === "agent");
    useEffect(() => {
        checkAllNoneIndeterminate();
    }, [selectedProps]);
    const onSelectedPropsChange = (thingsToImport: Partial<ThingsToImport>) => {
        onStateChange({
            selectedProps: {
                ...selectedProps,
                ...thingsToImport,
            },
        });
    };
    const checkAllNoneIndeterminate = () => {
        const allNoneCheckbox = document.getElementById(
            `import-flow-modal-agents-all-none-${flowId}`,
        ) as HTMLInputElement;
        if (allNoneCheckbox) {
            const atLeastOneChecked = selectedProps.nodes.agents.length > 0;
            if (atLeastOneChecked) {
                const allChecked = selectedProps.nodes.agents.length === agentNodes?.length;
                allNoneCheckbox.indeterminate = !allChecked;
                allNoneCheckbox.checked = allChecked;
            } else {
                allNoneCheckbox.indeterminate = false;
                allNoneCheckbox.checked = false;
            }
        }
    };
    const onAgentsChange = (node: Node) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                tools: selectedProps.nodes.tools,
                agents: selectedProps.nodes.agents.some(agent => agent.id === node.id)
                    ? selectedProps.nodes.agents.filter(agent => agent.id !== node.id)
                    : [...selectedProps.nodes.agents, node],
            },
        });
    };
    const onAllNoneAgentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                tools: selectedProps.nodes.tools,
                agents: event.target.checked ? agentNodes! : [],
            },
        });
    };
    return {
        agentNodes,
        onAgentsChange,
        onAllNoneAgentsChange,
    };
};
