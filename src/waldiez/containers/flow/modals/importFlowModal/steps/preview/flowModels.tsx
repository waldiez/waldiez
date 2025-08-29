/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { CheckboxInput } from "@waldiez/components";
import { useFlowModels } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import type { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import type { WaldiezNodeModel } from "@waldiez/models";

export const FlowModels = (props: FlowDataPreviewProps) => {
    const { state } = props;
    const { modelNodes, onModelsChange, onAllNoneModelsChange } = useFlowModels(props);
    const { selectedProps } = state;
    return (
        <div className="flow-data-preview-body-section">
            <h4>Models</h4>
            {modelNodes && modelNodes?.length > 1 && (
                <CheckboxInput
                    id={`import-flow-modal-models-all-none-${props.flowId}`}
                    label="Select All | None"
                    isChecked={selectedProps.nodes.models.length === modelNodes.length}
                    onCheckedChange={onAllNoneModelsChange}
                    data-testid={`import-flow-modal-model-all-none-${props.flowId}`}
                />
            )}
            {modelNodes?.map(node => {
                const modelNode = node as WaldiezNodeModel;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <CheckboxInput
                            label={
                                <div>
                                    {modelNode.data.label}: {modelNode.data.description}
                                </div>
                            }
                            id={`import-flow-modal-model-checkbox-${node.id}`}
                            isChecked={selectedProps.nodes.models.some(model => model.id === node.id)}
                            onCheckedChange={onModelsChange.bind(null, node)}
                            data-testid={`import-flow-modal-model-checkbox-${node.id}`}
                        />
                    </div>
                );
            })}
            {modelNodes?.length === 0 && <div>No models in this flow</div>}
        </div>
    );
};
