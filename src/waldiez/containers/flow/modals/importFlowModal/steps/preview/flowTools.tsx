/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { CheckboxInput } from "@waldiez/components";
import { useFlowTools } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";
import { WaldiezNodeTool } from "@waldiez/models";

export const FlowTools = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { selectedProps } = state;
    const { toolNodes, onToolsChange, onAllNoneToolsChange } = useFlowTools(props);
    return (
        <div className="flow-data-preview-body-section">
            <h4>Tools</h4>
            {toolNodes && toolNodes?.length > 1 && (
                <CheckboxInput
                    id={`import-flow-modal-tools-all-none-${flowId}`}
                    label="Select All | None"
                    isChecked={selectedProps.nodes.tools.length === toolNodes.length}
                    onCheckedChange={onAllNoneToolsChange}
                    data-testid={`import-flow-modal-tool-all-none-${flowId}`}
                />
            )}
            {toolNodes?.map(node => {
                const toolNode = node as WaldiezNodeTool;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <CheckboxInput
                            label={
                                <div>
                                    {toolNode.data.label}: {toolNode.data.description}
                                </div>
                            }
                            id={`import-flow-modal-tool-checkbox-${node.id}`}
                            isChecked={selectedProps.nodes.tools.some(tool => tool.id === node.id)}
                            onCheckedChange={onToolsChange.bind(null, node)}
                            data-testid={`import-flow-modal-tool-checkbox-${node.id}`}
                        />
                    </div>
                );
            })}
            {toolNodes?.length === 0 && <div>No tools in this flow</div>}
        </div>
    );
};
