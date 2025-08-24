/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import Waldiez, { showSnackbar } from "@waldiez";

import React, { useCallback } from "react";

import { WaldiezProps } from "@waldiez/types";

import { useWaldiezWrapper } from "./hooks";

type WaldiezWrapperProps = {
    // Original Waldiez props that will be passed to the component
    waldiezProps: Omit<WaldiezProps, "onRun" | "onStepRun" | "onSave" | "onUpload" | "onConvert" | "chat">;
    // WebSocket connection URL
    wsUrl?: string;
};

export const WaldiezWrapper: React.FC<WaldiezWrapperProps> = ({
    waldiezProps,
    wsUrl = "ws://localhost:8765",
}) => {
    const onError = useCallback((error: any) => {
        showSnackbar({ message: "Workflow Error", details: error, level: "error", withCloseButton: true });
    }, []);
    const [
        { messages, participants, isRunning, isDebugging, inputPrompt, timeline, stepByStepState },
        { run, stepRun, stop, save, upload, convert, userInput, reset },
    ] = useWaldiezWrapper({ wsUrl, flowId: waldiezProps.flowId, onError });
    const userParticipants = participants
        .filter(p => p.isUser)
        .map(p => p.name)
        .filter(Boolean);

    // Assemble props for the Waldiez component
    const completeProps: WaldiezProps = {
        ...waldiezProps,
        onRun: run,
        onStepRun: stepRun,
        onSave: save,
        onUpload: upload,
        onConvert: convert,
        chat: isDebugging
            ? undefined
            : {
                  showUI: isRunning && timeline !== undefined,
                  messages,
                  userParticipants,
                  activeRequest: inputPrompt,
                  timeline,
                  handlers: {
                      onUserInput: userInput,
                      onInterrupt: stop,
                      onClose: reset,
                  },
              },
        stepByStep: isRunning ? undefined : !isDebugging ? undefined : stepByStepState,
    };

    return (
        <div className="waldiez-wrapper">
            <Waldiez {...completeProps} />
        </div>
    );
};

WaldiezWrapper.displayName = "WaldiezWrapper";
