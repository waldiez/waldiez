/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useFlowAgents } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import { WaldiezNodeAgent } from "@waldiez/models";

export const FlowAgents = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { selectedProps } = state;
    const { agentNodes, onAgentsChange, onAllNoneAgentsChange } = useFlowAgents(props);
    return (
        <div className="flow-data-preview-body-section">
            <h4>Agents</h4>
            {agentNodes && agentNodes?.length > 1 && (
                <div className="flow-data-preview-body-section-row">
                    <label className="checkbox-label">
                        <div className="bold">Select All | None</div>
                        <input
                            type="checkbox"
                            checked={selectedProps.nodes.agents.length === agentNodes.length}
                            onChange={onAllNoneAgentsChange}
                            id={`import-flow-modal-agents-all-none-${flowId}`}
                            data-testid={`import-flow-modal-agent-all-none-${flowId}`}
                        />
                        <div className="checkbox"></div>
                    </label>
                </div>
            )}
            {agentNodes?.map(node => {
                const agentNode = node as WaldiezNodeAgent;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>
                                {agentNode.data.label}: {agentNode.data.description}
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedProps.nodes.agents.some(agent => agent.id === node.id)}
                                onChange={onAgentsChange.bind(null, node)}
                                data-testid={`import-flow-modal-agent-checkbox-${node.id}`}
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                );
            })}
            {agentNodes?.length === 0 && <div>No agents in this flow</div>}
        </div>
    );
};
