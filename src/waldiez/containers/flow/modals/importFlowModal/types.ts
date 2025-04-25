/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ImportedFlow, ThingsToImport, WaldiezNodeType } from "@waldiez/types";

export type ImportFlowModalProps = {
    flowId: string;
    isOpen: boolean;
    onClose: () => void;
    typeShown: WaldiezNodeType;
    onTypeShownChange: (nodeType: WaldiezNodeType) => void;
};
export type ImportFlowModalViewProps = {
    flowId: string;
    isOpen: boolean;
    state: ImportFlowState;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchSubmit: () => void;
    onRemoteUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoteUrlSubmit: () => void;
    onUpload: (files: File[]) => void;
    onClearLoadedFlowData: () => void;
    onClose: () => void;
    onSelectedPropsChange: (selectedProps: Partial<ThingsToImport>) => void;
    onSubmit: () => void;
};

export type ImportFlowState = {
    searchTerm: string;
    remoteUrl: string;
    loadedFlowData: ImportedFlow | null;
    selectedProps: ThingsToImport;
};
