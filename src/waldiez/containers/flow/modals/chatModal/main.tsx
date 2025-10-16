/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    type ChangeEvent,
    type KeyboardEvent,
    type SyntheticEvent,
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { FaStop } from "react-icons/fa";
import { FiEye, FiEyeOff, FiPaperclip, FiX } from "react-icons/fi";
import { IoIosSend } from "react-icons/io";
import { MdTimeline } from "react-icons/md";

import { ChatUI, Modal, TimelineModal } from "@waldiez/components";
import { type ChatModalProps } from "@waldiez/containers/flow/modals/chatModal/types";

/**
 * Modal component for collecting user input with optional image upload
 */

// eslint-disable-next-line complexity
export const ChatModal = memo((props: ChatModalProps) => {
    const { flowId, chat } = props;

    // State
    const [textInput, setTextInput] = useState("");
    const [isFileSelectModalOpen, setIsFileSelectModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLocallyOpen, setIsLocallyOpen] = useState(true);

    // Refs
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Reset input fields and focus when modal opens
    useEffect(() => {
        if (chat?.show) {
            setIsLocallyOpen(true);
            setTextInput("");
            setImagePreview(null);

            // Focus input after render
            requestAnimationFrame(() => {
                if (chat.activeRequest?.request_id) {
                    inputRef.current?.focus();
                } else {
                    inputRef.current?.blur();
                }
            });
        }
    }, [chat?.show, chat?.activeRequest?.request_id, chat?.messages]);

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
    const handleSubmit = useCallback(() => {
        chat?.handlers?.onUserInput?.(createInputResponse());

        setTimeout(() => {
            // Reset input state
            setTextInput("");
            setImagePreview(null);
        }, 10);
    }, [chat?.handlers, createInputResponse]);
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit],
    );
    const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setTextInput(event.target.value);
    }, []);
    const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
    const clearImage = useCallback(() => {
        setImagePreview(null);
    }, []);
    const handleClose = useCallback(() => {
        // Reset input state
        setTextInput("");
        setImagePreview(null);
        if (chat?.handlers?.onClose) {
            chat.handlers.onClose();
            setIsLocallyOpen(false);
        } else {
            // Fallback: close the modal locally
            setIsLocallyOpen(false);
        }
    }, [chat?.handlers]);
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
    const handleCancel = useCallback(
        (event: SyntheticEvent<HTMLDialogElement | HTMLDivElement, Event> | KeyboardEvent) => {
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
    const closeTimeline = useCallback(() => {
        setTimelineOpen(false);
    }, []);
    const openTimeline = useCallback(() => {
        setTimelineOpen(true);
    }, []);
    const onInterrupt = useCallback(() => {
        chat?.handlers?.onInterrupt?.();
    }, [chat?.handlers]);

    const inputId = `rf-${flowId}-chat-modal-input`;
    const imageInputId = `rf-${flowId}-chat-modal-image`;
    const modalTestId = `rf-${flowId}-chat-modal`;
    const isModalOpen =
        isLocallyOpen && (chat?.show === true || (chat !== undefined && chat.messages.length > 0));
    const leftIcon = chat?.timeline ? (
        <div
            role="button"
            className="chat-modal-action clickable"
            onClick={openTimeline}
            title="View Timeline"
            data-testid={`rf-${flowId}-chat-modal-timeline`}
        >
            <MdTimeline size={18} />
        </div>
    ) : chat?.handlers?.onInterrupt && !chat.active ? (
        <div role="button" className="chat-modal-action clickable" onClick={onInterrupt} title="Interrupt">
            <FaStop size={18} />
        </div>
    ) : undefined;
    const allowImage = !chat || !chat?.mediaConfig ? true : chat?.mediaConfig?.allowedTypes.includes("image");
    if (timelineOpen && chat?.timeline) {
        return (
            <TimelineModal
                flowId={flowId}
                isOpen={timelineOpen}
                onClose={closeTimeline}
                data={chat.timeline}
            />
        );
    }
    // noinspection PointlessBooleanExpressionJS
    return (
        <Modal
            flowId={flowId}
            id={modalTestId}
            title="Chat"
            isOpen={isModalOpen}
            onClose={handleClose}
            onCancel={handleCancel}
            beforeTitle={leftIcon}
            className="chat-modal"
            hasMaximizeBtn={true}
            hasCloseBtn={true}
            dataTestId={modalTestId}
            hasUnsavedChanges={false}
            preventCloseIfUnsavedChanges={false}
        >
            <div className="modal-body">
                {chat?.messages && chat.messages.length > 0 && (
                    <div className="chat-wrapper" data-flow-id={flowId}>
                        <ChatUI
                            isDarkMode={false}
                            messages={chat.messages}
                            userParticipants={chat.userParticipants}
                            activeRequest={chat.activeRequest}
                        />
                    </div>
                )}
                <div className="input-prompt">{chat?.activeRequest?.prompt}</div>
                {chat?.activeRequest?.request_id !== undefined && (
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
                        <div className="chat-input-field-container">
                            {chat?.activeRequest?.password === true ? (
                                <div className="password-toggle-container">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        ref={inputRef}
                                        placeholder="Enter your password"
                                        id={inputId}
                                        data-testid={inputId}
                                        value={textInput}
                                        disabled={chat?.activeRequest?.request_id === undefined}
                                        onKeyDown={handleKeyDown}
                                        onChange={handleTextChange}
                                        className="chat-text-input password-input"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        aria-label="Password input"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        disabled={chat?.activeRequest?.request_id === undefined}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            ) : (
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
                            )}
                        </div>

                        {chat?.activeRequest?.request_id !== undefined && (
                            <div className="chat-input-actions">
                                {allowImage ? (
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
                                ) : (
                                    <div className="chat-upload-button"></div>
                                )}
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
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
});

ChatModal.displayName = "ChatModal";
