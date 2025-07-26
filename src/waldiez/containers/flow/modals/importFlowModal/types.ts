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

export type SearchResult = {
    id: string;
    name: string;
    description: string;
    tags: string[];
    url: string;
    upload_date: string;
};

export type ImportFlowState = {
    searchTerm: string;
    remoteUrl: string;
    loading: boolean;
    loadedFlowData: ImportedFlow | null;
    selectedProps: ThingsToImport;
    searchResults: SearchResult[] | null;
};
