/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from "react";
import { FiPaperclip, FiX } from "react-icons/fi";
import { IoIosSend } from "react-icons/io";

import { ChatUI, Modal } from "@waldiez/components";
import { ChatModalProps } from "@waldiez/containers/flow/modals/chatModal/types";

/**
 * Modal component for collecting user input with optional image upload
 */

export const ChatModal = memo((props: ChatModalProps) => {
    const { flowId, chat } = props;

    // State
    const [textInput, setTextInput] = useState("");
    const [isFileSelectModalOpen, setIsFileSelectModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Reset input fields and focus when modal opens
    useEffect(() => {
        if (chat?.showUI) {
            setTextInput("");
            setImagePreview(null);

            // Focus input after render
            setTimeout(() => {
                if (chat.activeRequest?.request_id) {
                    inputRef.current?.focus();
                }
            }, 0);
        }
    }, [chat]);

    /**
     * Create an input response object with current data
     */
    const createInputResponse = useCallback(
        (includeData = true) => {
            const data = [];
            if (includeData) {
                data.push({
                    content: {
                        type: "text" as const,
                        text: textInput.trim(),
                    },
                });
                if (imagePreview) {
                    data.push({
                        content: {
                            type: "image_url" as const,
                            image_url: { url: imagePreview },
                        },
                    });
                }
            }
            return {
                id: `${flowId}-${Date.now()}`,
                request_id: chat?.activeRequest?.request_id || "",
                type: "input_response" as const,
                timestamp: new Date().toISOString(),
                data,
            };
        },
        [flowId, chat?.activeRequest, textInput, imagePreview],
    );

    /**
     * Submit user input
     */
    const handleSubmit = useCallback(() => {
        chat?.handlers?.onUserInput?.(createInputResponse());

        setTimeout(() => {
            // Reset input state
            setTextInput("");
            setImagePreview(null);
        }, 10);
    }, [chat?.handlers?.onUserInput, createInputResponse]);

    /**
     * Handle keyboard events
     */
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit],
    );

    /**
     * Handle text input changes
     */
    const handleTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(event.target.value);
    }, []);

    /**
     * Handle image file selection
     */
    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }

        // Reset the input value to allow selecting the same file again
        event.target.value = "";
        setIsFileSelectModalOpen(false);
    }, []);

    /**
     * Clear selected image
     */
    const clearImage = useCallback(() => {
        setImagePreview(null);
    }, []);

    /**
     * Close modal
     */
    const handleClose = useCallback(() => {
        // Reset input state
        setTextInput("");
        setImagePreview(null);
        chat?.handlers?.onClose?.();
    }, []);

    /**
     * Handle file select modal interactions
     */
    const openFileSelectModal = useCallback(() => {
        setIsFileSelectModalOpen(true);
    }, []);

    const closeFileSelectModal = useCallback(() => {
        setIsFileSelectModalOpen(false);

        // Focus back on text input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, []);

    /**
     * Handle modal cancel
     */
    const handleCancel = useCallback(
        (event: React.SyntheticEvent<HTMLDialogElement, Event> | KeyboardEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (isFileSelectModalOpen) {
                setIsFileSelectModalOpen(false);
            } else {
                handleClose();
            }
        },
        [isFileSelectModalOpen, handleClose],
    );

    // Generate unique IDs for accessibility
    const inputId = `rf-${flowId}-chat-modal-input`;
    const imageInputId = `rf-${flowId}-chat-modal-image`;
    const modalTestId = `rf-${flowId}-chat-modal`;
    const isModalOpen = chat?.showUI === true || (chat !== undefined && chat.messages.length > 0);

    return (
        <Modal
            id={modalTestId}
            title="Chat"
            isOpen={isModalOpen}
            onClose={handleClose}
            onCancel={handleCancel}
            className="chat-modal"
            hasMaximizeBtn={true}
            hasCloseBtn={chat?.showUI === false}
            dataTestId={modalTestId}
        >
            <div className="modal-body">
                {chat?.messages && chat.messages.length > 0 && (
                    <div className="chat-wrapper" data-flow-id={flowId}>
                        <ChatUI
                            messages={chat.messages}
                            userParticipants={chat.userParticipants}
                            activeRequest={chat.activeRequest}
                        />
                    </div>
                )}

                <div className="input-prompt">{chat?.activeRequest?.prompt}</div>

                <div className="chat-input-container">
                    {imagePreview && (
                        <div className="chat-image-preview">
                            <div className="chat-image-wrapper">
                                <img src={imagePreview} alt="Preview" className="chat-preview-image" />
                                <button
                                    type="button"
                                    className="chat-remove-image-button"
                                    onClick={clearImage}
                                    title="Remove Image"
                                    aria-label="Remove uploaded image"
                                >
                                    <FiX size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        type="text"
                        ref={inputRef}
                        placeholder="Enter your message here"
                        id={inputId}
                        data-testid={inputId}
                        value={textInput}
                        disabled={chat?.activeRequest?.request_id === undefined}
                        onKeyDown={handleKeyDown}
                        onChange={handleTextChange}
                        className="chat-text-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        aria-label="User input"
                    />

                    <div className="chat-input-actions">
                        <label htmlFor={imageInputId} className="chat-upload-button">
                            <FiPaperclip size={18} aria-hidden="true" />
                            <span className="hidden">Upload an image</span>
                            <input
                                type="file"
                                disabled={chat?.activeRequest?.request_id === undefined}
                                aria-label="Upload an image"
                                id={imageInputId}
                                data-testid={imageInputId}
                                accept="image/*"
                                className="chat-upload-input"
                                onChange={handleImageChange}
                                onClick={openFileSelectModal}
                                onBlur={closeFileSelectModal}
                            />
                        </label>

                        <button
                            type="button"
                            title="Send"
                            disabled={chat?.activeRequest?.request_id === undefined}
                            onClick={handleSubmit}
                            className="chat-send-button"
                            data-testid={`rf-${flowId}-chat-modal-submit`}
                            aria-label="Send message"
                        >
                            <IoIosSend size={20} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
});

ChatModal.displayName = "ChatModal";
