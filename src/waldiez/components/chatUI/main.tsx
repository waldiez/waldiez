/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FaRegUser } from "react-icons/fa6";

import { useImageRetry } from "@waldiez/components/chatUI/hooks";
import { ImageModal } from "@waldiez/components/chatUI/imageModal";
import { ChatUIProps, WaldiezChatMessage } from "@waldiez/components/chatUI/types";
import { parseMessageContent } from "@waldiez/components/chatUI/utils";
import { WALDIEZ_ICON } from "@waldiez/theme";

type ChatUIMessage = {
    id: string;
    timestamp: string | number;
    type: string;
    sender?: string;
    recipient?: string;
    node: ReactNode;
};

export const ChatUI: React.FC<ChatUIProps> = ({ messages, isDarkMode, userParticipants }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const chatContainer = useRef<HTMLDivElement>(null);
    const { resetRetries } = useImageRetry();

    // Track previous message count to detect new messages
    const prevMessageCountRef = useRef<number>(0);
    const participantNames = userParticipants
        .map(p => (typeof p === "string" ? p : p.isUser ? p.name : undefined))
        .filter(e => typeof e === "string");

    const openImagePreview = useCallback((url: string) => setPreviewImage(url), []);
    const closeImagePreview = useCallback(() => setPreviewImage(null), []);

    // Reset retries when messages length changes
    useEffect(() => {
        resetRetries();
    }, [messages.length, resetRetries]);

    // Process message function - memoized for performance
    const processMessage = useCallback(
        (msg: WaldiezChatMessage): ChatUIMessage => {
            const { id, timestamp, type, content, sender, recipient } = msg;
            try {
                const node = parseMessageContent(content, isDarkMode, openImagePreview);
                return { id, timestamp, type, sender, recipient, node };
            } catch (error) {
                console.error("Error parsing message content:", error);
                return { id, timestamp, type, sender, recipient, node: null };
            }
        },
        [openImagePreview, isDarkMode],
    );

    // Calculate message classes - memoized for performance
    const getMessageClass = useCallback(
        (msg: ChatUIMessage) => {
            if (["system", "termination"].includes(msg.type)) {
                return "system-message";
            }
            if (msg.sender && participantNames.includes(msg.sender)) {
                return "user-message";
            }
            if (msg.type === "error") {
                return "error-message";
            }
            if (msg.type === "input_request") {
                return "request-message";
            }
            return "assistant-message"; // generic class for non-user senders
        },
        [participantNames],
    );

    // Create a message key builder to help with rendering
    const getMessageKey = useCallback((msg: WaldiezChatMessage, index: number) => {
        return `msg-${index}-${msg.id}-${msg.timestamp}`;
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        // Check if we need to scroll (only if messages increased)
        const shouldScroll = messages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (!shouldScroll) {
            return;
        }

        const scrollToBottom = () => {
            const container = chatContainer.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            } else {
                const scrollableContainers = document.querySelectorAll(".chat-container");
                scrollableContainers.forEach(container => {
                    (container as HTMLDivElement).scrollTop = container.scrollHeight;
                });
            }
        };
        // Try multiple times to ensure content is rendered
        // This is more reliable than a single timeout
        setTimeout(scrollToBottom, 10); // First attempt
        setTimeout(scrollToBottom, 100); // Second attempt
        setTimeout(scrollToBottom, 300); // Final attempt for slow renders
    }, [messages.length]);

    return (
        <>
            <div className="chat-container" ref={chatContainer}>
                {messages.map((msg, index) => {
                    // Process each message in the render function
                    // This ensures we always get fresh content
                    const processedMsg = processMessage(msg);
                    if (!processedMsg.node) {
                        // Skip messages that failed to parse
                        return null;
                    }
                    const messageClass = getMessageClass(processedMsg);
                    const showAvatar =
                        messageClass === "user-message" || messageClass === "assistant-message";
                    return (
                        <div
                            key={getMessageKey(msg, index)}
                            className={`message-bubble ${getMessageClass(processedMsg)}`}
                            data-testid="rf-chat-message"
                        >
                            <div className={`message-header ${showAvatar && messageClass}`}>
                                {messageClass === "assistant-message" ? (
                                    <>
                                        {/* Avatar left */}
                                        {showAvatar && (
                                            <div className="avatar-container">
                                                <div className={"avatar assistant-avatar"}>
                                                    <img
                                                        src={WALDIEZ_ICON}
                                                        alt="Assistant Avatar"
                                                        className="avatar-image"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {processedMsg.sender && (
                                            <span className="message-sender">{processedMsg.sender}</span>
                                        )}
                                        <span className="message-timestamp">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </>
                                ) : messageClass === "user-message" ? (
                                    <>
                                        {/* Avatar right */}
                                        <span className="message-timestamp">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                        {processedMsg.sender && (
                                            <span className="message-sender">{processedMsg.sender}</span>
                                        )}
                                        {showAvatar && (
                                            <div className="avatar-container">
                                                <div className={"avatar user-avatar"}>
                                                    <FaRegUser size={24} />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Fallback for other message types (no avatar) */}
                                        {processedMsg.sender && (
                                            <span className="message-sender">{processedMsg.sender}</span>
                                        )}
                                        <span className="message-timestamp">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="message-content">{processedMsg.node}</div>
                        </div>
                    );
                })}
            </div>

            <ImageModal isOpen={Boolean(previewImage)} imageUrl={previewImage} onClose={closeImagePreview} />
        </>
    );
};

ChatUI.displayName = "ChatUI";
