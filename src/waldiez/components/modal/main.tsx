/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp, FaCircleXmark, FaCompress, FaExpand } from "react-icons/fa6";

import { renderConfirmationContent } from "@waldiez/components/modal/confirmation";
import { useModal } from "@waldiez/components/modal/hooks";

type ModalProps = {
    id?: string;
    dataTestId?: string;
    beforeTitle?: string | React.ReactNode;
    title: string | React.ReactNode;
    isOpen: boolean;
    hasCloseBtn?: boolean;
    hasMaximizeBtn?: boolean;
    hasMinimizeBtn?: boolean;
    onClose?: () => void;
    onSaveAndClose?: () => void;
    onCancel?: (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => void;
    children: React.ReactNode;
    className?: string;
    hasUnsavedChanges?: boolean;
    preventCloseIfUnsavedChanges?: boolean;
};

/**
 * Draggable and resizable modal component with confirmation dialog for unsaved changes
 * @param props - Props for the Modal component
 * @param props.id - Optional ID for the modal
 * @param props.dataTestId - Optional data-testid for testing
 * @param props.beforeTitle - Optional content to display before the title
 * @param props.title - Title of the modal
 * @param props.isOpen - Boolean indicating if the modal is open
 * @param props.hasCloseBtn - Boolean indicating if the close button is visible
 * @param props.hasMaximizeBtn - Boolean indicating if the maximize button is visible
 * @param props.hasMinimizeBtn - Boolean indicating if the minimize button is visible
 * @param props.onClose - Callback function for closing the modal
 * @param props.onSaveAndClose - Callback function for saving and closing the modal
 * @param props.onCancel - Callback function for canceling the modal
 * @param props.children - Content to display inside the modal
 * @param props.className - Optional additional CSS classes for the modal
 * @param props.hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param props.preventCloseIfUnsavedChanges - Boolean indicating if the modal should prevent closing if there are unsaved changes
 */
export const Modal = memo<ModalProps>(props => {
    const {
        id,
        isOpen,
        dataTestId = "modal-dialog",
        beforeTitle,
        title,
        hasCloseBtn = true,
        hasMaximizeBtn = true,
        hasMinimizeBtn = true,
        children,
        className = "",
        onSaveAndClose,
    } = props;
    // Refs
    const modalRef = useRef<HTMLDialogElement | null>(null);
    const dragRef = useRef<HTMLDivElement | null>(null);
    const [lockedWidth, setLockedWidth] = useState<string | undefined>(undefined);
    const [tabCount, setTabCount] = useState(0);

    const {
        showConfirmation,
        isFullScreen,
        isMinimized,
        position,
        hideConfirmation,
        onToggleFullScreen,
        onToggleMinimize,
        handleCloseModal,
        handleSaveAndClose,
        handleCancel,
        onKeyDown,
        onMouseDown,
    } = useModal({ ...props, modalRef });

    // Handle modal open/close state
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.showModal();
        } else {
            modalRef.current?.close();
        }
    }, [isOpen]);

    // Lock width on first render
    useLayoutEffect(() => {
        if (isOpen && modalRef.current && !lockedWidth) {
            const measure = () => {
                if (modalRef.current) {
                    const width = modalRef.current.getBoundingClientRect().width;
                    const tabButtons = modalRef.current.querySelectorAll(".tab-btn");
                    setLockedWidth(`${width}px`);
                    setTabCount(tabButtons.length);
                }
            };
            const raf = requestAnimationFrame(measure);
            return () => cancelAnimationFrame(raf);
        }

        if (!isOpen) {
            setLockedWidth(undefined);
            setTabCount(0);
        }
    }, [isOpen, lockedWidth]);

    const resizeBasedOnTabsList = useCallback(
        (tabList: HTMLElement) => {
            if (!modalRef.current || !tabList || !lockedWidth) {
                return;
            }
            const tabListWidth = tabList.scrollWidth;
            const currentModalWidth = parseFloat(lockedWidth);
            const modalPadding = 20;
            const requiredModalWidth = tabListWidth + modalPadding;

            if (requiredModalWidth > currentModalWidth) {
                // Tabs need more space - resize modal
                setLockedWidth(`${requiredModalWidth}px`);
            }
        },
        [lockedWidth],
    );

    useLayoutEffect(() => {
        if (isOpen && modalRef.current && lockedWidth) {
            const currentTabCount = modalRef.current.querySelectorAll(".tab-btn").length;

            if (currentTabCount !== tabCount) {
                // Get the actual width needed by the tab list
                const tabList = modalRef.current.querySelector(".tab-list") as HTMLElement;
                if (tabList) {
                    resizeBasedOnTabsList(tabList);
                } else {
                    modalRef.current.style.width = "";
                    const naturalWidth = modalRef.current.getBoundingClientRect().width;
                    const currentWidth = parseFloat(lockedWidth);

                    if (naturalWidth > currentWidth) {
                        setLockedWidth(`${naturalWidth}px`);
                    }
                }
                setTabCount(currentTabCount);
            }
        }
    }, [children, isOpen, tabCount, lockedWidth, resizeBasedOnTabsList]);

    // Handle manual resizing
    useLayoutEffect(() => {
        if (isOpen && modalRef.current && lockedWidth) {
            const resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    if (entry.target === modalRef.current) {
                        // Guard against jsdom/test environment
                        const newWidth = entry.contentRect?.width;
                        if (newWidth !== undefined) {
                            setLockedWidth(`${newWidth}px`);
                        }
                    }
                }
            });

            resizeObserver.observe(modalRef.current);
            return () => resizeObserver.disconnect();
        }
    }, [isOpen, lockedWidth]);

    // Compute CSS classes
    const modalClasses = [
        "modal",
        "no-wheel no-pan no-drag",
        isFullScreen ? "modal-fullscreen" : "",
        isMinimized ? "modal-minimized" : "",
        showConfirmation ? "confirmation" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <dialog
            ref={modalRef}
            id={id}
            data-testid={dataTestId}
            onKeyDown={onKeyDown}
            onCancel={handleCancel}
            className={modalClasses}
            style={{
                ...(lockedWidth ? { width: lockedWidth } : {}),
                ...(isFullScreen ? {} : { top: position.y, left: position.x }),
            }}
        >
            <div className="modal-wrapper">
                <div className="modal-header" ref={dragRef} onMouseDown={onMouseDown}>
                    <div>{beforeTitle}</div>
                    <h3 className="modal-title">{title}</h3>
                    <div className="modal-header-actions">
                        {hasMinimizeBtn && (
                            <div
                                className="modal-minimize-btn clickable"
                                role="button"
                                title={isMinimized ? "Restore" : "Minimize"}
                                onClick={onToggleMinimize}
                            >
                                {isMinimized ? <FaChevronDown /> : <FaChevronUp />}
                            </div>
                        )}
                        {hasMaximizeBtn && (
                            <div
                                className="modal-fullscreen-btn clickable"
                                role="button"
                                title={isFullScreen ? "Restore" : "Maximize"}
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
                <div className={`modal-content ${isMinimized ? "hidden" : ""}`}>
                    {showConfirmation
                        ? renderConfirmationContent({
                              onSaveAndClose,
                              hideConfirmation,
                              handleSaveAndClose,
                              handleCloseModal,
                          })
                        : children}
                </div>
            </div>
        </dialog>
    );
});

Modal.displayName = "Modal";
