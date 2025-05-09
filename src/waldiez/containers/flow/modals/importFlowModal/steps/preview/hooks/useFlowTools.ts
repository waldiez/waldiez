/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useEffect } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

export const useFlowTools = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;
    const toolNodes = flowData?.nodes.filter(node => node.type === "tool");
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
            `import-flow-modal-tools-all-none-${flowId}`,
        ) as HTMLInputElement;
        if (allNoneCheckbox) {
            const atLeastOneChecked = selectedProps.nodes.tools.length > 0;
            if (atLeastOneChecked) {
                const allChecked = selectedProps.nodes.tools.length === toolNodes?.length;
                allNoneCheckbox.indeterminate = !allChecked;
                allNoneCheckbox.checked = allChecked;
            } else {
                allNoneCheckbox.indeterminate = false;
                allNoneCheckbox.checked = false;
            }
        }
    };
    const onToolsChange = (node: Node) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                tools: selectedProps.nodes.tools.some(tool => tool.id === node.id)
                    ? selectedProps.nodes.tools.filter(tool => tool.id !== node.id)
                    : [...selectedProps.nodes.tools, node],
                agents: selectedProps.nodes.agents,
            },
        });
    };
    const onAllNoneToolsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                tools: event.target.checked ? toolNodes! : [],
                agents: selectedProps.nodes.agents,
            },
        });
    };
    return {
        toolNodes,
        onToolsChange,
        onAllNoneToolsChange,
    };
};
