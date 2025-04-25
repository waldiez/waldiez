/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { ImportFlowModalProps, ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { useWaldiez } from "@waldiez/store";

export const useImportFlowModal = (props: ImportFlowModalProps) => {
    const { onClose: handleClose, typeShown } = props;
    const [importFlowState, setImportFlowState] = useState<ImportFlowState>(initialState);
    const importFlow = useWaldiez(s => s.importFlow);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const onSubmit = () => {
        const { loadedFlowData, selectedProps } = importFlowState;
        if (loadedFlowData) {
            importFlow(selectedProps, loadedFlowData, typeShown);
            // onTypeShownChange('agent');
            onFlowChanged();
        }
    };
    const onBack = (step: number) => {
        if (step === 0) {
            handleClose();
        }
    };
    const onForward = (step: number) => {
        if (step === 1) {
            onSubmit();
            handleClose();
        }
    };
    const onClose = () => {
        setImportFlowState(initialState);
        handleClose();
    };
    const onImportFlowStateChange = (newState: Partial<ImportFlowState>) => {
        setImportFlowState({
            ...importFlowState,
            ...newState,
        });
    };
    return {
        state: importFlowState,
        initialState,
        onStateChange: onImportFlowStateChange,
        onClose,
        onBack,
        onForward,
    };
};
const initialState: ImportFlowState = {
    searchTerm: "",
    remoteUrl: "",
    // to add: search results
    // once we their their type
    loadedFlowData: null,
    selectedProps: {
        everything: true,
        override: false,
        name: false,
        description: false,
        tags: false,
        requirements: false,
        isAsync: false,
        nodes: {
            models: [],
            skills: [],
            agents: [],
        },
        edges: [],
    },
};
