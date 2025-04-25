/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useFlowInfo } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";

export const FlowInfo = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { selectedProps, loadedFlowData: flowData } = state;
    const tagsString = flowData?.tags.length ? flowData?.tags.join(", ") : "None";
    const requirementsString = flowData?.requirements.length ? flowData?.requirements.join(", ") : "None";
    const {
        onOverrideChange,
        onAllNoneInfoChange,
        onNameChange,
        onDescriptionChange,
        onTagsChange,
        onRequirementsChange,
        onImportEverythingChange,
    } = useFlowInfo(props);
    return (
        <>
            <div className="flow-data-preview-body">
                <div className="flow-data-preview-body-section">
                    <h4>Flow Override</h4>
                    <div className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>Remove existing flow and replace with imported flow</div>
                            <input
                                type="checkbox"
                                checked={selectedProps.override}
                                onChange={onOverrideChange}
                                data-testid="override-flow-checkbox"
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                </div>
                <div className="flow-data-preview-body-section" style={{ marginTop: 0 }}>
                    <h4>What to import</h4>
                    <div className="flow-data-preview-body-section-row">
                        <label className="checkbox-label">
                            <div>Import Everything</div>
                            <input
                                type="checkbox"
                                checked={selectedProps.everything}
                                onChange={onImportEverythingChange}
                                data-testid="import-everything-checkbox"
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                </div>
                {!selectedProps.everything && (
                    <div className="flow-data-preview-body-section">
                        <h4>Flow Information</h4>
                        <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div className="bold">Select All | None</div>
                                <input
                                    type="checkbox"
                                    onChange={onAllNoneInfoChange}
                                    id={`import-flow-info-all-none-${flowId}`}
                                    data-testid="import-flow-info-all-none"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div data-testid="import-flow-info-name-preview">Name: {flowData?.name}</div>
                                <input
                                    type="checkbox"
                                    checked={selectedProps.name}
                                    onChange={onNameChange}
                                    data-testid="import-flow-info-name"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div data-testid="import-flow-info-description-preview">
                                    Description: {flowData?.description}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedProps.description}
                                    onChange={onDescriptionChange}
                                    data-testid="import-flow-info-description"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div data-testid="import-flow-info-tags-preview">Tags: {tagsString}</div>
                                <input
                                    type="checkbox"
                                    checked={selectedProps.tags}
                                    onChange={onTagsChange}
                                    data-testid="import-flow-info-tags"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div data-testid="import-flow-info-requirements-preview">
                                    Requirements: {requirementsString}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedProps.requirements}
                                    onChange={onRequirementsChange}
                                    data-testid="import-flow-info-requirements"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div>
                        {/* <div className="flow-data-preview-body-section-row">
                            <label className="checkbox-label">
                                <div>Is Async</div>
                                <input
                                    type="checkbox"
                                    checked={selectedProps.isAsync}
                                    onChange={onIsASyncChange}
                                    data-testid="import-flow-info-is-async"
                                />
                                <div className="checkbox"></div>
                            </label>
                        </div> */}
                    </div>
                )}
            </div>
        </>
    );
};
