/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useEffect, useRef, useState } from "react";
import { FaCircleXmark, FaCompress, FaExpand } from "react-icons/fa6";

type ModalProps = {
    id?: string;
    dataTestId?: string;
    beforeTitle?: string | React.ReactNode;
    title: string | React.ReactNode;
    isOpen: boolean;
    hasCloseBtn?: boolean;
    hasMaximizeBtn?: boolean;
    onClose?: () => void;
    onSaveAndClose?: () => void;
    onCancel?: (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => void;
    children: React.ReactNode;
    className?: string;
    hasUnsavedChanges?: boolean;
    preventCloseIfUnsavedChanges?: boolean;
};

export const Modal: React.FC<ModalProps> = ({
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
    onCancel,
    children,
    className,
}) => {
    const modalRef = useRef<HTMLDialogElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isFullScreen, setFullScreen] = useState(false);
    const [position, setPosition] = useState({ x: 10, y: 50 });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const cannotClose = preventCloseIfUnsavedChanges && hasUnsavedChanges;
    const canClose = !cannotClose;

    const resetModalState = () => {
        setPosition({ x: 0, y: 0 });
        setFullScreen(false);
        if (modalRef.current) {
            modalRef.current.style.width = "";
            modalRef.current.style.height = "";
        }
        setPosition({ x: 10, y: 50 });
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
    const onToggleFullScreen = () => {
        setFullScreen(prev => !prev);
    };
    const handleCloseModal = () => {
        if (cannotClose && !showConfirmation) {
            setShowConfirmation(true);
            return;
        }
        resetModalState();
        onClose?.();
        setModalOpen(false);
    };
    const handleSaveAndClose = () => {
        resetModalState();
        onSaveAndClose?.();
        setModalOpen(false);
    };
    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape" && canClose) {
            handleCancel(event);
        }
    };
    const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => {
        if (onCancel) {
            onCancel(event);
        } else {
            event.preventDefault();
            event.stopPropagation();
            handleCloseModal();
        }
    };
    const hideConfirmation = () => {
        setShowConfirmation(false);
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!modalRef.current) {
            return;
        }
        setDragging(true);
        const style = window.getComputedStyle(modalRef.current);
        const left = parseInt(style.left, 10) || 0;
        const top = parseInt(style.top, 10) || 0;
        setOffset({ x: e.clientX - left, y: e.clientY - top });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) {
            return;
        }
        setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseUp = () => setDragging(false);

    useEffect(() => {
        if (dragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    useEffect(() => {
        setModalOpen(isOpen);
    }, [isOpen]);

    const noInteraction = "no-wheel no-pan no-drag";
    return (
        <dialog
            ref={modalRef}
            id={id}
            data-testid={dataTestId ?? "modal-dialog"}
            onKeyDown={onKeyDown}
            onCancel={handleCancel}
            className={`modal ${noInteraction} ${isFullScreen && "modal-fullscreen"} ${className || ""} ${showConfirmation && "confirmation"}`}
            style={!isFullScreen ? { top: position.y, left: position.x } : undefined}
        >
            <div className="modal-header" ref={dragRef} onMouseDown={handleMouseDown}>
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
            <div className="modal-content">
                {!showConfirmation && children}
                {showConfirmation && (
                    <div className="modal-confirmation padding-10">
                        <div className="modal-confirmation-content">
                            <h4 className="warning">
                                Are you sure you want to close this modal? Any unsaved changes will be lost.
                            </h4>
                            <div className="modal-actions">
                                {onSaveAndClose ? (
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
                                ) : (
                                    <button
                                        className="modal-action-cancel"
                                        data-testid="modal-action-confirm-cancel"
                                        onClick={hideConfirmation}
                                        type="button"
                                        title="Don't Close"
                                    >
                                        Don't Close
                                    </button>
                                )}
                                {onSaveAndClose ? (
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
