/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToToolsTab = () => {
    // Click on the Tools tab
    const toolsTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-tools`);
    expect(toolsTab).toBeInTheDocument();
    fireEvent.click(toolsTab);
};

const toolOverrides = {
    tools: [{ id: "test-tool1", executorId: agentId }],
};

describe("Tools tab", () => {
    it("should display the agent tools", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: toolOverrides,
            includeTools: true,
        });
        goToToolsTab();
        const toolName = screen.getByTestId(`tool-name-${agentId}-0`);
        expect(toolName).toBeInTheDocument();
        expect(toolName).toHaveTextContent("test tool1");
        const agentName = screen.getByTestId(`agent-name-${agentId}-0`);
        expect(agentName).toBeInTheDocument();
        expect(agentName).toHaveTextContent("Assistant");
    });
    it("should allow removing agent tools", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: toolOverrides,
            includeTools: true,
        });
        goToToolsTab();
        const removeToolButton = screen.getByTestId(`remove-agent-tool-${agentId}-0`);
        expect(removeToolButton).toBeInTheDocument();
        fireEvent.click(removeToolButton);
        await waitFor(() => {
            expect(screen.queryByTestId(`tool-name-${agentId}-0`)).toBeNull();
            expect(screen.queryByTestId(`agent-name-${agentId}-0`)).toBeNull();
        });
        submitAgentChanges();
    });
    it("should allow adding agent tools", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: toolOverrides,
            includeTools: true,
        });
        goToToolsTab();
        const selectTool = screen.getByLabelText("Tool:");
        expect(selectTool).toBeInTheDocument();
        selectEvent.openMenu(selectTool);
        await selectEvent.select(selectTool, "test tool2");
        const selectExecutor = screen.getByLabelText("Executor:");
        expect(selectExecutor).toBeInTheDocument();
        selectEvent.openMenu(selectExecutor);
        await selectEvent.select(selectExecutor, "Assistant");
        const addToolButton = screen.getByTestId(`add-agent-tool-${agentId}`);
        expect(addToolButton).toBeInTheDocument();
        fireEvent.click(addToolButton);
        await waitFor(() => {
            const toolName = screen.getByTestId(`tool-name-${agentId}-1`);
            expect(toolName).toBeInTheDocument();
            expect(toolName).toHaveTextContent("test tool2");
            const agentName = screen.getByTestId(`agent-name-${agentId}-1`);
            expect(agentName).toBeInTheDocument();
            expect(agentName).toHaveTextContent("Assistant");
        });
        submitAgentChanges();
    });
    it("should show a message if there are no tools", async () => {
        renderAgent("assistant", {
            openModal: true,
        });
        goToToolsTab();
        const noToolsMessage = screen.getByText("No tools found in the workspace");
        expect(noToolsMessage).toBeInTheDocument();
    });
});
