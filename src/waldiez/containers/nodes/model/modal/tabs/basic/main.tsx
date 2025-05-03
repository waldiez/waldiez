/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { Collapsible, InfoLabel, Select } from "@waldiez/components";
import { useModelModalBasicTab } from "@waldiez/containers/nodes/model/modal/tabs/basic/hooks";
import { ModelSelector } from "@waldiez/containers/nodes/model/modal/tabs/basic/selectModel";
import { WaldiezNodeModelModalBasicTabProps } from "@waldiez/containers/nodes/model/modal/tabs/basic/types";
import { modelLinks } from "@waldiez/containers/nodes/model/utils";
import { WaldiezModelAPIType } from "@waldiez/types";
import { capitalize } from "@waldiez/utils";

export const WaldiezNodeModelModalBasicTab = (props: WaldiezNodeModelModalBasicTabProps) => {
    const { id, data } = props;
    const { label, description, apiType, apiKey, baseUrl } = data;
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
    const onPredefineSelected = (selected?: { label: string; apiType: WaldiezModelAPIType }) => {
        if (!selected) {
            onDataChange({ label: "", apiType: "other" });
            return;
        }
        const { label, apiType } = selected;
        onDataChange({ label, apiType });
    };
    return (
        <div className="flex-column">
            <div className="info margin-bottom-10">
                You can select one of the predefined models from the list below or manually enter the model
                name and type. In the latter case, make sure that the model's name is a valid name (based on
                the provider).
                <br />
                You can use the <strong>Test</strong> button to check if the model parameters are correct, but
                model credits might be used for this test (depending on the provider).
                <br />
                Note that if testing the model fails with a "Failed to load" message (for example the NIM
                models), it doesn't mean that the configuration is not correct (it could be a browser/CORS
                issue).
                <Collapsible
                    title="Useful Links"
                    expanded={false}
                    fullWidth
                    className="transparent no-padding color-info margin-top-10 margin-bottom-10"
                >
                    <div className="flex-column">
                        {Object.entries(modelLinks)
                            .filter(([_, link]) => link.length > 0)
                            .map(([key, link]) => (
                                <div key={key} className="flex-row">
                                    {capitalize(key)} models:&nbsp;&nbsp;
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="margin-bottom-10"
                                    >
                                        {link}
                                    </a>
                                </div>
                            ))}
                    </div>
                </Collapsible>
            </div>
            <ModelSelector ref={predefinedModelsSelectRef} onChange={onPredefineSelected} />
            <label>Name:</label>
            <input
                type="text"
                value={label}
                onChange={onLabelChange}
                title="Model name"
                data-testid="model-name-input"
            />
            <label>Description:</label>
            <textarea
                title="Model description"
                rows={2}
                value={description}
                onChange={onDescriptionChange}
                data-testid="model-description-textarea"
            />
            <InfoLabel
                label="Model Type:"
                info="API type to use for the model. Use 'other' for custom openai compatible models"
            />
            <label className="hidden" htmlFor="model-api-type-select">
                Model Type:
            </label>
            <Select
                options={apiTypeOptions}
                value={{
                    label: apiTypeLabel,
                    value: apiType,
                }}
                onChange={onApiTypeChange}
                inputId="model-api-type-select"
            />
            <InfoLabel label="API Key:" info={apiKeyInfo} />
            <div className="flex full-width">
                <input
                    className="flex-1 margin-right-10"
                    type={apiKeyVisible ? "text" : "password"}
                    defaultValue={apiKey ?? ""}
                    placeholder={apiKeyEnv}
                    onChange={onApiKeyChange}
                    data-testid="model-api-key-input"
                />
                <button
                    type="button"
                    className="visibilityWrapperBtn"
                    onClick={onApiKeyVisibleChange}
                    title="Toggle visibility"
                    data-testid={`visibility-apiKey-model-${id}`}
                >
                    {apiKeyVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            <InfoLabel label="Base URL:" info="Model's base URL (including version)" />
            {urlIsEditable ? (
                <input
                    title="Model base URL"
                    type="text"
                    value={baseUrl ?? ""}
                    onChange={onBaseUrlChange}
                    data-testid="model-base-url-input"
                />
            ) : (
                <input
                    type="text"
                    title="Model base URL"
                    readOnly
                    disabled
                    value={readOnlyBaseUrl}
                    data-testid="model-base-url-input-read-only"
                />
            )}
        </div>
    );
};
