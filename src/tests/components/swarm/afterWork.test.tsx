/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { AfterWork } from "@waldiez/components/swarm/afterWork";
import { WaldiezAgentSwarm, WaldiezNodeAgentSwarm, agentMapper } from "@waldiez/models";
import { DEFAULT_CUSTOM_AFTER_WORK_RECIPIENT_METHOD_CONTENT } from "@waldiez/models/Agent/Swarm/AfterWork";

describe("AfterWork", () => {
    let onChange: any;
    let props: any;
    let agent1Node: WaldiezNodeAgentSwarm;
    let agent2Node: WaldiezNodeAgentSwarm;

    beforeEach(() => {
        const agent1 = WaldiezAgentSwarm.create("swarm");
        const agent2 = WaldiezAgentSwarm.create("swarm");
        agent1Node = agentMapper.asNode(agent1) as WaldiezNodeAgentSwarm;
        agent2Node = agentMapper.asNode(agent2) as WaldiezNodeAgentSwarm;
        agent1Node.data.label = "Agent 1";
        agent2Node.data.label = "Agent 2";
        onChange = vi.fn();
        props = {
            agents: [agent1Node, agent2Node],
            value: null,
            darkMode: false,
            onChange,
        };
    });

    it("renders", () => {
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
    });

    it("renders enabled", () => {
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("checkbox"));
        expect(screen.getByText("Recipient Type:")).toBeInTheDocument();
    });

    it("renders disabled", () => {
        props.value = {
            recipientType: "option",
            recipient: "TERMINATE",
        };
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        expect(screen.getByText("Recipient Type:")).toBeInTheDocument();
    });

    it("disables", () => {
        props.value = {
            recipientType: "option",
            recipient: "TERMINATE",
        };
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        fireEvent.click(screen.getByRole("checkbox"));
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("renders option", () => {
        props.value = {
            recipientType: "option",
            recipient: "SWARM_CONTAINER",
        };
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        expect(screen.getByText("Recipient Type:")).toBeInTheDocument();
    });

    it("renders agent", () => {
        props.value = {
            recipientType: "agent",
            recipient: agent1Node.id,
        };
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        expect(screen.getByText("Recipient Type:")).toBeInTheDocument();
    });

    it("renders callable", () => {
        props.value = {
            recipientType: "callable",
            recipient: DEFAULT_CUSTOM_AFTER_WORK_RECIPIENT_METHOD_CONTENT,
        };
        render(<AfterWork {...props} />);
        expect(screen.getByText("Include After Work")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeChecked();
        expect(screen.getByText("Recipient Type:")).toBeInTheDocument();
    });

    it("calls onChange with recipient type", async () => {
        render(<AfterWork {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        const select = screen.getByLabelText("Recipient Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Agent"), "Agent");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "agent",
            recipient: "",
        });
    });
    it("calls onChange with recipient option", async () => {
        render(<AfterWork {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        const select = screen.getByLabelText("Recipient:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Revert to User"), "Revert to User");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "option",
            recipient: "REVERT_TO_USER",
        });
    });
    it("switches recipient option", async () => {
        props.value = {
            recipientType: "option",
            recipient: "REVERT_TO_USER",
        };
        render(<AfterWork {...props} />);
        const select = screen.getByLabelText("Recipient:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Terminate"), "Terminate");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "option",
            recipient: "TERMINATE",
        });
    });

    it("switches type", async () => {
        props.value = {
            recipientType: "agent",
            recipient: agent1Node.id,
        };
        render(<AfterWork {...props} />);
        const select = screen.getByLabelText("Recipient Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Option"), "Option");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "option",
            recipient: "TERMINATE",
        });
    });
    it("calls onChange with recipient agent", async () => {
        render(<AfterWork {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        let select = screen.getByLabelText("Recipient Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Agent"), "Agent");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "agent",
            recipient: "",
        });
        select = screen.getByLabelText("Recipient:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Agent 2"), "Agent 2");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "agent",
            recipient: agent2Node.id,
        });
    });
    it("changes to callable", async () => {
        render(<AfterWork {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        const select = screen.getByLabelText("Recipient Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Custom Function"), "Custom Function");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "callable",
            recipient: DEFAULT_CUSTOM_AFTER_WORK_RECIPIENT_METHOD_CONTENT,
        });
    });
    it("handles callable change", async () => {
        render(<AfterWork {...props} />);
        fireEvent.click(screen.getByRole("checkbox"));
        const select = screen.getByLabelText("Recipient Type:");
        expect(select).toBeInTheDocument();
        selectEvent.openMenu(select);
        await selectEvent.select(screen.getByText("Custom Function"), "Custom Function");
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "callable",
            recipient: DEFAULT_CUSTOM_AFTER_WORK_RECIPIENT_METHOD_CONTENT,
        });
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toBeInTheDocument();
        fireEvent.change(editor, { target: { value: "new content" } });
        expect(onChange).toHaveBeenCalledWith({
            recipientType: "callable",
            recipient: "new content",
        });
    });
});
