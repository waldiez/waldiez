/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { FiPaperclip, FiX } from "react-icons/fi";
import { IoIosSend } from "react-icons/io";

import { Modal } from "@waldiez/components";
import { UserInputModalProps } from "@waldiez/containers/flow/modals/userInputModal/types";
import { WaldiezPreviousMessage } from "@waldiez/types";

export const UserInputModal = (props: UserInputModalProps) => {
    const { flowId, isOpen, inputPrompt, onUserInput } = props;
    const [textInput, setTextInput] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (isOpen && inputPrompt.previousMessages.length > 0) {
            const messagesRoot = document.querySelector(`.console-messages[data-flow-id="${flowId}"]`);
            if (messagesRoot) {
                const console = messagesRoot.querySelectorAll(".console-message");
                if (console && console.length > 0) {
                    const lastMessage = console[console.length - 1];
                    if (lastMessage) {
                        lastMessage.scrollIntoView();
                    }
                }
            }
        }
        onOpenModalChange();
    }, [isOpen]);
    const onOpenModalChange = () => {
        if (isOpen) {
            setTextInput("");
            setImagePreview(null);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };
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
    const handlePreviousMessage = (message: WaldiezPreviousMessage) => {
        // TODO: handle different message types
        if (typeof message.data === "string") {
            return message.data;
        }
        if (typeof message.data === "object") {
            return Object.entries(message.data)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
        }
        return "";
    };
    const handleClose = () => {
        onUserInput({
            id: `${flowId}-${Date.now()}`,
            type: "input_response",
            request_id: inputPrompt.request_id,
            data: {
                text: "",
            },
        });
        setTextInput("");
        setImagePreview(null);
    };

    return (
        <Modal
            title="User Input"
            isOpen={isOpen}
            onClose={handleClose}
            className="user-input-modal"
            hasMaximizeBtn={false}
            dataTestId={`rf-${flowId}-user-input-modal`}
        >
            <div className="modal-body">
                {inputPrompt.previousMessages.length > 0 && (
                    <div className="console">
                        <div className="console-messages" data-flow-id={flowId}>
                            {inputPrompt.previousMessages.map((message, index) => (
                                <div className="console-message" key={index} data-testid="rf-console-message">
                                    {handlePreviousMessage(message)}
                                </div>
                            ))}
                        </div>
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
