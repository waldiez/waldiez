/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

const goToGroupManagerTab = () => {
    // Click on the Group Manager tab
    const groupManagerTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}`);
    expect(groupManagerTab).toBeInTheDocument();
    fireEvent.click(groupManagerTab);
};

const goToConfigTab = () => {
    goToGroupManagerTab();
    const configTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-config`);
    expect(configTab).toBeInTheDocument();
    fireEvent.click(configTab);
};

describe("Group Manager config tab", () => {
    it("should display the Group Manager config tab", () => {
        renderAgent("manager", { openModal: true });
        goToConfigTab();
    });
    it("should update the admin name", () => {
        renderAgent("manager", { openModal: true });
        goToConfigTab();
        const adminNameInput = screen.getByTestId(`manager-admin-name-input-${agentId}`) as HTMLInputElement;
        expect(adminNameInput).toBeInTheDocument();
        fireEvent.change(adminNameInput, {
            target: { value: "Administrator" },
        });
        expect(adminNameInput.value).toBe("Administrator");
        submitAgentChanges();
    });
    it("should update the max rounds", () => {
        renderAgent("manager", {
            openModal: true,
            dataOverrides: {
                maxRound: 5,
            },
        });
        goToConfigTab();
        const maxRoundsInput = screen.getByTestId(`manager-max-rounds-input-${agentId}`) as HTMLInputElement;
        expect(maxRoundsInput).toBeInTheDocument();
        fireEvent.change(maxRoundsInput, {
            target: { value: "10" },
        });
        expect(maxRoundsInput.value).toBe("10");
        submitAgentChanges();
    });
    it("should update the enable clear history checkbox", () => {
        renderAgent("manager", {
            openModal: true,
            dataOverrides: {
                enableClearHistory: true,
            },
        });
        goToConfigTab();
        const enableClearHistoryCheckbox = screen.getByTestId(
            `manager-enable-clear-history-checkbox-${agentId}`,
        ) as HTMLInputElement;
        expect(enableClearHistoryCheckbox).toBeInTheDocument();
        fireEvent.click(enableClearHistoryCheckbox);
        expect(enableClearHistoryCheckbox.checked).toBe(false);
        submitAgentChanges();
    });
    it("should update the send introductions checkbox", () => {
        renderAgent("manager", {
            openModal: true,
            dataOverrides: {
                sendIntroductions: false,
            },
        });
        goToConfigTab();
        const sendIntroductionsCheckbox = screen.getByTestId(
            `manager-send-introductions-checkbox-${agentId}`,
        ) as HTMLInputElement;
        expect(sendIntroductionsCheckbox).toBeInTheDocument();
        fireEvent.click(sendIntroductionsCheckbox);
        expect(sendIntroductionsCheckbox.checked).toBe(true);
        submitAgentChanges();
    });
    it("should update the max retries for selecting speaker", () => {
        renderAgent("manager", {
            openModal: true,
            dataOverrides: {
                speakers: {
                    maxRetriesForSelecting: 5,
                },
            },
        });
        goToConfigTab();
        const maxRetriesForSelectingInput = screen.getByTestId(
            `manager-max-retries-for-selecting-input-${agentId}`,
        ) as HTMLInputElement;
        expect(maxRetriesForSelectingInput).toBeInTheDocument();
        fireEvent.change(maxRetriesForSelectingInput, {
            target: { value: "10" },
        });
        expect(maxRetriesForSelectingInput.value).toBe("10");
        submitAgentChanges();
    });
});
