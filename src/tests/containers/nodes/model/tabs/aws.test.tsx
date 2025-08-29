/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// noinspection DuplicatedCode
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaldiezNodeModelView } from "@waldiez/containers/nodes";
import type { WaldiezModelAPIType } from "@waldiez/models/types";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, flowId, modelData, modelId, updatedAt } from "./data";

const renderModel = (overrides: Partial<typeof modelData> = {}) => {
    const modelDataToUse = { ...modelData, apiType: "bedrock" as WaldiezModelAPIType, ...overrides };
    const storedModels = [
        {
            id: modelId,
            type: "model",
            data: modelDataToUse,
            position: { x: 0, y: 0 },
        },
    ];
    render(
        <WaldiezThemeProvider>
            <WaldiezProvider
                flowId={flowId}
                storageId="test-storage"
                name="flow name"
                description="flow description"
                requirements={[]}
                tags={[]}
                nodes={storedModels}
                edges={[]}
                createdAt={createdAt}
                updatedAt={updatedAt}
            >
                <WaldiezNodeModelView
                    id={modelId}
                    data={{ ...modelDataToUse, label: modelDataToUse.name }}
                    type="model"
                    dragging={false}
                    zIndex={1}
                    isConnectable={true}
                    positionAbsoluteX={0}
                    positionAbsoluteY={0}
                    deletable
                    selectable
                    draggable
                    selected={false}
                />
            </WaldiezProvider>
        </WaldiezThemeProvider>,
    );
};

const renderAWSTab = (overrides: Partial<typeof modelData> = {}) => {
    renderModel(overrides);
    const openModalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
    fireEvent.click(openModalButton);
    const awsTabButton = screen.getByTestId(`tab-id-model-config-aws-${modelId}`);
    fireEvent.click(awsTabButton);
    const awsTab = screen.getByTestId(`panel-model-config-aws-${modelId}`);
    expect(awsTab).toBeInTheDocument();
};

