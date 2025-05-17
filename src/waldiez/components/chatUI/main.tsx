/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useImageRetry } from "@waldiez/components/chatUI/hooks";
import { ImageModal } from "@waldiez/components/chatUI/imageModal";
import { ChatUIProps, WaldiezChatMessage } from "@waldiez/components/chatUI/types";
import { parseMessageContent } from "@waldiez/components/chatUI/utils";

type ChatUIMessage = {
    id: string;
    timestamp: string | number;
    type: string;
    sender?: string;
    recipient?: string;
    node: ReactNode;
};

export const ChatUI: React.FC<ChatUIProps> = ({ messages, userParticipants }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const chatContainer = useRef<HTMLDivElement>(null);
    const { resetRetries } = useImageRetry();

    const openImagePreview = useCallback((url: string) => setPreviewImage(url), []);
    const closeImagePreview = useCallback(() => setPreviewImage(null), []);

    useEffect(() => resetRetries(), [messages.length, resetRetries]);

    const processMessage = useCallback(
        (msg: WaldiezChatMessage): ChatUIMessage => {
            const { id, timestamp, type, content, sender, recipient } = msg;

            const node = parseMessageContent(content, openImagePreview);

            return { id, timestamp, type, sender, recipient, node };
        },
        [openImagePreview],
    );
    const getMessageClass = useCallback(
        (msg: ChatUIMessage) => {
            if (msg.sender && userParticipants.includes(msg.sender)) {
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
        [userParticipants],
    );
    const processedMessages = useMemo(() => messages.map(processMessage), [messages, processMessage]);
    useEffect(() => {
        setTimeout(() => {
            const container = chatContainer.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            } else {
                const scrollableContainers = document.querySelectorAll(".chat-container");
                scrollableContainers.forEach(container => {
                    (container as HTMLDivElement).scrollTop = container.scrollHeight;
                });
            }
        }, 100);
    }, [messages]);

    return (
        <>
            <div className="chat-container" ref={chatContainer}>
                {processedMessages.map((msg, index) => (
                    <div
                        key={`msg-${index}-${msg.id}`}
                        className={`message-bubble ${getMessageClass(msg)}`}
                        data-testid="rf-chat-message"
                    >
                        <div className="message-header">
                            {msg.sender && <span className="message-sender">{msg.sender}</span>}
                            <span className="message-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="message-content">{msg.node}</div>
                    </div>
                ))}
            </div>

            <ImageModal isOpen={Boolean(previewImage)} imageUrl={previewImage} onClose={closeImagePreview} />
        </>
    );
};

ChatUI.displayName = "ChatUI";
