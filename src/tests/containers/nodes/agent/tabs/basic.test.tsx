/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId } from "../data";

describe("WaldiezAgentNode Basic Modal Tab", () => {
    it("Updates the agent type from user_proxy to rag_user_proxy", () => {
        renderAgent("user_proxy", { openModal: true });
        const ragToggle = screen.getByTestId(`agent-rag-toggle-${agentId}`);
        expect(ragToggle).not.toBeChecked();
        fireEvent.click(ragToggle);
        expect(ragToggle).toBeChecked();
        submitAgentChanges();
    });
    it("Updates the agent type from rag_user_proxy to user_proxy", () => {
        renderAgent("rag_user_proxy", { openModal: true });
        const ragToggle = screen.getByTestId(`agent-rag-toggle-${agentId}`);
        expect(ragToggle).toBeChecked();
        fireEvent.click(ragToggle);
        expect(ragToggle).not.toBeChecked();
        submitAgentChanges();
    });
    it("Updates the agent name", async () => {
        renderAgent("user_proxy", { openModal: true });
        const nameInput = screen.getByTestId(`agent-name-input-${agentId}`);
        fireEvent.change(nameInput, {
            target: { value: "New Name" },
        });
        await waitFor(() => {
            expect(nameInput).toHaveValue("New Name");
        });
        submitAgentChanges();
    });
    it("Updates the agent description", async () => {
        renderAgent("user_proxy", { openModal: true });
        const descriptionInput = screen.getByTestId(`agent-description-input-${agentId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "New Description" },
        });
        await waitFor(() => {
            expect(descriptionInput).toHaveValue("New Description");
        });
        submitAgentChanges();
    });
    it("Updates the agent system message", async () => {
        renderAgent("user_proxy", { openModal: true });
        const systemMessageInput = screen.getByTestId(`agent-system-message-input-${agentId}`);
        fireEvent.change(systemMessageInput, {
            target: { value: "New System Message" },
        });
        await waitFor(() => {
            expect(systemMessageInput).toHaveValue("New System Message");
        });
        submitAgentChanges();
    });
    it("Updates the agent human input mode", async () => {
        renderAgent("user_proxy", { openModal: true });
        const humanInputModeSelect = screen.getByLabelText("Human Input mode:");
        selectEvent.openMenu(humanInputModeSelect);
        await selectEvent.select(humanInputModeSelect, "Terminate");
        fireEvent.change(humanInputModeSelect, {
            target: {
                label: "Terminate",
                value: "TERMINATE",
            },
        });
        await waitFor(() => {
            expect(humanInputModeSelect).toHaveValue("TERMINATE");
        });
        submitAgentChanges();
    });
    it("Updates the agent max consecutive auto reply", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { maxConsecutiveAutoReply: 300 },
        });
        const maxConsecutiveAutoReplyInput = screen.getByTestId(
            `agent-max-consecutive-auto-reply-input-${agentId}`,
        );
        fireEvent.change(maxConsecutiveAutoReplyInput, {
            target: { value: "400" },
        });
        await waitFor(() => {
            expect(maxConsecutiveAutoReplyInput).toHaveValue(400);
        });
        submitAgentChanges();
    });
    it("Updates the agent max consecutive auto reply", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: { maxConsecutiveAutoReply: 300 },
        });
        const maxConsecutiveAutoReplyInput = screen.getByTestId(
            `agent-max-consecutive-auto-reply-input-${agentId}`,
        );
        fireEvent.change(maxConsecutiveAutoReplyInput, {
            target: { value: "301" },
        });
        await waitFor(() => {
            expect(maxConsecutiveAutoReplyInput).toHaveValue(301);
        });
        submitAgentChanges();
    });
    it("Updates the agent default auto reply", async () => {
        renderAgent("assistant", { openModal: true });
        const agentDefaultAutoReplyInput = screen.getByTestId(`agent-default-auto-reply-input-${agentId}`);
        fireEvent.change(agentDefaultAutoReplyInput, {
            target: { value: "Default Auto Reply" },
        });
        await waitFor(() => {
            // Check that the default auto reply has been changed
            expect(agentDefaultAutoReplyInput).toHaveValue("Default Auto Reply");
        });
        submitAgentChanges();
    });
});
