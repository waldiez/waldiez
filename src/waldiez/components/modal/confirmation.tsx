/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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
                            <div className="modal-actions flex-center margin-top--10 margin-bottom--10">
                                <button
                                    className="modal-action-cancel"
                                    data-testid="modal-action-confirm-cancel"
                                    onClick={hideConfirmation}
                                    type="button"
                                    title="Don't Close"
                                >
                                    Don't Close
                                </button>
                            </div>
                            <div className="modal-actions flex-center margin-top--10 margin-bottom--10">
                                <button
                                    className="modal-action-submit margin-right-20"
                                    data-testid="modal-action-confirm-save"
                                    onClick={handleSaveAndClose}
                                    type="button"
                                    title="Save & Close"
                                >
                                    Save & Close
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
