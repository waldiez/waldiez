/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useState } from "react";

export const useModal = (props: {
    isOpen: boolean;
    hasUnsavedChanges?: boolean;
    preventCloseIfUnsavedChanges?: boolean;
    onClose?: () => void;
    onSaveAndClose?: () => void;
    onCancel?: (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => void;
    modalRef: React.RefObject<HTMLDialogElement | null>;
}) => {
    const {
        isOpen,
        hasUnsavedChanges = false,
        preventCloseIfUnsavedChanges = false,
        onClose,
        onSaveAndClose,
        onCancel,
        modalRef,
    } = props;
    // State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isFullScreen, setFullScreen] = useState(false);
    const [isMinimized, setMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 10, y: 20 });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [preMinimizeHeight, setPreMinimizeHeight] = useState<string>("");

    // Derived state
    const cannotClose = preventCloseIfUnsavedChanges && hasUnsavedChanges;
    const canClose = !cannotClose;

    // Reset modal state to defaults
    const resetModalState = useCallback(() => {
        setPosition({ x: 10, y: 50 });
        setFullScreen(false);
        setMinimized(false);
        setShowConfirmation(false);

        if (modalRef.current) {
            modalRef.current.style.width = "";
            modalRef.current.style.height = "";
        }
    }, []);

    // Control modal open/close state
    const setModalOpen = useCallback((open: boolean) => {
        const modalElement = modalRef.current;
        if (!modalElement) {
            return;
        }

        if (open) {
            modalElement.showModal();
        } else {
            modalElement.close();
        }
    }, []);

    // Toggle fullscreen mode
    const onToggleFullScreen = useCallback(() => {
        if (isMinimized) {
            // Exit minimized state when maximizing
            setMinimized(false);
            if (modalRef.current) {
                modalRef.current.style.height = preMinimizeHeight || "";
            }
        }
        setFullScreen(prev => !prev);
    }, [isMinimized, preMinimizeHeight]);

    // Toggle minimized mode
    const onToggleMinimize = useCallback(() => {
        if (isFullScreen && !isMinimized) {
            // Exit fullscreen when minimizing
            setFullScreen(false);
        }

        setMinimized(prev => {
            if (!prev) {
                // Save current height before minimizing
                if (modalRef.current) {
                    setPreMinimizeHeight(
                        modalRef.current.style.height || window.getComputedStyle(modalRef.current).height,
                    );
                }
            } else {
                // Restore height when un-minimizing
                if (modalRef.current && preMinimizeHeight) {
                    modalRef.current.style.height = preMinimizeHeight;
                }
            }
            return !prev;
        });
    }, [isFullScreen, preMinimizeHeight]);

    // Hide confirmation dialog
    const hideConfirmation = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    // Handle modal closing
    const handleCloseModal = useCallback(() => {
        if (cannotClose && !showConfirmation) {
            setShowConfirmation(true);
            if (isMinimized) {
                onToggleMinimize();
            }
            return;
        }

        resetModalState();
        onClose?.();
        setModalOpen(false);
    }, [isMinimized, cannotClose, showConfirmation, resetModalState, onClose, setModalOpen]);

    // Handle save and close
    const handleSaveAndClose = useCallback(() => {
        resetModalState();
        onSaveAndClose?.();
        setModalOpen(false);
    }, [resetModalState, onSaveAndClose, setModalOpen]);

    // Handle cancel event
    const handleCancel = useCallback(
        (event: React.SyntheticEvent<HTMLDialogElement, Event> | React.KeyboardEvent) => {
            if (onCancel) {
                onCancel(event);
            } else {
                event.preventDefault();
                event.stopPropagation();
                handleCloseModal();
            }
        },
        [onCancel, handleCloseModal],
    );

    // Handle keyboard events
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Escape" && canClose) {
                handleCancel(event);
            }
        },
        [canClose, handleCancel],
    );

    // Drag handlers
    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!modalRef.current || isFullScreen) {
                return;
            }

            setDragging(true);

            const style = window.getComputedStyle(modalRef.current);
            const left = parseInt(style.left, 10) || 0;
            const top = parseInt(style.top, 10) || 0;

            setOffset({
                x: e.clientX - left,
                y: e.clientY - top,
            });
        },
        [isFullScreen],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragging) {
                return;
            }

            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        },
        [dragging, offset],
    );

    const handleMouseUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Effect for drag event listeners
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
    }, [dragging, handleMouseMove, handleMouseUp]);

    // Effect to open/close the modal when isOpen changes
    useEffect(() => {
        // console.log("Modal open state changed:", isOpen);
        setModalOpen(isOpen);
    }, [isOpen, setModalOpen]);

    return {
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
    };
};
