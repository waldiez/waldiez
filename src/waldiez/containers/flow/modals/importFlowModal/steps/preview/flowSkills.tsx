/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useFlowSkills } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import { WaldiezNodeSkill } from "@waldiez/models";

export const FlowSkills = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { selectedProps } = state;
    const { skillNodes, onSkillsChange, onAllNoneSkillsChange } = useFlowSkills(props);
    return (
        <div className="flow-data-preview-body-section">
            <h4>Skills</h4>
            {skillNodes && skillNodes?.length > 1 && (
                <div className="flow-data-preview-body-section-row">
                    <label className="checkbox-label">
                        <div className="bold">Select All | None</div>
                        <input
                            type="checkbox"
                            checked={selectedProps.nodes.skills.length === skillNodes.length}
                            onChange={onAllNoneSkillsChange}
                            id={`import-flow-modal-skills-all-none-${flowId}`}
                            data-testid={`import-flow-modal-skill-all-none-${flowId}`}
                        />
                        <div className="checkbox"></div>
                    </label>
                </div>
            )}
            {skillNodes?.map(node => {
                const skillNode = node as WaldiezNodeSkill;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>
                                {skillNode.data.label}: {skillNode.data.description}
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedProps.nodes.skills.some(skill => skill.id === node.id)}
                                onChange={onSkillsChange.bind(null, node)}
                                data-testid={`import-flow-modal-skill-checkbox-${node.id}`}
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                );
            })}
            {skillNodes?.length === 0 && <div>No skills in this flow</div>}
        </div>
    );
};
