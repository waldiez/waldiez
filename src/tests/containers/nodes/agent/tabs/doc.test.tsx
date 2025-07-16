/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect } from "vitest";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToDocumentsTab = () => {
    // Click on the Documents tab
    const docTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-documents`);
    expect(docTab).toBeInTheDocument();
    fireEvent.click(docTab);
};

describe("Documents tab", () => {
    it("should render the Documents tab", () => {
        renderAgent("doc_agent", {
            openModal: true,
        });
        goToDocumentsTab();
        const docTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-documents`);
        expect(docTab).toBeInTheDocument();
    });
    it("should allow changing the collection name", () => {
        renderAgent("doc_agent", {
            openModal: true,
        });
        goToDocumentsTab();
        const collectionNameInput = screen.getByTestId(`input-id-wf-${flowId}-wa-${agentId}-collection-name`);
        expect(collectionNameInput).toBeInTheDocument();
        fireEvent.change(collectionNameInput, { target: { value: "New Collection Name" } });
        expect(collectionNameInput).toHaveValue("New Collection Name");
        submitAgentChanges();
    });
    it("should allow toggling reset collection", () => {
        renderAgent("doc_agent", {
            openModal: true,
        });
        goToDocumentsTab();
        const resetCollectionCheckbox = screen.getByTestId(
            `checkbox-id-wf-${flowId}-wa-${agentId}-reset-collection`,
        );
        expect(resetCollectionCheckbox).toBeInTheDocument();
        fireEvent.click(resetCollectionCheckbox);
        expect(resetCollectionCheckbox).toBeChecked();
        submitAgentChanges();
    });
    it("should allow enabling query citations", () => {
        renderAgent("doc_agent", {
            openModal: true,
        });
        goToDocumentsTab();
        const enableQueryCitationsCheckbox = screen.getByTestId(
            `checkbox-id-wf-${flowId}-wa-${agentId}-enable-query-citations`,
        );
        expect(enableQueryCitationsCheckbox).toBeInTheDocument();
        fireEvent.click(enableQueryCitationsCheckbox);
        expect(enableQueryCitationsCheckbox).toBeChecked();
        submitAgentChanges();
    });
    it("should allow changing the database path", () => {
        renderAgent("doc_agent", {
            openModal: true,
        });
        goToDocumentsTab();
        const dbPathInput = screen.getByTestId(`input-id-wf-${flowId}-wa-${agentId}-db-path`);
        expect(dbPathInput).toBeInTheDocument();
        fireEvent.change(dbPathInput, { target: { value: "/new/db/path" } });
        expect(dbPathInput).toHaveValue("/new/db/path");
        submitAgentChanges();
    });
});
