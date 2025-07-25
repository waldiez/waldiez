/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo, useState } from "react";

import { ImportFlowModalProps, ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { useWaldiez } from "@waldiez/store";

// Initial state moved to the top level outside component for better performance
const initialState: ImportFlowState = {
    searchTerm: "",
    remoteUrl: "",
    loadedFlowData: null,
    loading: false,
    searchResults: null,
    selectedProps: {
        everything: true,
        override: true,
        name: false,
        description: false,
        tags: false,
        requirements: false,
        isAsync: false,
        nodes: {
            models: [],
            tools: [],
            agents: [],
        },
        edges: [],
    },
};

/**
 * Custom hook for managing import flow modal state and interactions
 */
export const useImportFlowModal = (props: ImportFlowModalProps) => {
    const { onClose: handleClose, typeShown, onTypeShownChange } = props;

    // State
    const [importFlowState, setImportFlowState] = useState<ImportFlowState>(initialState);

    // Get store actions
    const importFlow = useWaldiez(s => s.importFlow);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);

    /**
     * Handle form submission
     */
    const onSubmit = useCallback(() => {
        const { loadedFlowData, selectedProps } = importFlowState;

        if (loadedFlowData) {
            importFlow(selectedProps, loadedFlowData, typeShown);
            onTypeShownChange("agent");
            onFlowChanged();
        }
    }, [importFlowState, importFlow, typeShown, onTypeShownChange, onFlowChanged]);

    /**
     * Handle back button click in wizard
     */
    const onBack = useCallback(
        (step: number) => {
            if (step === 0) {
                handleClose();
            }
        },
        [handleClose],
    );

    /**
     * Handle forward (next) button click in wizard
     */
    const onForward = useCallback(
        (step: number) => {
            if (step === 1) {
                onSubmit();
                handleClose();
            }
        },
        [onSubmit, handleClose],
    );

    /**
     * Handle modal close
     */
    const onClose = useCallback(() => {
        setImportFlowState(initialState);
        handleClose();
    }, [handleClose]);

    /**
     * Update state with partial changes
     */
    const onImportFlowStateChange = useCallback((newState: Partial<ImportFlowState>) => {
        setImportFlowState(prevState => ({
            ...prevState,
            ...newState,
        }));
    }, []);

    // Return memoized values
    return useMemo(
        () => ({
            state: importFlowState,
            initialState,
            onStateChange: onImportFlowStateChange,
            onClose,
            onBack,
            onForward,
        }),
        [importFlowState, onImportFlowStateChange, onClose, onBack, onForward],
    );
};
