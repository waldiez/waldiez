/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
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

// Account for modal padding: header, borders, content padding
const MODAL_CHROME_WIDTH = 40;

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

    // Refs and local state for width management
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

    // Initial width locking when modal opens
    useLayoutEffect(() => {
        if (isOpen && modalRef.current && !lockedWidth) {
            const measureAndLockWidth = () => {
                if (modalRef.current) {
                    const width = modalRef.current.getBoundingClientRect().width;
                    if (width > 0) {
                        setLockedWidth(`${width}px`);

                        // Set initial tab count
                        const tabButtons = modalRef.current.querySelectorAll(".tab-btn");
                        setTabCount(tabButtons.length);
                    } else {
                        // Width still 0, try again next frame
                        requestAnimationFrame(measureAndLockWidth);
                    }
                }
            };

            requestAnimationFrame(measureAndLockWidth);
        }

        // Cleanup when modal closes
        if (!isOpen) {
            setLockedWidth(undefined);
            setTabCount(0);
        }
    }, [isOpen, lockedWidth]);

    // Check if modal needs to grow for new tabs
    const checkTabSpaceAndResize = useCallback(() => {
        if (!modalRef.current || !lockedWidth) {
            return;
        }

        const tabList = modalRef.current.querySelector(".tab-list") as HTMLElement;
        if (!tabList) {
            return;
        }

        const tabListWidth = tabList.scrollWidth;
        const currentModalWidth = parseFloat(lockedWidth);

        const requiredModalWidth = tabListWidth + MODAL_CHROME_WIDTH;

        if (requiredModalWidth > currentModalWidth) {
            setLockedWidth(`${requiredModalWidth}px`);
        }
    }, [lockedWidth]);

    // Monitor tab count changes and resize if needed
    useLayoutEffect(() => {
        if (isOpen && modalRef.current && lockedWidth) {
            const currentTabCount = modalRef.current.querySelectorAll(".tab-btn").length;

            if (currentTabCount !== tabCount) {
                setTabCount(currentTabCount);
                checkTabSpaceAndResize();
            }
        }
    }, [children, isOpen, tabCount, lockedWidth, checkTabSpaceAndResize]);

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
        </dialog>
    );
});

Modal.displayName = "Modal";
