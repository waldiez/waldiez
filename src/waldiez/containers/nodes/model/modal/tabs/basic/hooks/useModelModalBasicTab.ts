/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useRef, useState } from "react";

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

export const useModelModalBasicTab = (props: WaldiezNodeModelModalBasicTabProps) => {
    const predefinedModelsSelectRef = useRef<any>(null);
    const { data, onDataChange, onLogoChange } = props;
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const { apiType } = data;

    const getBaseUrl = (apiType: WaldiezModelAPIType) => {
        return baseUrlsMapping[apiType];
    };

    const isBaseUrlEditable = (apiType: WaldiezModelAPIType) => {
        return ["other", "azure"].includes(apiType);
    };

    const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: e.target.value });
    };
    const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({ description: e.target.value });
    };
    const onApiTypeChange = (option: SingleValue<{ label: string; value: WaldiezModelAPIType }>) => {
        if (option) {
            predefinedModelsSelectRef.current?.clearValue();
            onDataChange({ apiType: option.value });
            onLogoChange(LOGOS[option.value]);
        }
    };
    const onApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ apiKey: e.target.value });
    };
    const onBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ baseUrl: e.target.value });
    };
    const onApiKeyVisibleChange = () => {
        setApiKeyVisible(!apiKeyVisible);
    };
    const apiKeyEnv = apiKeyEnvs[apiType];
    const apiKeyInfo = `API key to use if the '${apiKeyEnv}' environment variable is not set`;
    const apiTypeLabel = getApiTypeLabel(apiType);
    const readOnlyBaseUrl = getBaseUrl(apiType);
    const urlIsEditable = isBaseUrlEditable(apiType);
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
