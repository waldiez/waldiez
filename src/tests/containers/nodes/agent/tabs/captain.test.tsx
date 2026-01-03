/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToCaptainTab = () => {
    // Click on the Captain tab
    const terminationTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-captain`);
    expect(terminationTab).toBeInTheDocument();
    fireEvent.click(terminationTab);
};

describe("Captain tab", () => {
    it("should allow changing the max round", async () => {
        renderAgent("captain", {
            openModal: true,
        });
        goToCaptainTab();

        // Check that the max round is 10 (default)
        const maxRoundInput = screen.getByTestId(`agent-captain-max-round-${agentId}`);
        expect(maxRoundInput).toBeInTheDocument();
        expect(maxRoundInput).toHaveValue(10);
        // Change the max round
        fireEvent.change(maxRoundInput, { target: { value: "20" } });
        await waitFor(() => {
            // Check that the max round has been changed
            expect(maxRoundInput).toHaveValue(20);
        });
        submitAgentChanges();
    });
    it("should allow enabling the agent library", async () => {
        renderAgent("captain", {
            openModal: true,
        });
        goToCaptainTab();

        // Check that the agent library is disabled
        const agentLibToggle = screen.getByTestId(`agent-captain-toggle-agent-lib-${agentId}`);
        expect(agentLibToggle).toBeInTheDocument();
        expect(agentLibToggle).not.toBeChecked();
        // Enable the agent library
        fireEvent.click(agentLibToggle);
        await waitFor(() => {
            // Check that the agent library has been enabled
            expect(agentLibToggle).toBeChecked();
        });
    });
    it("should allow uploading an agent library", async () => {
        renderAgent("captain", {
            openModal: true,
        });
        goToCaptainTab();

        // Enable the agent library
        const agentLibToggle = screen.getByTestId(`agent-captain-toggle-agent-lib-${agentId}`);
        fireEvent.click(agentLibToggle);

        // Check that the agent library is empty
        const agentLib = screen.queryByTestId(`agent-lib-${agentId}`);
        expect(agentLib).not.toBeInTheDocument();
        // Upload an agent library
        const agentLibContents = [
            {
                name: "agent1",
                description: "description1",
                systemMessage: "systemMessage1",
            },
            {
                name: "agent2",
                description: "description2",
                systemMessage: "systemMessage2",
            },
            {
                name: "invalid",
            },
            {
                description: "invalid",
            },
            {
                systemMessage: "not sufficient",
            },
        ];
        const agentLibFile = new File([JSON.stringify(agentLibContents)], "agentLib.json", {
            type: "application/json",
        });
        const agentLibDropZone = screen.getByTestId(`drop-zone-${flowId}`);
        expect(agentLibDropZone).toBeInTheDocument();
        fireEvent.click(agentLibDropZone);
        const agentLibFileInput = screen.getByTestId("drop-zone-file-input");
        expect(agentLibFileInput).toBeInTheDocument();
        await userEvent.upload(agentLibFileInput, agentLibFile);
        await waitFor(() => {
            // Check that the agent library has been uploaded
            expect(screen.getByTestId(`agent-lib-${agentId}`)).toBeInTheDocument();
            // title={`Agent Library (${agentLib.length} entries)`}
            // Check that the agent library has the correct number of entries
            expect(screen.getByText("Agent Library (2 entries)")).toBeInTheDocument();
        });
        submitAgentChanges();
    });
    it("should allow disabling the agent library", async () => {
        renderAgent("captain", {
            openModal: true,
        });
        goToCaptainTab();

        // Enable the agent library
        const agentLibToggle = screen.getByTestId(`agent-captain-toggle-agent-lib-${agentId}`);
        fireEvent.click(agentLibToggle);

        // Disable the agent library
        fireEvent.click(agentLibToggle);
        await waitFor(() => {
            // Check that the agent library has been disabled
            expect(agentLibToggle).not.toBeChecked();
        });
    });
    it("should allow changing the tool lib", async () => {
        renderAgent("captain", {
            openModal: true,
        });
        goToCaptainTab();

        // Check that the tool lib is disabled
        const toolLibToggle = screen.getByTestId(`tool-lib-${agentId}`);
        expect(toolLibToggle).toBeInTheDocument();
        expect(toolLibToggle).not.toBeChecked();
        // Enable the tool lib
        fireEvent.click(toolLibToggle);
        await waitFor(() => {
            // Check that the tool lib has been enabled
            expect(toolLibToggle).toBeChecked();
        });
        submitAgentChanges();
    });
});
