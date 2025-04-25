/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useEffect } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

export const useFlowModels = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;
    const modelNodes = flowData?.nodes.filter(node => node.type === "model");
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
            `import-flow-modal-models-all-none-${flowId}`,
        ) as HTMLInputElement;
        if (allNoneCheckbox) {
            const atLeastOneChecked = selectedProps.nodes.models.length > 0;
            if (atLeastOneChecked) {
                const allChecked = selectedProps.nodes.models.length === modelNodes?.length;
                allNoneCheckbox.indeterminate = !allChecked;
                allNoneCheckbox.checked = allChecked;
            } else {
                allNoneCheckbox.indeterminate = false;
                allNoneCheckbox.checked = false;
            }
        }
    };
    const onModelsChange = (node: Node) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models.some(model => model.id === node.id)
                    ? selectedProps.nodes.models.filter(model => model.id !== node.id)
                    : [...selectedProps.nodes.models, node],
                skills: selectedProps.nodes.skills,
                agents: selectedProps.nodes.agents,
            },
        });
    };
    const onAllNoneModelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            nodes: {
                models: event.target.checked ? modelNodes! : [],
                skills: selectedProps.nodes.skills,
                agents: selectedProps.nodes.agents,
            },
        });
    };
    return {
        modelNodes,
        onModelsChange,
        onAllNoneModelsChange,
    };
};
