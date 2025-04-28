/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect } from "react";

import { UserInputModalProps } from "@waldiez/containers/flow/modals/userInputModal/types";

export const useUserInputModal = (props: UserInputModalProps) => {
    const { flowId, isOpen, onUserInput, inputPrompt } = props;
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
    const onKeyDown = (event: KeyboardEvent) => {
        if (isOpen) {
            if (event.key === "Escape") {
                onCancel();
            }
            if (event.key === "Enter") {
                onSubmit();
            }
        }
    };
    const onOpenModalChange = () => {
        const userInputElement = document.getElementById(
            `rf-${flowId}-user-input-modal-input`,
        ) as HTMLInputElement | null;
        if (isOpen) {
            if (userInputElement) {
                userInputElement.focus();
                userInputElement.addEventListener("keydown", onKeyDown);
            }
        } else {
            if (userInputElement) {
                userInputElement.removeEventListener("keydown", onKeyDown);
            }
        }
    };
    const onClose = () => {
        const userInputElement = document.getElementById(
            `rf-${flowId}-user-input-modal-input`,
        ) as HTMLInputElement | null;
        if (userInputElement) {
            userInputElement.removeEventListener("keydown", onKeyDown);
            const userInput = userInputElement.value;
            if (userInput) {
                onUserInput({ text: userInput });
            } else {
                onUserInput({ text: "" });
            }
        }
    };

    const onCancel = () => {
        onUserInput({ text: "" });
    };

    const onSubmit = () => {
        const userInput = (document.getElementById(`rf-${flowId}-user-input-modal-input`) as HTMLInputElement)
            ?.value;
        if (userInput) {
            onUserInput({ text: userInput });
        } else {
            onUserInput({ text: "" });
        }
    };
    return {
        onClose,
        onCancel,
        onSubmit,
    };
};
