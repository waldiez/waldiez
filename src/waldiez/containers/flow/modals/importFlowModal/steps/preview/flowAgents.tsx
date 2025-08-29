/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { CheckboxInput } from "@waldiez/components";
import { useFlowAgents } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import type { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import type { WaldiezNodeAgent } from "@waldiez/models/types";

export const FlowAgents = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { selectedProps } = state;
    const { agentNodes, onAgentsChange, onAllNoneAgentsChange } = useFlowAgents(props);
    return (
        <div className="flow-data-preview-body-section">
            <h4>Agents</h4>
            {agentNodes && agentNodes?.length > 1 && (
                <div className="flow-data-preview-body-section-row">
                    <CheckboxInput
                        label={<div className="bold">Select All | None</div>}
                        isChecked={selectedProps.nodes.agents.length === agentNodes.length}
                        onCheckedChange={onAllNoneAgentsChange}
                        id={`import-flow-modal-agents-all-none-${flowId}`}
                        data-testid={`import-flow-modal-agent-all-none-${flowId}`}
                    />
                </div>
            )}
            {agentNodes?.map(node => {
                const agentNode = node as WaldiezNodeAgent;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <CheckboxInput
                            label={
                                <div>
                                    {agentNode.data.label}: {agentNode.data.description}
                                </div>
                            }
                            id={`import-flow-modal-agent-checkbox-${node.id}`}
                            isChecked={selectedProps.nodes.agents.some(agent => agent.id === node.id)}
                            onCheckedChange={onAgentsChange.bind(null, node)}
                            data-testid={`import-flow-modal-agent-checkbox-${node.id}`}
                        />
                    </div>
                );
            })}
            {agentNodes?.length === 0 && <div>No agents in this flow</div>}
        </div>
    );
};
