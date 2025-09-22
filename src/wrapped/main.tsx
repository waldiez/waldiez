/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import Waldiez, { showSnackbar } from "@waldiez";

import { type FC, useCallback } from "react";

import type { WaldiezProps } from "@waldiez/types";

import { useWaldiezWrapper } from "./hooks/wrapper";

type WaldiezWrapperProps = {
    waldiezProps: Omit<WaldiezProps, "onRun" | "onStepRun" | "onSave" | "onUpload" | "onConvert" | "chat">;
    wsUrl?: string;
    protocols?: string | string[] | undefined;
};

export const WaldiezWrapper: FC<WaldiezWrapperProps> = ({
    waldiezProps,
    wsUrl = "ws://localhost:8765",
    protocols = undefined,
}) => {
    const onError = useCallback((error: any) => {
        showSnackbar({ message: "Workflow Error", details: error, level: "error", withCloseButton: true });
    }, []);
    const { chat, stepByStep, onRun, onStepRun, onConvert, onSave } = useWaldiezWrapper({
        flowId: waldiezProps.flowId,
        wsUrl,
        protocols,
        onError,
    });
    const completeProps: WaldiezProps = {
        ...waldiezProps,
        onRun,
        onStepRun,
        onSave,
        onConvert,
        chat,
        stepByStep,
    };

    return (
        <div className="waldiez-wrapper">
            <Waldiez {...completeProps} />
        </div>
    );
};

WaldiezWrapper.displayName = "WaldiezWrapper";
