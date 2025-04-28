/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAgent } from "../../common";
import { agentId, flowId } from "../../data";

const goToGroupManagerTab = () => {
    // Click on the Group Manager tab
    const groupManagerTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}`);
    expect(groupManagerTab).toBeInTheDocument();
    fireEvent.click(groupManagerTab);
};

describe("Group Manager tab", () => {
    it("should display the Group Manager tab", () => {
        renderAgent("manager", { openModal: true });
        goToGroupManagerTab();
        const groupManagerTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}`);
        expect(groupManagerTab).toBeInTheDocument();
    });
    it("should display the Group Manager sub-tabs", () => {
        renderAgent("manager", { openModal: true });
        goToGroupManagerTab();
        const configTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-config`);
        expect(configTab).toBeInTheDocument();
        const speakersTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-speakers`);
        expect(speakersTab).toBeInTheDocument();
    });
    it("should change the active tab", () => {
        renderAgent("manager", { openModal: true });
        goToGroupManagerTab();
        const configTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-config`);
        const speakersTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-speakers`);
        expect(configTab).toBeInTheDocument();
        expect(speakersTab).toBeInTheDocument();
        fireEvent.click(speakersTab);
        expect(configTab).not.toHaveClass("tab-btn--active");
        expect(speakersTab).toHaveClass("tab-btn--active");
    });
});
