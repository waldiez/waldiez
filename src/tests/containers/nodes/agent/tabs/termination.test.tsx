/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToTerminationTab = () => {
    // Click on the Termination tab
    const terminationTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-termination`);
    expect(terminationTab).toBeInTheDocument();
    fireEvent.click(terminationTab);
};

const terminationOverrides = {
    type: "keyword",
    keywords: ["TERMINATE", "DONE"],
    criterion: "ending",
    methodContent: null,
};

describe("Termination tab", () => {
    it("should allow changing the termination type", async () => {
        renderAgent("user_proxy", {
            openModal: true,
        });
        goToTerminationTab();

        // Select the termination type
        const terminationTypeSelect = screen.getByLabelText("Termination Type:");
        expect(terminationTypeSelect).toBeInTheDocument();
        selectEvent.openMenu(terminationTypeSelect);
        await selectEvent.select(terminationTypeSelect, "Method");
        fireEvent.change(terminationTypeSelect, {
            target: { label: "Method", value: "method" },
        });

        // Check that the termination type has been changed
        expect(terminationTypeSelect).toHaveValue("method");
        submitAgentChanges();
    });

    it("should allow changing the termination method", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: { termination: terminationOverrides },
        });
        goToTerminationTab();

        // Select the termination type
        const terminationTypeSelect = screen.getByLabelText("Termination Type:");
        expect(terminationTypeSelect).toBeInTheDocument();
        await selectEvent.select(terminationTypeSelect, "Method");
        fireEvent.change(terminationTypeSelect, {
            target: { label: "Method", value: "method" },
        });

        // Check that the termination type has been changed
        expect(terminationTypeSelect).toHaveValue("method");

        await waitFor(() => {
            expect(screen.queryByTestId("mocked-monaco-editor")).toBeInTheDocument();
        });
        // Change the termination method
        const terminationMethodEditor = screen.getByTestId("mocked-monaco-editor");
        // expect(terminationMethodEditor).toBeInTheDocument();
        fireEvent.change(terminationMethodEditor, {
            target: { value: 'print("Hello, World!")' },
        });
        // Check that the termination method has been changed
        await waitFor(() => {
            expect(terminationMethodEditor).toHaveValue('print("Hello, World!")');
        });
        submitAgentChanges();
    });

    it("should allow changing the termination criterion", async () => {
        renderAgent("rag_user_proxy", {
            openModal: true,
        });
        goToTerminationTab();

        // Select the termination type
        const terminationTypeSelect = screen.getByLabelText("Termination Type:");
        expect(terminationTypeSelect).toBeInTheDocument();
        await selectEvent.select(terminationTypeSelect, "Keyword");
        fireEvent.change(terminationTypeSelect, {
            target: { label: "Keyword", value: "keyword" },
        });
        await waitFor(() => {
            // Check that the termination type has been changed
            expect(terminationTypeSelect).toHaveValue("keyword");
            expect(screen.queryByLabelText("Termination Criterion:")).toBeInTheDocument();
        });

        // Select the termination criterion
        const terminationCriterionSelect = screen.getByLabelText("Termination Criterion:");
        await selectEvent.select(terminationCriterionSelect, "Keyword is the last word");
        fireEvent.change(terminationCriterionSelect, {
            target: { label: "Keyword is the last word", value: "ending" },
        });

        await waitFor(() => {
            // Check that the termination criterion has been changed
            expect(terminationCriterionSelect).toHaveValue("ending");
        });
        submitAgentChanges();
    });

    it("should allow to add a termination keyword", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: { termination: terminationOverrides },
        });
        goToTerminationTab();

        // Add a termination keyword
        const terminationKeywordInput = screen.getByTestId("new-list-entry-termination-keyword-item");
        expect(terminationKeywordInput).toBeInTheDocument();
        fireEvent.change(terminationKeywordInput, {
            target: { value: "STOP" },
        });
        const addTerminationKeywordButton = screen.getByTestId("add-list-entry-termination-keyword-button");
        expect(addTerminationKeywordButton).toBeInTheDocument();
        fireEvent.click(addTerminationKeywordButton);

        await waitFor(() => {
            expect(screen.queryByTestId("list-entry-item-termination-keyword-2")).toBeInTheDocument();
        });
        // Check that the termination keyword has been added
        const terminationKeyword = screen.getByTestId("list-entry-item-termination-keyword-2");
        expect(terminationKeyword).toHaveValue("STOP");
        submitAgentChanges();
    });

    it("should allow to delete a termination keyword", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: { termination: terminationOverrides },
        });
        goToTerminationTab();

        // Delete a termination keyword
        const deleteTerminationKeywordButton = screen.getByTestId("delete-list-entry-termination-keyword-1");
        expect(deleteTerminationKeywordButton).toBeInTheDocument();
        fireEvent.click(deleteTerminationKeywordButton);

        await waitFor(() => {
            expect(screen.queryByTestId("list-entry-item-termination-keyword-1")).not.toBeInTheDocument();
        });
        submitAgentChanges();
    });

    it("should allow changing a termination keyword", async () => {
        renderAgent("rag_user_proxy", {
            openModal: true,
            dataOverrides: { termination: terminationOverrides },
        });
        goToTerminationTab();

        // Change a termination keyword
        const terminationKeywordInput = screen.getByTestId("list-entry-item-termination-keyword-0");
        expect(terminationKeywordInput).toBeInTheDocument();
        await userEvent.clear(terminationKeywordInput);

        fireEvent.change(terminationKeywordInput, { target: { value: "TERMINATE_KEY" } });

        await waitFor(() => {
            // Check that the termination keyword has been changed
            expect(terminationKeywordInput).toHaveValue("TERMINATE_KEY");
        });
    });
});
