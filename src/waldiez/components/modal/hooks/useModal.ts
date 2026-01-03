/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type RefObject,
    type SyntheticEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

export const useModal = (props: {
    isOpen: boolean;
    hasUnsavedChanges?: boolean;
    preventCloseIfUnsavedChanges?: boolean;
    onClose?: () => void;
    onSaveAndClose?: () => void;
    onCancel?: (
        event: SyntheticEvent<HTMLDialogElement | HTMLDivElement, Event> | ReactKeyboardEvent,
    ) => void;
    modalRef: RefObject<HTMLDialogElement | HTMLDivElement | null>;
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
    const [position, setPosition] = useState<{ x: string | number; y: string | number }>({
        x: window.innerWidth / 4,
        y: "20px",
    });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [preMinimizeHeight, setPreMinimizeHeight] = useState<string>("");
    const [preMinimizePosition, setPreMinimizePosition] = useState<{
        x: string | number;
        y: string | number;
    } | null>(null);

    // Derived state
    const cannotClose = preventCloseIfUnsavedChanges && hasUnsavedChanges;
    const canClose = !cannotClose;

    // Reset modal state to defaults
    const resetModalState = useCallback(() => {
        setPosition({ x: window.innerWidth / 4, y: "20px" });
        setFullScreen(false);
        setMinimized(false);
        setShowConfirmation(false);
        setPreMinimizePosition(null);

        if (modalRef.current) {
            modalRef.current.style.width = "";
            modalRef.current.style.height = "";
        }
    }, [modalRef]);

    // Control modal open/close state (for dialog compatibility)
    const setModalOpen = useCallback(
        (open: boolean) => {
            const modalElement = modalRef.current;
            if (!modalElement) {
                return;
            }
            if (Object.prototype.hasOwnProperty.call(modalElement, "showModal")) {
                if (open) {
                    (modalElement as HTMLDialogElement).showModal();
                } else {
                    (modalElement as HTMLDialogElement).close();
                }
            }
        },
        [modalRef],
    );

    // Toggle fullscreen mode
    const onToggleFullScreen = useCallback(() => {
        if (isMinimized) {
            // Exit minimized state when maximizing
            setMinimized(false);
            if (modalRef.current) {
                modalRef.current.style.height = preMinimizeHeight || "";
            }
            // Restore position when exiting minimize
            if (preMinimizePosition) {
                setPosition(preMinimizePosition);
                setPreMinimizePosition(null);
            }
        }
        setFullScreen(prev => !prev);
    }, [modalRef, isMinimized, preMinimizeHeight, preMinimizePosition]);

    // Toggle minimized mode
    const onToggleMinimize = useCallback(() => {
        if (isFullScreen && !isMinimized) {
            // Exit fullscreen when minimizing
            setFullScreen(false);
        }

        setMinimized(prev => {
            if (!prev) {
                // Save current height and position before minimizing
                if (modalRef.current) {
                    setPreMinimizeHeight(
                        modalRef.current.style.height || window.getComputedStyle(modalRef.current).height,
                    );
                }
                setPreMinimizePosition({ ...position });
            } else {
                // Restore height and position when un-minimizing
                if (modalRef.current && preMinimizeHeight) {
                    modalRef.current.style.height = preMinimizeHeight;
                }
                if (preMinimizePosition) {
                    setPosition(preMinimizePosition);
                }
            }
            return !prev;
        });
    }, [modalRef, isMinimized, isFullScreen, preMinimizeHeight, position, preMinimizePosition]);

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
    }, [
        isMinimized,
        cannotClose,
        showConfirmation,
        onToggleMinimize,
        resetModalState,
        onClose,
        setModalOpen,
    ]);

    // Handle save and close
    const handleSaveAndClose = useCallback(() => {
        resetModalState();
        onSaveAndClose?.();
        setModalOpen(false);
    }, [resetModalState, onSaveAndClose, setModalOpen]);

    // Handle cancel event
    const handleCancel = useCallback(
        (event: SyntheticEvent<HTMLDialogElement | HTMLDivElement, Event> | ReactKeyboardEvent) => {
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
        (event: ReactKeyboardEvent) => {
            if (event.key === "Escape" && canClose) {
                handleCancel(event);
            }
        },
        [canClose, handleCancel],
    );

    // Drag handlers
    const onMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            if (!modalRef.current || isFullScreen || isMinimized) {
                return;
            }

            setDragging(true);

            const rect = modalRef.current.getBoundingClientRect();
            setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        },
        [isFullScreen, isMinimized, modalRef],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragging || !modalRef.current) {
                return;
            }

            const newX = e.clientX - offset.x;
            const newY = e.clientY - offset.y;

            // Ensure modal stays within viewport bounds
            const modalRect = modalRef.current.getBoundingClientRect();
            const maxX = window.innerWidth - modalRect.width;
            const maxY = window.innerHeight - modalRect.height;

            setPosition({
                x: `${Math.max(0, Math.min(newX, maxX))}px`,
                y: `${Math.max(0, Math.min(newY, maxY))}px`,
            });
        },
        [dragging, offset, modalRef],
    );

    const handleMouseUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Effect for drag event listeners
    useEffect(() => {
        if (dragging) {
            document.addEventListener("mousemove", handleMouseMove, { passive: true });
            document.addEventListener("mouseup", handleMouseUp, { passive: true });
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
