/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC } from "react";

import { Modal, Wizard, WizardStep } from "@waldiez/components";
import { useImportFlowModal } from "@waldiez/containers/flow/modals/importFlowModal/hooks";
import { FlowDataPreviewStep, LoadFlowStep } from "@waldiez/containers/flow/modals/importFlowModal/steps";
import type { ImportFlowModalProps } from "@waldiez/containers/flow/modals/importFlowModal/types";

export const ImportFlowModal: FC<ImportFlowModalProps> = (props: ImportFlowModalProps) => {
    const { flowId, isOpen } = props;
    const { state, initialState, onStateChange, onClose, onBack, onForward } = useImportFlowModal(props);
    return (
        <Modal
            flowId={flowId}
            isOpen={isOpen}
            onClose={onClose}
            title="Import Flow"
            dataTestId={`import-flow-modal-${flowId}`}
        >
            <div className="modal-body">
                <Wizard
                    activeStep={0}
                    canGoForward={!!state.loadedFlowData}
                    firstBackTitle="Cancel"
                    lastNextTitle="Import"
                    onBack={onBack}
                    onForward={onForward}
                >
                    <WizardStep id={`import-flow-modal-load-step-${flowId}`} title="Load Flow">
                        <LoadFlowStep
                            initialState={initialState}
                            flowId={flowId}
                            state={state}
                            onStateChange={onStateChange}
                        />
                    </WizardStep>
                    <WizardStep id={`import-flow-modal-preview-step-${flowId}`} title="Preview Flow">
                        {state.loadedFlowData ? (
                            <FlowDataPreviewStep
                                flowId={flowId}
                                state={state}
                                onStateChange={onStateChange}
                            />
                        ) : null}
                    </WizardStep>
                </Wizard>
            </div>
        </Modal>
    );
};
