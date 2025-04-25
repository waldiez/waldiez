/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useFlowModels } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import { WaldiezNodeModel } from "@waldiez/models";

export const FlowModels = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { modelNodes, onModelsChange, onAllNoneModelsChange } = useFlowModels(props);
    const { selectedProps } = state;
    return (
        <div className="flow-data-preview-body-section">
            <h4>Models</h4>
            {modelNodes && modelNodes?.length > 1 && (
                <div className="flow-data-preview-body-section-row">
                    <label className="checkbox-label">
                        <div className="bold">Select All | None</div>
                        <input
                            type="checkbox"
                            checked={selectedProps.nodes.models.length === modelNodes.length}
                            onChange={onAllNoneModelsChange}
                            id={`import-flow-modal-models-all-none-${flowId}`}
                            data-testid={`import-flow-modal-model-all-none-${flowId}`}
                        />
                        <div className="checkbox"></div>
                    </label>
                </div>
            )}
            {modelNodes?.map(node => {
                const modelNode = node as WaldiezNodeModel;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>
                                {modelNode.data.label}: {modelNode.data.description}
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedProps.nodes.models.some(model => model.id === node.id)}
                                onChange={onModelsChange.bind(null, node)}
                                data-testid={`import-flow-modal-model-checkbox-${node.id}`}
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                );
            })}
            {modelNodes?.length === 0 && <div>No models in this flow</div>}
        </div>
    );
};
