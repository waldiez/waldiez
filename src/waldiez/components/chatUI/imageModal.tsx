/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";
import { FaX } from "react-icons/fa6";

export const ImageModal: React.FC<{
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
}> = ({ isOpen, imageUrl, onClose }) => {
    const [imageError, setImageError] = useState(false);
    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, [isOpen, onClose]);
    if (!isOpen || !imageUrl) {
        return null;
    }
    const onImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        event.stopPropagation();
    };
    const onImageError = () => {
        setImageError(true);
    };
    return (
        <div className={`image-modal ${isOpen ? "open" : ""}`} onClick={onClose} data-testid="modal-overlay">
            {imageError ? (
                <div className="modal-error-message">
                    <p>The image could not be displayed in full size.</p>
                    <p>It may still be available in the chat or might have been removed.</p>
                </div>
            ) : (
                <img
                    src={imageUrl}
                    alt="Fullscreen preview"
                    className="modal-image"
                    onClick={onImageClick}
                    onError={onImageError}
                />
            )}
            <button
                type="button"
                title="Close preview"
                className="modal-close"
                onClick={onClose}
                data-testid="modal-close"
            >
                <FaX size={12} />
            </button>
        </div>
    );
};
