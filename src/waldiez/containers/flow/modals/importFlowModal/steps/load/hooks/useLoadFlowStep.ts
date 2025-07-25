/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { showSnackbar } from "@waldiez/components";
import { ImportFlowState, SearchResult } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { flowMapper } from "@waldiez/models/mappers";
import { ImportedFlow, ThingsToImport } from "@waldiez/types";

const API_SEARCH_URL = `${__HUB_API_URL__}/api/search/`;
const TIMEOUT_MS = 30000;

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
        const controller = new AbortController();
        const signal = controller.signal;

        setLoadedFlowData(null);
        onStateChange({ loading: true });

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
                onStateChange({ loading: false, remoteUrl: state.remoteUrl, searchResults: null });
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

    /**
     * Handle search input change
     */
    const onSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const searchTerm = event.target.value.trim();
            onStateChange({ searchTerm });
        },
        [onStateChange],
    );

    /**
     * Handle search result selection
     */
    const onSelectResult = useCallback(
        (result: SearchResult) => {
            setRemoteUrl(result.url);
            setLoadedFlowData(null);
            onStateChange({ loading: true });
            const controller = new AbortController();
            const signal = controller.signal;
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, TIMEOUT_MS);
            fetch(result.url, {
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
                    console.error("Error fetching selected result:", error);
                    showSnackbar({
                        flowId,
                        message: `Failed to load flow from selected result: ${error.message}`,
                        level: "error",
                        duration: 5000,
                    });
                    onStateChange(initialState);
                })
                .finally(() => {
                    clearTimeout(timeoutId);
                    onStateChange({ loading: false, remoteUrl: state.remoteUrl });
                });
        },
        [setRemoteUrl, setLoadedFlowData, onStateChange, onFlowData, flowId, initialState, state.remoteUrl],
    );

    /**
     * Handle search submit
     */
    const onSearchSubmit = useCallback(() => {
        const { searchTerm } = state;
        if (!searchTerm) {
            showSnackbar({
                flowId,
                message: "Please enter a search term",
                level: "warning",
                duration: 3000,
            });
            return;
        }
        const controller = new AbortController();
        const signal = controller.signal;

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS);
        onStateChange({ loading: true });

        fetch(`${API_SEARCH_URL}?query=${encodeURIComponent(searchTerm)}`, {
            signal,
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
                const searchResults = data.files.map((file: any) => ({
                    id: file.id,
                    name: file.name,
                    description: file.description,
                    tags: file.tags ? file.tags.split(",").map((tag: string) => tag.trim()) : [],
                    url: file.url,
                    upload_date: file.upload_date,
                }));
                onStateChange({ searchResults });
            })
            .catch(error => {
                console.error("Error fetching search results:", error);
                showSnackbar({
                    flowId,
                    message: `Failed to fetch search results: ${error.message}`,
                    level: "error",
                    duration: 5000,
                });
                onStateChange(initialState);
            })
            .finally(() => {
                clearTimeout(timeoutId);
                onStateChange({ loading: false, searchTerm, remoteUrl: state.remoteUrl });
            });
    }, [flowId, state, onStateChange, initialState]);

    // Return all handlers for use in the component
    return {
        onUpload,
        onRemoteUrlChange,
        onRemoteUrlSubmit,
        onSelectedPropsChange,
        onClearLoadedFlowData,
        onSearchChange,
        onSearchSubmit,
        onSelectResult,
    };
};
