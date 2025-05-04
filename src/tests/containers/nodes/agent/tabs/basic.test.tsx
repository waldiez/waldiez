/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId } from "../data";

describe("WaldiezAgentNode Basic Modal Tab", () => {
    it("Updates the agent type from user to rag_user", () => {
        renderAgent("user", { openModal: true });
        const ragToggle = screen.getByTestId(`agent-rag-toggle-${agentId}`);
        expect(ragToggle).not.toBeChecked();
        fireEvent.click(ragToggle);
        expect(ragToggle).toBeChecked();
        submitAgentChanges();
    });
    it("Updates the agent type from rag_user to user", () => {
        renderAgent("rag_user", { openModal: true });
        const ragToggle = screen.getByTestId(`agent-rag-toggle-${agentId}`);
        expect(ragToggle).toBeChecked();
        fireEvent.click(ragToggle);
        expect(ragToggle).not.toBeChecked();
        submitAgentChanges();
    });
    it("Updates the agent name", async () => {
        renderAgent("user", { openModal: true });
        const nameInput = screen.getByTestId(`agent-name-input-${agentId}`);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "New Name");
        expect(nameInput).toHaveValue("New Name");
        submitAgentChanges();
    });
    it("Updates the agent description", async () => {
        renderAgent("user", { openModal: true });
        const descriptionInput = screen.getByTestId(`agent-description-input-${agentId}`);
        await userEvent.clear(descriptionInput);
        await userEvent.type(descriptionInput, "New Description");
        expect(descriptionInput).toHaveValue("New Description");
        submitAgentChanges();
    });
    it("Updates the agent system message", async () => {
        renderAgent("user", { openModal: true });
        const systemMessageInput = screen.getByTestId(`agent-system-message-input-${agentId}`);
        await userEvent.clear(systemMessageInput);
        await userEvent.type(systemMessageInput, "New System Message");
        expect(systemMessageInput).toHaveValue("New System Message");
        submitAgentChanges();
    });
    it("Updates the agent human input mode", async () => {
        renderAgent("user", { openModal: true });
        const humanInputModeSelect = screen.getByLabelText("Human Input mode:");
        selectEvent.openMenu(humanInputModeSelect);
        await selectEvent.select(humanInputModeSelect, "Terminate");
        fireEvent.change(humanInputModeSelect, {
            target: {
                label: "Terminate",
                value: "TERMINATE",
            },
        });
        expect(humanInputModeSelect).toHaveValue("TERMINATE");
        submitAgentChanges();
    });
    it("Updates the agent max consecutive auto reply", async () => {
        renderAgent("user", {
            openModal: true,
            dataOverrides: { maxConsecutiveAutoReply: 300 },
        });
        const maxConsecutiveAutoReplyInput = screen.getByTestId(
            `agent-max-consecutive-auto-reply-input-${agentId}`,
        );
        await userEvent.clear(maxConsecutiveAutoReplyInput);
        await userEvent.type(maxConsecutiveAutoReplyInput, "400");
        expect(maxConsecutiveAutoReplyInput).toHaveValue(400);
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
        await userEvent.clear(maxConsecutiveAutoReplyInput);
        await userEvent.type(maxConsecutiveAutoReplyInput, "Auto reply");
        expect(maxConsecutiveAutoReplyInput).toHaveValue(null);
        submitAgentChanges();
    });
    it("Updates the agent default auto reply", async () => {
        renderAgent("assistant", { openModal: true });
        const agentDefaultAutoReplyInput = screen.getByTestId(`agent-default-auto-reply-input-${agentId}`);
        await userEvent.clear(agentDefaultAutoReplyInput);
        await userEvent.type(agentDefaultAutoReplyInput, "Default Auto Reply");
        expect(agentDefaultAutoReplyInput).toHaveValue("Default Auto Reply");
        submitAgentChanges();
    });
});
