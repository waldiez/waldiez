/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { showSnackbar } from "@waldiez/components";
import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { flowMapper } from "@waldiez/models/mappers";
import { ImportedFlow, ThingsToImport } from "@waldiez/types";

/**
 * Custom hook for handling flow loading functionality in import flow modal
 */
export const useLoadFlowStep = (props: {
    flowId: string;
    state: ImportFlowState;
    initialState: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, initialState, onStateChange } = props;

    /**
     * Update loaded flow data in state
     */
    const setLoadedFlowData = useCallback(
        (loadedFlowData: ImportedFlow | null) => {
            onStateChange({ loadedFlowData });
        },
        [onStateChange],
    );

    /**
     * Update remote URL in state
     */
    const setRemoteUrl = useCallback(
        (remoteUrl: string) => {
            onStateChange({ remoteUrl });
        },
        [onStateChange],
    );

    /**
     * Process flow data from string
     */
    const onFlowData = useCallback(
        (data: any) => {
            try {
                const flow = flowMapper.toReactFlow(flowMapper.importFlow(data, flowId));
                const isEmpty = flow.nodes.length === 0 && flow.edges.length === 0;

                if (isEmpty) {
                    setLoadedFlowData(null);
                    showSnackbar({
                        flowId,
                        message: "Failed to load flow",
                        level: "error",
                        details: null,
                        duration: 3000,
                    });
                    return;
                }

                setLoadedFlowData(flow);
            } catch (error) {
                console.error("Error processing flow data:", error);
                setLoadedFlowData(null);
                showSnackbar({
                    flowId,
                    message: "Failed to parse flow data",
                    level: "error",
                    details: null,
                    duration: 3000,
                });
            }
        },
        [flowId, setLoadedFlowData],
    );

    /**
     * Handle file upload
     */
    const onUpload = useCallback(
        (files: File[]) => {
            if (!files.length) {
                return;
            }

            const file = files[0];
            if (!file) {
                return;
            }

            try {
                const reader = new FileReader();

                reader.onload = () => {
                    const data = reader.result;
                    if (typeof data === "string") {
                        onFlowData(data);
                    }
                };

                reader.onerror = () => {
                    console.error("Error reading file:", reader.error);
                    setLoadedFlowData(null);
                    showSnackbar({
                        flowId,
                        message: "Failed to read file",
                        level: "error",
                        details: null,
                        duration: 3000,
                    });
                };

                reader.readAsText(file);
            } catch (error) {
                console.error("Error uploading file:", error);
                setLoadedFlowData(null);
                showSnackbar({
                    flowId,
                    message: "Failed to upload file",
                    level: "error",
                    details: null,
                    duration: 3000,
                });
            }
        },
        [flowId, onFlowData, setLoadedFlowData],
    );

    /**
     * Handle remote URL input change
     */
    const onRemoteUrlChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRemoteUrl(event.target.value);
        },
        [setRemoteUrl],
    );

    /**
     * Fetch flow from remote URL
     */
    const onRemoteUrlSubmit = useCallback(() => {
        const TIMEOUT_MS = 30000;
        const controller = new AbortController();
        const signal = controller.signal;

        setLoadedFlowData(null);

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS);

        fetch(state.remoteUrl, {
            signal,
            mode: "cors",
            redirect: "follow",
            headers: {
                Accept: "application/json",
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                onFlowData(data);
            })
            .catch(error => {
                console.error("Error fetching flow:", error);
                showSnackbar({
                    flowId,
                    message: `Failed to load flow: ${error.message}`,
                    level: "error",
                    duration: 5000,
                });
                onStateChange(initialState);
            })
            .finally(() => {
                clearTimeout(timeoutId);
            });
    }, [flowId, state.remoteUrl, onFlowData, setLoadedFlowData, onStateChange, initialState]);

    /**
     * Update selected props in state
     */
    const onSelectedPropsChange = useCallback(
        (selectedProps: Partial<ThingsToImport>) => {
            onStateChange({
                selectedProps: {
                    ...state.selectedProps,
                    ...selectedProps,
                },
            });
        },
        [state.selectedProps, onStateChange],
    );

    /**
     * Clear loaded flow data
     */
    const onClearLoadedFlowData = useCallback(() => {
        setLoadedFlowData(null);
    }, [setLoadedFlowData]);

    return {
        onUpload,
        onRemoteUrlChange,
        onRemoteUrlSubmit,
        onSelectedPropsChange,
        onClearLoadedFlowData,
    };
};
