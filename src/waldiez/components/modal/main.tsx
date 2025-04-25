/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useEffect, useRef, useState } from "react";
import { FaCircleXmark, FaCompress, FaExpand } from "react-icons/fa6";

import { ModalProps } from "@waldiez/components/modal/types";

export const Modal = (props: ModalProps) => {
    const {
        id,
        dataTestId,
        beforeTitle,
        title,
        isOpen,
        hasCloseBtn = true,
        hasMaximizeBtn = true,
        hasUnsavedChanges = false,
        preventCloseIfUnsavedChanges = false,
        onClose,
        onSaveAndClose,
        children,
        className,
    } = props;
    const [isFullScreen, setFullScreen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const modalRef = useRef<HTMLDialogElement | null>(null);
    useEffect(() => {
        setFullScreen(false);
        setShowConfirmation(false);
        setModalOpen(isOpen);
    }, [isOpen]);
    const cannotClose = preventCloseIfUnsavedChanges && hasUnsavedChanges;
    const canClose = !cannotClose;
    const handleCloseModal = () => {
        if (cannotClose && !showConfirmation) {
            setShowConfirmation(true);
            return;
        }
        if (onClose) {
            onClose();
        }
        setModalOpen(false);
    };
    const handleSaveAndClose = () => {
        if (onSaveAndClose) {
            onSaveAndClose();
        }
        setModalOpen(false);
    };
    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape" && canClose) {
            onCancel(event);
        }
    };

    const onCancel = (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        handleCloseModal();
    };

    const onToggleFullScreen = () => {
        setFullScreen(!isFullScreen);
    };

    const hideConfirmation = () => {
        setShowConfirmation(false);
    };

    const setModalOpen = (open: boolean) => {
        const modalElement = modalRef.current;
        if (modalElement) {
            if (open) {
                modalElement.showModal();
            } else {
                modalElement.close();
            }
        }
    };
    const noInteraction = isOpen ? "no-wheel no-pan no-drag" : "";
    return (
        <dialog
            ref={modalRef}
            id={id}
            data-testid={dataTestId ?? "modal-dialog"}
            onKeyDown={onKeyDown}
            onCancel={onCancel}
            className={`modal ${noInteraction} ${isFullScreen ? "fullscreen" : ""} ${className ?? ""}`}
        >
            <div className="modal-content">
                <div className="modal-header">
                    <div>{beforeTitle ?? ""}</div>
                    <h3 className="modal-title">{title}</h3>
                    <div className="modal-header-actions">
                        {hasMaximizeBtn && (
                            <div
                                className="modal-fullscreen-btn clickable"
                                role="button"
                                title={isFullScreen ? "Minimize" : "Maximize"}
                                onClick={onToggleFullScreen}
                            >
                                {isFullScreen ? <FaCompress /> : <FaExpand />}
                            </div>
                        )}
                        {hasCloseBtn && (
                            <div
                                className="modal-close-btn clickable"
                                role="button"
                                title="Close"
                                data-testid="modal-close-btn"
                                onClick={handleCloseModal}
                            >
                                <FaCircleXmark />
                            </div>
                        )}
                    </div>
                </div>
                {/* {children} */}
                {!showConfirmation && children}
                {showConfirmation && (
                    <div className="modal-confirmation padding-10">
                        <div className="modal-confirmation-content">
                            <h4 className="warning">
                                Are you sure you want to close this modal? Any unsaved changes will be lost.
                            </h4>
                            <div className="modal-actions">
                                <button
                                    className="modal-action-cancel"
                                    data-testid="modal-action-confirm-cancel"
                                    onClick={hideConfirmation}
                                    type="button"
                                    title="Don't Close"
                                >
                                    Don't Close
                                </button>
                                {onSaveAndClose ? (
                                    <div className="modal-actions flex-center">
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
                                ) : (
                                    <button
                                        className="modal-action-submit"
                                        data-testid="modal-action-confirm-close"
                                        onClick={handleCloseModal}
                                        type="button"
                                        title="Close"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </dialog>
    );
};
