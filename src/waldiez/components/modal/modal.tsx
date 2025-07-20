/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { FaChevronDown, FaChevronUp, FaCircleXmark, FaCompress, FaExpand } from "react-icons/fa6";

import { renderConfirmationContent } from "@waldiez/components/modal/confirmation";
import { useModal } from "@waldiez/components/modal/hooks";

type ModalProps = {
    id?: string;
    flowId: string;
    dataTestId?: string;
    beforeTitle?: string | React.ReactNode;
    title: string | React.ReactNode;
    isOpen: boolean;
    hasCloseBtn?: boolean;
    hasMaximizeBtn?: boolean;
    hasMinimizeBtn?: boolean;
    onClose?: () => void;
    onSaveAndClose?: () => void;
    onCancel?: (
        event: React.SyntheticEvent<HTMLDivElement | HTMLDialogElement, Event> | React.KeyboardEvent,
    ) => void;
    children: React.ReactNode;
    className?: string;
    hasUnsavedChanges?: boolean;
    preventCloseIfUnsavedChanges?: boolean;
    noHeader?: boolean;
};

// Account for modal padding: header, borders, content padding
const MODAL_CHROME_WIDTH = 40;

export const Modal = forwardRef<{ close: () => void; showModal: () => void }, ModalProps>((props, ref) => {
    const [isInternallyOpen, setIsInternallyOpen] = useState(props.isOpen);

    // Expose dialog-like methods
    useImperativeHandle(ref, () => ({
        close: () => {
            setIsInternallyOpen(false);
            props.onClose?.();
        },
        showModal: () => {
            setIsInternallyOpen(true);
        },
    }));

    // Reset when external prop changes
    useEffect(() => {
        if (props.isOpen) {
            setIsInternallyOpen(true);
        }
    }, [props.isOpen]);
    const {
        id,
        flowId,
        isOpen,
        dataTestId = "modal-dialog",
        beforeTitle,
        title,
        hasCloseBtn = true,
        hasMaximizeBtn = true,
        hasMinimizeBtn = true,
        children,
        className = "",
        hasUnsavedChanges,
        onSaveAndClose,
    } = props;

    // Refs and local state for width management
    const modalRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<HTMLDivElement | null>(null);
    const [lockedWidth, setLockedWidth] = useState<string | undefined>(undefined);
    const [tabCount, setTabCount] = useState(0);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

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

    // Create portal container
    useEffect(() => {
        const container = document.getElementById("modal-root") || document.body;
        setPortalContainer(container);
    }, []);

    // Handle escape key and click outside (only when not minimized)
    useEffect(() => {
        if (!isOpen || isMinimized) {
            return;
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleCancel(e as any);
            }
        };

        // const handleClickOutside = (e: MouseEvent) => {
        //     if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        //         handleCancel(e as any);
        //     }
        // };

        document.addEventListener("keydown", handleEscape);
        // document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleEscape);
            // document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, isMinimized, handleCancel]);

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
        isFullScreen ? "modal-fullscreen" : "no-wheel no-pan no-drag",
        isMinimized ? "modal-minimized" : "no-wheel no-pan no-drag",
        showConfirmation ? "confirmation no-wheel no-pan no-drag" : "no-wheel no-pan no-drag",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (!isOpen || !portalContainer || !isInternallyOpen) {
        return null;
    }

    // Compute modal position
    const modalStyle = {
        ...(lockedWidth ? { width: lockedWidth } : {}),
        ...(isFullScreen
            ? {}
            : isMinimized
              ? {
                    position: "fixed" as const,
                    bottom: "20px",
                    right: "20px",
                    top: "auto",
                    left: "auto",
                }
              : {
                    top: position.y,
                    left: position.x,
                }),
    };

    const modalContent = (
        <div id={`${flowId}-modal`} className="modal-root">
            {/* Modal backdrop */}
            {!isMinimized && !isFullScreen && !className.includes("modal-fullscreen") && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 999,
                    }}
                />
            )}
            {/* Backdrop - only show when not minimized */}
            {!isMinimized && !isFullScreen && !className.includes("modal-fullscreen") && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 999,
                    }}
                />
            )}
            {/* Modal */}
            <div
                ref={modalRef}
                id={id}
                data-testid={dataTestId}
                onKeyDown={onKeyDown}
                className={modalClasses}
                style={modalStyle}
            >
                {!props.noHeader && (
                    <div className="modal-header" ref={dragRef} onMouseDown={onMouseDown}>
                        {!isMinimized && beforeTitle && <div>{beforeTitle}</div>}
                        <h3 className="modal-title font-semibold truncate">
                            {title}
                            {hasUnsavedChanges && (
                                <span style={{ color: "#f97316", marginLeft: "0.25rem" }}>*</span>
                            )}
                        </h3>
                        <div className="modal-header-actions">
                            {hasMinimizeBtn && (
                                <div
                                    className="modal-minimize-btn clickable"
                                    role="button"
                                    title={isMinimized ? "Restore" : "Minimize"}
                                    onClick={onToggleMinimize}
                                >
                                    {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
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
                )}
                {/* Confirmation content or main content */}
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
        </div>
    );

    return createPortal(modalContent, portalContainer);
});

Modal.displayName = "Modal";
