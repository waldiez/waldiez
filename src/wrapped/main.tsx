/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import Waldiez from "@waldiez";

import React from "react";

import { WaldiezProps } from "@waldiez/types";

import { useWaldiezWrapper } from "./hooks";

type WaldiezWrapperProps = {
    // Original Waldiez props that will be passed to the component
    waldiezProps: Omit<
        WaldiezProps,
        "onRun" | "onSave" | "onUpload" | "onConvert" | "onUserInput" | "inputPrompt"
    >;
    // WebSocket connection URL
    wsUrl?: string;
};

export const WaldiezWrapper: React.FC<WaldiezWrapperProps> = ({
    waldiezProps,
    wsUrl = "ws://localhost:8765",
}) => {
    // Use the custom hook to get state and actions
    const [
        { messages, userParticipants, isRunning, inputPrompt },
        { handleRun, handleSave, handleUpload, handleConvert, handleUserInput },
    ] = useWaldiezWrapper({ wsUrl });

    // Assemble props for the Waldiez component
    const completeProps: WaldiezProps = {
        ...waldiezProps,
        onRun: handleRun,
        onSave: handleSave,
        onUpload: handleUpload,
        onConvert: handleConvert,
        chat: {
            showUI: isRunning,
            messages,
            userParticipants,
            activeRequest: inputPrompt,
            handlers: {
                onUserInput: handleUserInput,
            },
        },
    };

    return (
        <div className="waldiez-wrapper">
            <Waldiez {...completeProps} />
        </div>
    );
};

WaldiezWrapper.displayName = "WaldiezWrapper";
