/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
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
                <div className="flow-data-preview-body-section-row">
                    <label className="checkbox-label">
                        <div className="bold">Select All | None</div>
                        <input
                            type="checkbox"
                            checked={selectedProps.nodes.tools.length === toolNodes.length}
                            onChange={onAllNoneToolsChange}
                            id={`import-flow-modal-tools-all-none-${flowId}`}
                            data-testid={`import-flow-modal-tool-all-none-${flowId}`}
                        />
                        <div className="checkbox"></div>
                    </label>
                </div>
            )}
            {toolNodes?.map(node => {
                const toolNode = node as WaldiezNodeTool;
                return (
                    <div key={node.id} className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>
                                {toolNode.data.label}: {toolNode.data.description}
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedProps.nodes.tools.some(tool => tool.id === node.id)}
                                onChange={onToolsChange.bind(null, node)}
                                data-testid={`import-flow-modal-tool-checkbox-${node.id}`}
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                );
            })}
            {toolNodes?.length === 0 && <div>No tools in this flow</div>}
        </div>
    );
};
