/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Modal } from "@waldiez/components";
import { useUserInputModal } from "@waldiez/containers/flow/modals/userInputModal/hooks";
import { UserInputModalProps } from "@waldiez/containers/flow/modals/userInputModal/types";

export const UserInputModal = (props: UserInputModalProps) => {
    const { flowId, isOpen, inputPrompt } = props;
    const { onClose, onCancel, onSubmit } = useUserInputModal(props);
    return (
        <Modal
            title="User Input"
            isOpen={isOpen}
            onClose={onClose}
            className="user-input-modal"
            hasMaximizeBtn={false}
            dataTestId={`rf-${flowId}-user-input-modal`}
        >
            <div className="modal-body">
                {inputPrompt.previousMessages.length > 0 && (
                    <div className="console">
                        <div className="console-messages" data-flow-id={flowId}>
                            {inputPrompt.previousMessages.map((message, index) => (
                                <div className="console-message" key={index}>
                                    {message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="input-prompt">{inputPrompt.prompt}</div>
                <input
                    placeholder="Type your message here"
                    type="text"
                    id={`rf-${flowId}-user-input-modal-input`}
                    data-testid={`rf-${flowId}-user-input-modal-input`}
                />
            </div>
            <div className="modal-actions">
                <button
                    type="button"
                    title="Cancel"
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid={`rf-${flowId}-user-input-modal-cancel`}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    title="Submit"
                    className="modal-action-submit"
                    onClick={onSubmit}
                    data-testid={`rf-${flowId}-user-input-modal-submit`}
                >
                    Submit
                </button>
            </div>
        </Modal>
    );
};
