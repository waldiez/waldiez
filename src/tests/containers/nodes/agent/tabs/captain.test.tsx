/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

const goToCaptainTab = () => {
    // Click on the Captain tab
    const terminationTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-captain-${agentId}`);
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
        // Check that the max round has been changed
        expect(maxRoundInput).toHaveValue(20);
        submitAgentChanges();
    });
    // it("should allow changing the max turns", async () => {
    //     renderAgent("captain", {
    //         openModal: true,
    //     });
    //     goToCaptainTab();

    //     // Check that the max turns is 5 (default)
    //     const maxTurnsInput = screen.getByTestId(`agent-captain-max-turns-${agentId}`);
    //     expect(maxTurnsInput).toBeInTheDocument();
    //     expect(maxTurnsInput).toHaveValue(5);
    //     // Change the max turns
    //     fireEvent.change(maxTurnsInput, { target: { value: "10" } });
    //     // Check that the max turns has been changed
    //     expect(maxTurnsInput).toHaveValue(10);
    //     submitAgentChanges();
    // });
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
        // Check that the agent library has been enabled
        expect(agentLibToggle).toBeChecked();
        // submitAgentChanges(); not enabled, we need a change in the agent lib
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
        // Check that the agent library has been uploaded
        expect(screen.getByTestId(`agent-lib-${agentId}`)).toBeInTheDocument();
        // title={`Agent Library (${agentLib.length} entries)`}
        // Check that the agent library has the correct number of entries
        expect(screen.getByText("Agent Library (2 entries)")).toBeInTheDocument();
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
        // Check that the agent library has been disabled
        expect(agentLibToggle).not.toBeChecked();
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
        // Check that the tool lib has been enabled
        expect(toolLibToggle).toBeChecked();
        submitAgentChanges();
    });
});
