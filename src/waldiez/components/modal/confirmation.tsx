/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */

/**
 * Confirmation modal content for unsaved changes
 * @param props - Props for the confirmation modal
 * @param props.onSaveAndClose - Optional callback for saving and closing the modal
 * @param props.hideConfirmation - Callback to hide the confirmation modal
 * @param props.handleSaveAndClose - Callback to handle saving and closing the modal
 * @param props.handleCloseModal - Callback to handle closing the modal
 */
export const renderConfirmationContent = (props: {
    onSaveAndClose?: () => void;
    hideConfirmation: () => void;
    handleSaveAndClose: () => void;
    handleCloseModal: () => void;
}) => {
    const { onSaveAndClose, hideConfirmation, handleSaveAndClose, handleCloseModal } = props;
    return (
        <div className="modal-confirmation padding-10">
            <div className="modal-confirmation-content">
                <h4 className="warning">
                    Are you sure you want to close this modal? Any unsaved changes will be lost.
                </h4>
                <div className="modal-actions">
                    {onSaveAndClose ? (
                        <>
                            <div className="modal-actions flex items-center justify-center margin-top--10 margin-bottom--10">
                                <button
                                    className="secondary"
                                    data-testid="modal-action-confirm-cancel"
                                    onClick={hideConfirmation}
                                    type="button"
                                    title="Don't Close"
                                >
                                    Don't Close
                                </button>
                            </div>
                            <div className="modal-actions flex items-center justify-center margin-top--10 margin-bottom--10">
                                <button
                                    className="save margin-right-10"
                                    data-testid="modal-action-confirm-save"
                                    onClick={handleSaveAndClose}
                                    type="button"
                                    title="Save & Close"
                                >
                                    Save & Close
                                </button>
                                <button
                                    className="primary"
                                    data-testid="modal-action-confirm-close"
                                    onClick={handleCloseModal}
                                    type="button"
                                    title="Close"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                className="modal-action-cancel"
                                data-testid="modal-action-confirm-cancel"
                                onClick={hideConfirmation}
                                type="button"
                                title="Don't Close"
                            >
                                Don't Close
                            </button>
                            <button
                                className="modal-action-submit"
                                data-testid="modal-action-confirm-close"
                                onClick={handleCloseModal}
                                type="button"
                                title="Close"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
