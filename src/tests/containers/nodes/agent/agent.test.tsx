/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Mock, describe, expect, it } from "vitest";

import { renderAgent } from "./common";
import { agentId, flowId, getAgentData } from "./data";

describe("WaldiezAgentNode", () => {
    const user = userEvent.setup({
        applyAccept: false,
    });
    it("should render", () => {
        renderAgent("user_proxy");
    });
    it("should open a user's modal", () => {
        renderAgent("rag_user_proxy");
        const editButton = screen.getByTestId(`open-agent-node-modal-${agentId}`);
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should not open a user's modal if it's already open", () => {
        renderAgent("rag_user_proxy", { openModal: true });
        const editButton = screen.getByTestId(`open-agent-node-modal-${agentId}`);
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
        (HTMLDialogElement.prototype.showModal as Mock).mockClear();
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
    });
    it("should open an assistant's modal", () => {
        renderAgent("assistant");
        const editButton = screen.getByTestId(`open-agent-node-modal-${agentId}`);
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should open a rag user's modal", () => {
        renderAgent("rag_user_proxy");
        const editButton = screen.getByTestId(`open-agent-node-modal-${agentId}`);
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should import a user agent", async () => {
        renderAgent("assistant", { openModal: true });
        const labelViewInput = screen.getByTestId(`agent-name-input-${agentId}`);
        expect(labelViewInput).toHaveValue("Assistant");
        const agentData = getAgentData("user_proxy");
        const importInputElement = screen.getByTestId(`file-upload-agent-${flowId}-${agentId}`);
        const modalView = screen.getByTestId(`wf-${flowId}-agent-modal-${agentId}`);
        expect(modalView).toBeInTheDocument();
        const importData = structuredClone({
            type: "agent",
            agentType: "rag_user_proxy",
            data: { ...(agentData as any), name: "user_proxy" },
        });
        const newFile = new File([JSON.stringify(importData)], "test.waldiezAgent");
        const importInput = importInputElement as HTMLInputElement;
        await user.upload(importInput, [newFile]);
    });
    it("should import an assistant agent", async () => {
        renderAgent("captain", { openModal: true });
        const labelViewInput = screen.getByTestId(`agent-name-input-${agentId}`);
        expect(labelViewInput).toHaveValue("Captain");
        const agentData = getAgentData("assistant");
        const importInput = screen.getByTestId(`file-upload-agent-${flowId}-${agentId}`);
        const importData = {
            id: agentId,
            type: "agent",
            agentType: "assistant",
            data: { ...(agentData as any) },
        };
        await user.upload(importInput, [new File([JSON.stringify(importData)], "test.waldiezAgent")]);
    });

    it("should import a rag user agent", async () => {
        renderAgent("assistant", { openModal: true });
        const labelViewInput = screen.getByTestId(`agent-name-input-${agentId}`);
        expect(labelViewInput).toHaveValue("Assistant");
        const agentData = getAgentData("rag_user_proxy");
        const importInput = screen.getByTestId(`file-upload-agent-${flowId}-${agentId}`);
        const importData = {
            id: agentId,
            type: "agent",
            agentType: "rag_user_proxy",
            data: { ...(agentData as any) },
        };
        await user.upload(importInput, [new File([JSON.stringify(importData)], "test.waldiezAgent")]);
    });
    // it("should export a user agent", () => {
    //     renderAgent("user_proxy", {
    //         openModal: true,
    //         dataOverrides: {
    //             nestedChats: [
    //                 {
    //                     triggeredBy: [{ id: "test", isReply: false }],
    //                     messages: [{ id: "test", isReply: true }],
    //                 },
    //             ],
    //         },
    //     });
    //     const exportButton = screen.getByTestId(`export-agent-${flowId}-${agentId}`);
    //     fireEvent.click(exportButton);
    //     expect(window.URL.createObjectURL).toHaveBeenCalled();
    //     expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    //     expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    // });
    it("should export a rag user agent", () => {
        renderAgent("rag_user_proxy", {
            openModal: true,
            dataOverrides: {
                nestedChats: [
                    {
                        triggeredBy: [{ id: "test", isReply: false }],
                        messages: [{ id: "test", isReply: true }],
                    },
                ],
            },
        });
        const exportButton = screen.getByTestId(`export-agent-${flowId}-${agentId}`);
        fireEvent.click(exportButton);
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalled();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
    it("should export an assistant agent", () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: {
                codeExecutionConfig: {
                    workDir: undefined,
                    useDocker: undefined,
                    timeout: 10,
                    lastNMessages: "auto",
                    functions: ["tool1", "tool2"],
                },
            },
        });
        const exportButton = screen.getByTestId(`export-agent-${flowId}-${agentId}`);
        fireEvent.click(exportButton);
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalled();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
});
