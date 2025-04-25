/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";
import { flowMapper } from "@waldiez/models/mappers";
import { ImportedFlow, ThingsToImport } from "@waldiez/types";
import { showSnackbar } from "@waldiez/utils";

export const useLoadFlowStep = (props: {
    flowId: string;
    state: ImportFlowState;
    initialState: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
}) => {
    const { flowId, state, initialState, onStateChange } = props;
    const setLoadedFlowData = (loadedFlowData: ImportedFlow | null) => {
        onStateChange({
            loadedFlowData,
        });
    };
    const setRemoteUrl = (remoteUrl: string) => {
        onStateChange({
            remoteUrl,
        });
    };
    const onUpload = (files: File[]) => {
        if (files.length) {
            const file = files[0];
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    const data = reader.result;
                    if (typeof data === "string") {
                        onFlowData(data);
                    }
                };
                reader.readAsText(file);
            } catch (e) {
                console.error(e);
                setLoadedFlowData(null);
            }
        }
    };
    const onFlowData = (data: any) => {
        const flow = flowMapper.toReactFlow(flowMapper.importFlow(data, flowId));
        const isEmpty = flow.nodes.length === 0 && flow.edges.length === 0;
        if (isEmpty) {
            setLoadedFlowData(null);
            showSnackbar(flowId, "Failed to load flow", "error");
            return;
        }
        setLoadedFlowData(flow);
    };
    const onRemoteUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRemoteUrl(event.target.value);
    };
    const onRemoteUrlSubmit = () => {
        const timeout = 30000;
        const controller = new AbortController();
        const signal = controller.signal;
        setLoadedFlowData(null);
        setTimeout(() => {
            controller.abort();
        }, timeout);
        const remoteUrl = state.remoteUrl;
        fetch(remoteUrl, { signal, mode: "cors", redirect: "follow" })
            .then(response => response.json())
            .then(data => {
                onFlowData(data);
            })
            .catch(error => {
                console.error(error);
                showSnackbar(flowId, "Failed to load flow", "error");
                onStateChange(initialState);
            });
    };
    const onSelectedPropsChange = (selectedProps: Partial<ThingsToImport>) => {
        onStateChange({
            selectedProps: {
                ...state.selectedProps,
                ...selectedProps,
            },
        });
    };
    const onClearLoadedFlowData = () => {
        setLoadedFlowData(null);
    };

    // not yet needed
    // const onSearchSubmit = () => {
    //   console.log(state.searchTerm);
    // };
    // const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //   setSearchTerm(event.target.value);
    // };
    // const setSearchTerm = (searchTerm: string) => {
    //   onStateChange({
    //     searchTerm
    //   });
    // };
    return {
        onUpload,
        onRemoteUrlChange,
        onRemoteUrlSubmit,
        // onSearchChange,
        // onSearchSubmit,
        onSelectedPropsChange,
        onClearLoadedFlowData,
    };
};
