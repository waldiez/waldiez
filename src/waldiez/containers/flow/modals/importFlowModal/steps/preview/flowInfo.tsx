/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { CheckboxInput } from "@waldiez/components";
import { useFlowInfo } from "@waldiez/containers/flow/modals/importFlowModal/steps/preview/hooks";
import type { FlowDataPreviewProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";

export const FlowInfo = (props: FlowDataPreviewProps) => {
    const { flowId, state } = props;
    const { loadedFlowData: flowData, selectedProps } = state;
    const tagsString = flowData?.tags.length ? flowData?.tags.join(", ") : "None";
    const requirementsString = flowData?.requirements.length ? flowData?.requirements.join(", ") : "None";
    const {
        onOverrideChange,
        onAllNoneInfoChange,
        onNameChange,
        onDescriptionChange,
        onIsASyncChange,
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
                        <CheckboxInput
                            label="Override existing flow with imported flow"
                            isChecked={selectedProps.override}
                            onCheckedChange={onOverrideChange}
                            id={`import-flow-modal-override-${flowId}`}
                            data-testid="override-flow-checkbox"
                        />
                    </div>
                </div>
                <div className="flow-data-preview-body-section" style={{ marginTop: 0 }}>
                    <h4>What to import</h4>
                    <div className="flow-data-preview-body-section-row">
                        <CheckboxInput
                            label="Import Everything"
                            isChecked={selectedProps.everything}
                            onCheckedChange={onImportEverythingChange}
                            id={`import-flow-modal-everything-${flowId}`}
                            data-testid="import-everything-checkbox"
                        />
                    </div>
                </div>
                {!selectedProps.everything && (
                    <div className="flow-data-preview-body-section">
                        <h4>Flow Information</h4>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label={<div className="bold">Select All | None</div>}
                                isChecked={
                                    selectedProps.name &&
                                    selectedProps.description &&
                                    selectedProps.tags &&
                                    selectedProps.requirements &&
                                    selectedProps.isAsync
                                }
                                onCheckedChange={onAllNoneInfoChange}
                                id={`import-flow-info-all-none-${flowId}`}
                                data-testid="import-flow-info-all-none"
                            />
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label={
                                    <div data-testid="import-flow-info-name-preview">
                                        Name: {flowData?.name}
                                    </div>
                                }
                                isChecked={selectedProps.name}
                                onCheckedChange={onNameChange}
                                id={`import-flow-info-name-${flowId}`}
                                data-testid="import-flow-info-name"
                            />
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label={
                                    <div data-testid="import-flow-info-description-preview">
                                        Description: {flowData?.description}
                                    </div>
                                }
                                isChecked={selectedProps.description}
                                onCheckedChange={onDescriptionChange}
                                id={`import-flow-info-description-${flowId}`}
                                data-testid="import-flow-info-description"
                            />
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label={
                                    <div data-testid="import-flow-info-tags-preview">Tags: {tagsString}</div>
                                }
                                isChecked={selectedProps.tags}
                                onCheckedChange={onTagsChange}
                                id={`import-flow-info-tags-${flowId}`}
                                data-testid="import-flow-info-tags"
                            />
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label={
                                    <div data-testid="import-flow-info-requirements-preview">
                                        Requirements: {requirementsString}
                                    </div>
                                }
                                isChecked={selectedProps.requirements}
                                onCheckedChange={onRequirementsChange}
                                id={`import-flow-info-requirements-${flowId}`}
                                data-testid="import-flow-info-requirements"
                            />
                        </div>
                        <div className="flow-data-preview-body-section-row">
                            <CheckboxInput
                                label="Is Async"
                                isChecked={selectedProps.isAsync}
                                onCheckedChange={onIsASyncChange}
                                id={`import-flow-info-is-async-${flowId}`}
                                data-testid="import-flow-info-is-async"
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
