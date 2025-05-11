/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo, useRef, useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeModelModalBasicTabProps } from "@waldiez/containers/nodes/model/modal/tabs/types";
import {
    apiKeyEnvs,
    apiTypeOptions,
    baseUrlsMapping,
    getApiTypeLabel,
} from "@waldiez/containers/nodes/model/utils";
import { WaldiezModelAPIType } from "@waldiez/models";
import { LOGOS } from "@waldiez/theme";

/**
 * Custom hook for handling model modal basic tab functionality
 */
export const useModelModalBasicTab = (props: WaldiezNodeModelModalBasicTabProps) => {
    const { data, onDataChange, onLogoChange } = props;
    const { apiType } = data;

    // References
    const predefinedModelsSelectRef = useRef<any>(null);

    // State
    const [apiKeyVisible, setApiKeyVisible] = useState(false);

    /**
     * Get base URL for the specified API type
     */
    const getBaseUrl = useCallback((type: WaldiezModelAPIType) => {
        return baseUrlsMapping[type];
    }, []);

    /**
     * Check if base URL is editable for the specified API type
     */
    const isBaseUrlEditable = useCallback((type: WaldiezModelAPIType) => {
        return ["other", "azure"].includes(type);
    }, []);

    /**
     * Handle model label changes
     */
    const onLabelChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ label: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Handle model description changes
     */
    const onDescriptionChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({ description: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Handle API type changes
     */
    const onApiTypeChange = useCallback(
        (option: SingleValue<{ label: string; value: WaldiezModelAPIType }>) => {
            if (!option) {
                return;
            }

            // Clear predefined model selection
            predefinedModelsSelectRef.current?.clearValue();

            // Update model data
            onDataChange({ apiType: option.value });

            // Update logo
            onLogoChange(LOGOS[option.value]);
        },
        [onDataChange, onLogoChange],
    );

    /**
     * Handle API key changes
     */
    const onApiKeyChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ apiKey: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Handle base URL changes
     */
    const onBaseUrlChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ baseUrl: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Toggle API key visibility
     */
    const onApiKeyVisibleChange = useCallback(() => {
        setApiKeyVisible(prev => !prev);
    }, []);

    // Memoized derived values
    const apiKeyEnv = useMemo(() => apiKeyEnvs[apiType], [apiType]);

    const apiKeyInfo = useMemo(
        () => `API key to use if the '${apiKeyEnv}' environment variable is not set`,
        [apiKeyEnv],
    );

    const apiTypeLabel = useMemo(() => getApiTypeLabel(apiType), [apiType]);

    const readOnlyBaseUrl = useMemo(() => getBaseUrl(apiType), [getBaseUrl, apiType]);

    const urlIsEditable = useMemo(() => isBaseUrlEditable(apiType), [isBaseUrlEditable, apiType]);

    return {
        apiTypeOptions,
        apiKeyVisible,
        apiKeyEnv,
        apiKeyInfo,
        apiTypeLabel,
        readOnlyBaseUrl,
        urlIsEditable,
        predefinedModelsSelectRef,
        onDataChange,
        onLabelChange,
        onDescriptionChange,
        onApiTypeChange,
        onApiKeyChange,
        onBaseUrlChange,
        onApiKeyVisibleChange,
    };
};
