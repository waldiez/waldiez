/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

const goToReasoningTab = () => {
    // Click on the Reasoning tab
    const terminationTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-reasoning-${agentId}`);
    expect(terminationTab).toBeInTheDocument();
    fireEvent.click(terminationTab);
};

describe("Reasoning tab", () => {
    it("should allow changing the verbose setting", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Check that the verbose setting is on (default)
        const verboseCheckbox = screen.getByTestId(`agent-reasoning-verbose-toggle-${agentId}`);
        expect(verboseCheckbox).toBeInTheDocument();
        expect(verboseCheckbox).toBeChecked();
        // Turn on the verbose setting
        fireEvent.click(verboseCheckbox);
        // Check that the verbose setting is off
        expect(verboseCheckbox).not.toBeChecked();
        submitAgentChanges();
    });
    it("should allow changing the reasoning method", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Select the reasoning method
        const reasoningMethodSelect = screen.getByLabelText("Reasoning Method:");
        expect(reasoningMethodSelect).toBeInTheDocument();
        selectEvent.openMenu(reasoningMethodSelect);
        await selectEvent.select(reasoningMethodSelect, "Monte Carlo Tree Search");
        fireEvent.change(reasoningMethodSelect, {
            target: { label: "Monte Carlo Tree Search", value: "mcts" },
        });
        // Check that the reasoning method has been changed
        expect(reasoningMethodSelect).toHaveValue("mcts");
        submitAgentChanges();
    });
    it("should allow changing the max depth", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Change the max depth
        const maxDepthInput = screen.getByLabelText("Max Depth:");
        expect(maxDepthInput).toBeInTheDocument();
        expect(maxDepthInput).not.toHaveValue(5);
        fireEvent.change(maxDepthInput, { target: { value: 5 } });
        // Check that the max depth has been changed
        expect(maxDepthInput).toHaveValue(5);
        submitAgentChanges();
    });
    it("should allow changing the forest size", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Change the forest size
        const forestSizeInput = screen.getByLabelText("Forest Size:");
        expect(forestSizeInput).toBeInTheDocument();
        expect(forestSizeInput).not.toHaveValue(6);
        fireEvent.change(forestSizeInput, { target: { value: 6 } });
        // Check that the forest size has been changed
        expect(forestSizeInput).toHaveValue(6);
        submitAgentChanges();
    });
    it("should allow changing the rating scale", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Change the rating scale
        const ratingScaleInput = screen.getByLabelText("Rating Scale:");
        expect(ratingScaleInput).toBeInTheDocument();
        expect(ratingScaleInput).not.toHaveValue(7);
        fireEvent.change(ratingScaleInput, { target: { value: 7 } });
        // Check that the rating scale has been changed
        expect(ratingScaleInput).toHaveValue(7);
        submitAgentChanges();
    });
    it("should allow changing the beam size", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Change the beam size
        const beamSizeInput = screen.getByLabelText("Beam Size:");
        expect(beamSizeInput).toBeInTheDocument();
        expect(beamSizeInput).not.toHaveValue(8);
        fireEvent.change(beamSizeInput, { target: { value: 8 } });
        // Check that the beam size has been changed
        expect(beamSizeInput).toHaveValue(8);
        submitAgentChanges();
    });
    it("should allow changing the answer approach", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // Select the answer approach
        const answerApproachSelect = screen.getByLabelText("Answer Approach:");
        expect(answerApproachSelect).toBeInTheDocument();
        selectEvent.openMenu(answerApproachSelect);
        await selectEvent.select(answerApproachSelect, "Best");
        fireEvent.change(answerApproachSelect, {
            target: { label: "Best", value: "best" },
        });
        // Check that the answer approach has been changed
        expect(answerApproachSelect).toHaveValue("best");
        submitAgentChanges();
    });
    it("should allow changing the number of simulations", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // change the method to MCTS
        const reasoningMethodSelect = screen.getByLabelText("Reasoning Method:");
        expect(reasoningMethodSelect).toBeInTheDocument();
        selectEvent.openMenu(reasoningMethodSelect);
        await selectEvent.select(reasoningMethodSelect, "Monte Carlo Tree Search");
        fireEvent.change(reasoningMethodSelect, {
            target: { label: "Monte Carlo Tree Search", value: "mcts" },
        });

        // Change the number of simulations
        const nsimInput = screen.getByLabelText("Number of Simulations:");
        expect(nsimInput).toBeInTheDocument();
        expect(nsimInput).not.toHaveValue(9);
        fireEvent.change(nsimInput, { target: { value: 9 } });
        // Check that the number of simulations has been changed
        expect(nsimInput).toHaveValue(9);
        submitAgentChanges();
    });
    it("should allow changing the exploration constant", async () => {
        renderAgent("reasoning", {
            openModal: true,
        });
        goToReasoningTab();

        // change the method to LATS
        const reasoningMethodSelect = screen.getByLabelText("Reasoning Method:");
        expect(reasoningMethodSelect).toBeInTheDocument();
        selectEvent.openMenu(reasoningMethodSelect);
        await selectEvent.select(reasoningMethodSelect, "Language Agent Tree Search");
        fireEvent.change(reasoningMethodSelect, {
            target: { label: "Language Agent Tree Search", value: "lats" },
        });

        // Change the exploration constant
        const explorationConstantInput = screen.getByLabelText("Exploration Constant:");
        expect(explorationConstantInput).toBeInTheDocument();
        expect(explorationConstantInput).not.toHaveValue(2.71);
        fireEvent.change(explorationConstantInput, { target: { value: 2.71 } });
        // Check that the exploration constant has been changed
        expect(explorationConstantInput).toHaveValue(2.71);
        submitAgentChanges();
    });
});
