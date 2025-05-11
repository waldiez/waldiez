/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToCodeExecutionTab = () => {
    // Click on the Code Execution tab
    const codeExecutionTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-codeExecution`);
    expect(codeExecutionTab).toBeInTheDocument();
    fireEvent.click(codeExecutionTab);
};

const codeExecutionOverrides = {
    workDir: "/tmp",
    useDocker: true,
    timeout: 1000,
    lastNMessages: 10,
    functions: [],
};

describe("WaldiezAgentNode Code Execution Tab", () => {
    it("Shows the code execution tab", () => {
        renderAgent("user_proxy", {
            openModal: true,
        });
        goToCodeExecutionTab();
        const toggle = screen.getByTestId(`agent-code-execution-toggle-${agentId}`);
        expect(toggle).toBeInTheDocument();
        expect(toggle).not.toBeChecked(); // no code execution
    });
    it("It toggles the code execution", () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { codeExecutionConfig: codeExecutionOverrides },
        });
        goToCodeExecutionTab();
        const toggle = screen.getByTestId(`agent-code-execution-toggle-${agentId}`);
        expect(toggle).toBeInTheDocument();
        expect(toggle).toBeChecked();
        fireEvent.click(toggle);
        expect(toggle).not.toBeChecked();
        fireEvent.click(toggle);
        expect(toggle).toBeChecked();
        submitAgentChanges();
    });
    it("It updates the working directory", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: { codeExecutionConfig: codeExecutionOverrides },
        });
        goToCodeExecutionTab();
        const workDirInput = screen.getByTestId(`agent-code-execution-work-dir-${agentId}`);
        await userEvent.clear(workDirInput);
        await userEvent.type(workDirInput, "/new/tmp");
        expect(workDirInput).toHaveValue("/new/tmp");
        submitAgentChanges();
    });
    it("It updates the last N messages", () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { codeExecutionConfig: codeExecutionOverrides },
        });
        goToCodeExecutionTab();
        const lastNMessagesInput = screen.getByTestId(`agent-code-execution-last-n-messages-${agentId}`);
        fireEvent.change(lastNMessagesInput, {
            target: { value: "105" },
        });
        expect(lastNMessagesInput).toHaveValue(105);
        submitAgentChanges();
    });
    it("It updates the timeout", () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { codeExecutionConfig: codeExecutionOverrides },
        });
        goToCodeExecutionTab();
        const timeoutInput = screen.getByTestId(`agent-code-execution-timeout-${agentId}`);
        fireEvent.change(timeoutInput, {
            target: { value: "500" },
        });
        expect(timeoutInput).toHaveValue(500);
        submitAgentChanges();
    });
    it("It toggles the use docker", () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { codeExecutionConfig: codeExecutionOverrides },
        });
        goToCodeExecutionTab();
        const useDockerToggle = screen.getByTestId(`agent-code-execution-use-docker-${agentId}`);
        expect(useDockerToggle).toBeInTheDocument();
        expect(useDockerToggle).toBeChecked();
        fireEvent.click(useDockerToggle);
        expect(useDockerToggle).not.toBeChecked();
        submitAgentChanges();
    });
    it("It updates the functions", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: {
                codeExecutionConfig: {
                    ...codeExecutionOverrides,
                    useDocker: undefined,
                    functions: ["test-tool1"],
                },
            },
            includeTools: true,
        });
        goToCodeExecutionTab();
        const functionSelect = screen.getByLabelText("Functions:");
        selectEvent.openMenu(functionSelect);
        await selectEvent.select(functionSelect, ["test tool1", "test tool2"]);
        fireEvent.change(functionSelect, {
            target: [
                {
                    label: "test tool1",
                    value: "test-tool1",
                },
                {
                    label: "test tool2",
                    value: "test-tool2",
                },
            ],
        });
        submitAgentChanges();
    });
});