describe("WaldiezNodeModel Modal AWS Tab", () => {
    it("should display the AWS tab", () => {
        renderAWSTab();
    });

    it("should render all AWS input fields", () => {
        renderAWSTab();

        expect(screen.getByLabelText("AWS Access Key:")).toBeInTheDocument();
        expect(screen.getByLabelText("AWS Secret Key:")).toBeInTheDocument();
        expect(screen.getByLabelText("AWS Region:")).toBeInTheDocument();
        expect(screen.getByLabelText("AWS Profile Name:")).toBeInTheDocument();
        expect(screen.getByLabelText("AWS Session Token:")).toBeInTheDocument();
    });

    it("should display empty values when AWS data is not provided", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("");
        expect(secretKeyInput).toHaveValue("");
        expect(regionInput).toHaveValue("");
        expect(profileNameInput).toHaveValue("");
        expect(sessionTokenInput).toHaveValue("");
    });

    it("should display existing AWS values", () => {
        const awsData = {
            aws: {
                accessKey: "test-access-key",
                secretKey: "test-secret-key",
                region: "us-east-1",
                profileName: "test-profile",
                sessionToken: "test-session-token",
            },
        };

        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("test-access-key");
        expect(secretKeyInput).toHaveValue("test-secret-key");
        expect(regionInput).toHaveValue("us-east-1");
        expect(profileNameInput).toHaveValue("test-profile");
        expect(sessionTokenInput).toHaveValue("test-session-token");
    });

    it("should update AWS access key", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        fireEvent.change(accessKeyInput, { target: { value: "new-access-key" } });

        expect(accessKeyInput).toHaveValue("new-access-key");
    });

    it("should update AWS secret key", () => {
        renderAWSTab();

        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        fireEvent.change(secretKeyInput, { target: { value: "new-secret-key" } });

        expect(secretKeyInput).toHaveValue("new-secret-key");
    });

    it("should update AWS region", () => {
        renderAWSTab();

        const regionInput = screen.getByLabelText("AWS Region:");
        fireEvent.change(regionInput, { target: { value: "us-west-2" } });

        expect(regionInput).toHaveValue("us-west-2");
    });

    it("should update AWS profile name", () => {
        renderAWSTab();

        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        fireEvent.change(profileNameInput, { target: { value: "production-profile" } });

        expect(profileNameInput).toHaveValue("production-profile");
    });

    it("should update AWS session token", () => {
        renderAWSTab();

        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");
        fireEvent.change(sessionTokenInput, { target: { value: "new-session-token" } });

        expect(sessionTokenInput).toHaveValue("new-session-token");
    });

    it("should handle null AWS values", () => {
        const awsData = {
            aws: {
                accessKey: null,
                secretKey: null,
                region: null,
                profileName: null,
                sessionToken: null,
            },
        };

        // noinspection DuplicatedCode
        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("");
        expect(secretKeyInput).toHaveValue("");
        expect(regionInput).toHaveValue("");
        expect(profileNameInput).toHaveValue("");
        expect(sessionTokenInput).toHaveValue("");
    });

    it("should handle undefined AWS object", () => {
        const awsData = {
            aws: undefined,
        };

        // noinspection DuplicatedCode
        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("");
        expect(secretKeyInput).toHaveValue("");
        expect(regionInput).toHaveValue("");
        expect(profileNameInput).toHaveValue("");
        expect(sessionTokenInput).toHaveValue("");
    });

    it("should update multiple AWS fields sequentially", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");

        fireEvent.change(accessKeyInput, { target: { value: "sequential-access-key" } });
        fireEvent.change(regionInput, { target: { value: "eu-west-1" } });
        fireEvent.change(profileNameInput, { target: { value: "sequential-profile" } });

        expect(accessKeyInput).toHaveValue("sequential-access-key");
        expect(regionInput).toHaveValue("eu-west-1");
        expect(profileNameInput).toHaveValue("sequential-profile");
    });

    it("should preserve existing AWS values when updating a single field", () => {
        const awsData = {
            aws: {
                accessKey: "existing-access-key",
                secretKey: "existing-secret-key",
                region: "existing-region",
                profileName: "existing-profile",
                sessionToken: "existing-session-token",
            },
        };

        renderAWSTab(awsData);

        const regionInput = screen.getByLabelText("AWS Region:");
        fireEvent.change(regionInput, { target: { value: "updated-region" } });

        // Check that other fields retain their values
        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("existing-access-key");
        expect(secretKeyInput).toHaveValue("existing-secret-key");
        expect(regionInput).toHaveValue("updated-region");
        expect(profileNameInput).toHaveValue("existing-profile");
        expect(sessionTokenInput).toHaveValue("existing-session-token");
    });

    it("should handle partial AWS data", () => {
        const awsData = {
            aws: {
                accessKey: "partial-access-key",
                region: "partial-region",
                // secretKey, profileName, and sessionToken are undefined
            },
        };

        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveValue("partial-access-key");
        expect(secretKeyInput).toHaveValue("");
        expect(regionInput).toHaveValue("partial-region");
        expect(profileNameInput).toHaveValue("");
        expect(sessionTokenInput).toHaveValue("");
    });

    it("should clear AWS field values", () => {
        const awsData = {
            aws: {
                accessKey: "clear-access-key",
                secretKey: "clear-secret-key",
                region: "clear-region",
                profileName: "clear-profile",
                sessionToken: "clear-session-token",
            },
        };

        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const regionInput = screen.getByLabelText("AWS Region:");

        fireEvent.change(accessKeyInput, { target: { value: "" } });
        fireEvent.change(regionInput, { target: { value: "" } });

        expect(accessKeyInput).toHaveValue("");
        expect(regionInput).toHaveValue("");
    });

    it("should submit changes on modal submit", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const regionInput = screen.getByLabelText("AWS Region:");

        fireEvent.change(accessKeyInput, { target: { value: "submit-access-key" } });
        fireEvent.change(regionInput, { target: { value: "submit-region" } });

        expect(accessKeyInput).toHaveValue("submit-access-key");
        expect(regionInput).toHaveValue("submit-region");

        const submitButton = screen.getByTestId(`modal-submit-btn-${modelId}`);
        fireEvent.click(submitButton);

        // Re-open modal to verify changes were saved
        const openModalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(openModalButton);
        const awsTabButton = screen.getByTestId(`tab-id-model-config-aws-${modelId}`);
        fireEvent.click(awsTabButton);

        const accessKeyInputAfterSubmit = screen.getByLabelText("AWS Access Key:");
        const regionInputAfterSubmit = screen.getByLabelText("AWS Region:");

        expect(accessKeyInputAfterSubmit).toHaveValue("submit-access-key");
        expect(regionInputAfterSubmit).toHaveValue("submit-region");
    });

    it("should discard changes on modal cancel", () => {
        const awsData = {
            aws: {
                accessKey: "original-access-key",
                region: "original-region",
            },
        };

        renderAWSTab(awsData);

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const regionInput = screen.getByLabelText("AWS Region:");

        fireEvent.change(accessKeyInput, { target: { value: "changed-access-key" } });
        fireEvent.change(regionInput, { target: { value: "changed-region" } });

        expect(accessKeyInput).toHaveValue("changed-access-key");
        expect(regionInput).toHaveValue("changed-region");

        const cancelButton = screen.getByTestId(`modal-cancel-btn-${modelId}`);
        fireEvent.click(cancelButton);

        // Re-open modal to verify changes were discarded
        const openModalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(openModalButton);
        const awsTabButton = screen.getByTestId(`tab-id-model-config-aws-${modelId}`);
        fireEvent.click(awsTabButton);

        const accessKeyInputAfterCancel = screen.getByLabelText("AWS Access Key:");
        const regionInputAfterCancel = screen.getByLabelText("AWS Region:");

        expect(accessKeyInputAfterCancel).toHaveValue("original-access-key");
        expect(regionInputAfterCancel).toHaveValue("original-region");
    });

    it("should display proper placeholders", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveAttribute("placeholder", "AWS Access Key");
        expect(secretKeyInput).toHaveAttribute("placeholder", "AWS Secret Key");
        expect(regionInput).toHaveAttribute("placeholder", "AWS Region");
        expect(profileNameInput).toHaveAttribute("placeholder", "AWS Profile Name");
        expect(sessionTokenInput).toHaveAttribute("placeholder", "AWS Session Token");
    });

    it("should have correct input names", () => {
        renderAWSTab();

        const accessKeyInput = screen.getByLabelText("AWS Access Key:");
        const secretKeyInput = screen.getByLabelText("AWS Secret Key:");
        const regionInput = screen.getByLabelText("AWS Region:");
        const profileNameInput = screen.getByLabelText("AWS Profile Name:");
        const sessionTokenInput = screen.getByLabelText("AWS Session Token:");

        expect(accessKeyInput).toHaveAttribute("name", "aws-access-key");
        expect(secretKeyInput).toHaveAttribute("name", "aws-secret-key");
        expect(regionInput).toHaveAttribute("name", "aws-region");
        expect(profileNameInput).toHaveAttribute("name", "aws-profile-name");
        expect(sessionTokenInput).toHaveAttribute("name", "aws-session-token");
    });
});
