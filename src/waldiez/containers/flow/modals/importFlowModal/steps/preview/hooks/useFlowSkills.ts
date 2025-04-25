/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useEffect } from "react";

import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { ThingsToImport } from "@waldiez/types";

export const useFlowSkills = (props: {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, onStateChange } = props;
    const { selectedProps, loadedFlowData: flowData } = state;
    const skillNodes = flowData?.nodes.filter(node => node.type === "skill");
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
            `import-flow-modal-skills-all-none-${flowId}`,
        ) as HTMLInputElement;
        if (allNoneCheckbox) {
            const atLeastOneChecked = selectedProps.nodes.skills.length > 0;
            if (atLeastOneChecked) {
                const allChecked = selectedProps.nodes.skills.length === skillNodes?.length;
                allNoneCheckbox.indeterminate = !allChecked;
                allNoneCheckbox.checked = allChecked;
            } else {
                allNoneCheckbox.indeterminate = false;
                allNoneCheckbox.checked = false;
            }
        }
    };
    const onSkillsChange = (node: Node) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                skills: selectedProps.nodes.skills.some(skill => skill.id === node.id)
                    ? selectedProps.nodes.skills.filter(skill => skill.id !== node.id)
                    : [...selectedProps.nodes.skills, node],
                agents: selectedProps.nodes.agents,
            },
        });
    };
    const onAllNoneSkillsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelectedPropsChange({
            nodes: {
                models: selectedProps.nodes.models,
                skills: event.target.checked ? skillNodes! : [],
                agents: selectedProps.nodes.agents,
            },
        });
    };
    return {
        skillNodes,
        onSkillsChange,
        onAllNoneSkillsChange,
    };
};
