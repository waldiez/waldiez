/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { FiPaperclip, FiX } from "react-icons/fi";
import { IoIosSend } from "react-icons/io";

import { ChatUI, Modal } from "@waldiez/components";
import { UserInputModalProps } from "@waldiez/containers/flow/modals/userInputModal/types";

export const UserInputModal = (props: UserInputModalProps) => {
    const { flowId, isOpen, inputPrompt, onUserInput } = props;
    const [textInput, setTextInput] = useState("");
    const [isFileSelectModalOpen, setIsFileSelectModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (isOpen) {
            setTextInput("");
            setImagePreview(null);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isOpen]);
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };
    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(event.target.value);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = "";
        setIsFileSelectModalOpen(false);
    };
    const clearImage = () => {
        setImagePreview(null);
    };
    const handleSubmit = () => {
        onUserInput?.({
            id: `${flowId}-${Date.now()}`,
            request_id: inputPrompt.request_id,
            type: "input_response",
            data: {
                text: textInput.trim() || null,
                image: imagePreview,
            },
        });
        setTextInput("");
        setImagePreview(null);
    };
    const handleClose = () => {
        onUserInput({
            id: `${flowId}-${Date.now()}`,
            type: "input_response",
            request_id: inputPrompt.request_id,
            data: {},
        });
        setTextInput("");
        setImagePreview(null);
    };
    const openFileSelectModal = () => {
        setIsFileSelectModalOpen(true);
    };
    const closeFileSelectModal = () => {
        setIsFileSelectModalOpen(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement, Event> | KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isFileSelectModalOpen) {
            handleClose();
        } else {
            setIsFileSelectModalOpen(false);
        }
    };

    return (
        <Modal
            title="User Input"
            isOpen={isOpen}
            onClose={handleClose}
            onCancel={handleCancel}
            className="user-input-modal"
            hasMaximizeBtn={false}
            dataTestId={`rf-${flowId}-user-input-modal`}
        >
            <div className="modal-body">
                {inputPrompt.previousMessages.length > 0 && (
                    <div className="chat-wrapper" data-flow-id={flowId}>
                        <ChatUI
                            messages={inputPrompt.previousMessages}
                            userParticipants={inputPrompt.userParticipants}
                        />
                    </div>
                )}
                <div className="input-prompt">{inputPrompt.prompt}</div>
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
                        id={`rf-${flowId}-user-input-modal-input`}
                        data-testid={`rf-${flowId}-user-input-modal-input`}
                        value={textInput}
                        onKeyDown={handleKeyDown}
                        onChange={handleTextChange}
                        className="chat-text-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        aria-label="User input"
                    />
                    <div className="chat-input-actions">
                        <label htmlFor={`rf-${flowId}-user-input-modal-image`} className="chat-upload-button">
                            <FiPaperclip size={18} />
                            <input
                                type="file"
                                aria-label="Upload an image"
                                id={`rf-${flowId}-user-input-modal-image`}
                                data-testid={`rf-${flowId}-user-input-modal-image`}
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
                            onClick={handleSubmit}
                            // let's allow empty messages to be sent
                            // disabled={!textInput.trim() && !imagePreview}
                            className="chat-send-button"
                            data-testid={`rf-${flowId}-user-input-modal-submit`}
                        >
                            <IoIosSend size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
