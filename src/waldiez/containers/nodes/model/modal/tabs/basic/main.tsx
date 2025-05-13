/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { Collapsible, InfoLabel, Select, TextareaInput } from "@waldiez/components";
import { useModelModalBasicTab } from "@waldiez/containers/nodes/model/modal/tabs/basic/hooks";
import { ModelSelector } from "@waldiez/containers/nodes/model/modal/tabs/basic/selectModel";
import { WaldiezNodeModelModalBasicTabProps } from "@waldiez/containers/nodes/model/modal/tabs/basic/types";
import { modelLinks } from "@waldiez/containers/nodes/model/utils";
import { WaldiezModelAPIType } from "@waldiez/types";
import { capitalize } from "@waldiez/utils";

/**
 * Basic tab component for model properties in model modal
 */
export const WaldiezNodeModelModalBasicTab = memo((props: WaldiezNodeModelModalBasicTabProps) => {
    const { id, data } = props;
    const { label, description, apiType, apiKey, baseUrl } = data;

    // Get handlers and derived state from hook
    const {
        apiTypeLabel,
        apiKeyInfo,
        apiKeyEnv,
        urlIsEditable,
        apiKeyVisible,
        apiTypeOptions,
        readOnlyBaseUrl,
        predefinedModelsSelectRef,
        onDataChange,
        onApiKeyVisibleChange,
        onLabelChange,
        onDescriptionChange,
        onApiTypeChange,
        onApiKeyChange,
        onBaseUrlChange,
    } = useModelModalBasicTab(props);

    /**
     * Handle selection of predefined model
     */
    const onPredefineSelected = useMemo(
        () => (selected?: { label: string; apiType: WaldiezModelAPIType }) => {
            if (!selected) {
                onDataChange({ label: "", apiType: "other" });
                return;
            }

            const { label, apiType } = selected;
            onDataChange({ label, apiType });
        },
        [onDataChange],
    );

    // Generate useful links section
    const usefulLinks = useMemo(
        () => (
            <div className="flex-column">
                {Object.entries(modelLinks)
                    .filter(([_, link]) => link.length > 0)
                    .map(([key, link]) => (
                        <div key={key} className="flex-row margin-bottom-5">
                            <span className="flex-shrink-0">{capitalize(key)} models:&nbsp;&nbsp;</span>
                            <a href={link} target="_blank" rel="noreferrer" className="text-truncate">
                                {link}
                            </a>
                        </div>
                    ))}
            </div>
        ),
        [],
    );

    // Generate input IDs for accessibility
    const nameInputId = `model-name-input-${id}`;
    const descriptionInputId = `model-description-textarea-${id}`;
    const apiTypeSelectId = `model-api-type-select-${id}`;
    const apiKeyInputId = `model-api-key-input-${id}`;
    const baseUrlInputId = `model-base-url-input-${id}`;

    return (
        <div className="flex-column">
            <div className="info margin-bottom-10">
                You can select one of the predefined models from the list below or manually enter the model
                name and type. In the latter case, make sure that the model's name is a valid name (based on
                the provider). You can use the <strong>Test</strong> button to check if the model parameters
                are correct, but model credits might be used for this test (depending on the provider). <br />
                <strong>Note</strong> that if testing the model fails with a "Failed to load" message (for
                example a NIM model), it doesn't mean that the configuration is not correct (it could be a
                browser/CORS issue).
                <Collapsible
                    title="Useful Links"
                    expanded={false}
                    fullWidth
                    className="transparent color-info no-padding margin-top-5 margin-bottom-5"
                    contentClassName="background-info"
                >
                    {usefulLinks}
                </Collapsible>
            </div>

            <ModelSelector ref={predefinedModelsSelectRef} onChange={onPredefineSelected} />

            <div className="margin-top-10">
                <label htmlFor={nameInputId}>Name:</label>
                <div className="margin-top-10" />
                <input
                    id={nameInputId}
                    type="text"
                    value={label || ""}
                    onChange={onLabelChange}
                    title="Model name"
                    data-testid="model-name-input"
                    className="full-width"
                    aria-label="Model name"
                />
            </div>

            <div className="margin-top-10">
                <label htmlFor={descriptionInputId}>Description:</label>
                <div className="margin-top-10" />
                <TextareaInput
                    id={descriptionInputId}
                    title="Model description"
                    rows={2}
                    value={description || ""}
                    onChange={onDescriptionChange}
                    data-testid="model-description-textarea"
                    className="full-width"
                    aria-label="Model description"
                />
            </div>

            <div className="margin-top-0">
                <InfoLabel
                    label="Model Type:"
                    info="API type to use for the model. Use 'other' for custom openai compatible models"
                />
                <label htmlFor={apiTypeSelectId} className="hidden">
                    Model Type:
                </label>
                <Select
                    options={apiTypeOptions}
                    value={{
                        label: apiTypeLabel,
                        value: apiType,
                    }}
                    onChange={onApiTypeChange}
                    inputId={apiTypeSelectId}
                    aria-label="Model API type"
                    className="full-width"
                />
            </div>

            <div className="margin-top-0">
                <InfoLabel label="API Key:" info={apiKeyInfo} />
                <div className="flex full-width">
                    <input
                        id={apiKeyInputId}
                        className="flex-1 margin-right-10"
                        type={apiKeyVisible ? "text" : "password"}
                        value={apiKey || ""}
                        placeholder={apiKeyEnv}
                        onChange={onApiKeyChange}
                        data-testid="model-api-key-input"
                        aria-label="API key"
                    />
                    <button
                        type="button"
                        className="visibilityWrapperBtn"
                        onClick={onApiKeyVisibleChange}
                        title={apiKeyVisible ? "Hide API key" : "Show API key"}
                        aria-label={apiKeyVisible ? "Hide API key" : "Show API key"}
                        data-testid={`visibility-apiKey-model-${id}`}
                    >
                        {apiKeyVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
            </div>

            <div className="margin-top-0">
                <InfoLabel label="Base URL:" info="Model's base URL (including version)" />
                {urlIsEditable ? (
                    <input
                        id={baseUrlInputId}
                        title="Model base URL"
                        type="text"
                        value={baseUrl || ""}
                        onChange={onBaseUrlChange}
                        data-testid="model-base-url-input"
                        className="full-width"
                        aria-label="Base URL"
                    />
                ) : (
                    <input
                        id={baseUrlInputId}
                        type="text"
                        title="Model base URL"
                        readOnly
                        disabled
                        value={readOnlyBaseUrl}
                        data-testid="model-base-url-input-read-only"
                        className="full-width"
                        aria-label="Base URL (read-only)"
                    />
                )}
            </div>
        </div>
    );
});

// Add display name for better debugging
WaldiezNodeModelModalBasicTab.displayName = "WaldiezNodeModelModalBasicTab";
