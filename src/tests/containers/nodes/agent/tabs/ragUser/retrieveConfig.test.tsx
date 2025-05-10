/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// import userEvent from '@testing-library/user-event';
import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

let uploading = false;
const uploadsHandler = async (files: File[]) => {
    if (uploading) {
        throw new Error("Already uploading");
    }
    uploading = true;
    const results = files.map(file => file.name);
    uploading = false;
    return results;
};

const goToRetrieveConfigTab = async () => {
    renderAgent(
        "rag_user_proxy",
        {
            openModal: true,
        },
        uploadsHandler,
    );
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag`);
    fireEvent.click(ragUserTab);
    const retrieveConfigTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-retrieveConfig`);
    fireEvent.click(retrieveConfigTab);
};

describe("Rag User tab Retrieve Config", () => {
    it("should render the Rag User tab Retrieve Config", async () => {
        await goToRetrieveConfigTab();
        const retrieveConfigTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-rag-retrieveConfig`);
        expect(retrieveConfigTab).toBeInTheDocument();
    });
    it("should change the task", async () => {
        await goToRetrieveConfigTab();
        const taskSelect = screen.getByLabelText("Task") as HTMLSelectElement;
        expect(taskSelect).toBeInTheDocument();
        selectEvent.openMenu(taskSelect);
        await selectEvent.select(taskSelect, "QA");
        fireEvent.change(taskSelect, {
            target: {
                label: "QA",
                value: "qa",
            },
        });
        submitAgentChanges();
    });
    it("should add a docs path", async () => {
        await goToRetrieveConfigTab();
        const docsPathInput = screen.getByTestId("new-list-entry-rag-doc-item") as HTMLInputElement;
        expect(docsPathInput).toBeInTheDocument();
        fireEvent.change(docsPathInput, {
            target: {
                value: "new-docs-path",
            },
        });
        const addDocsPathButton = screen.getByTestId("add-list-entry-rag-doc-button");
        expect(addDocsPathButton).toBeInTheDocument();
        fireEvent.click(addDocsPathButton);
        submitAgentChanges();
    });
    it("should remove a docs path", async () => {
        await goToRetrieveConfigTab();
        const docsPathInput = screen.getByTestId("new-list-entry-rag-doc-item") as HTMLInputElement;
        expect(docsPathInput).toBeInTheDocument();
        fireEvent.change(docsPathInput, {
            target: {
                value: "new-docs-path",
            },
        });
        const addDocsPathButton = screen.getByTestId("add-list-entry-rag-doc-button");
        expect(addDocsPathButton).toBeInTheDocument();
        fireEvent.click(addDocsPathButton);
        submitAgentChanges();
        const deleteDocsPathButton = screen.getByTestId("delete-list-entry-rag-doc-0");
        expect(deleteDocsPathButton).toBeInTheDocument();
        fireEvent.click(deleteDocsPathButton);
        // submitAgentChanges();
    });
    it("should change a docs path", async () => {
        await goToRetrieveConfigTab();
        const docsPathInput = screen.getByTestId("new-list-entry-rag-doc-item") as HTMLInputElement;
        expect(docsPathInput).toBeInTheDocument();
        fireEvent.change(docsPathInput, {
            target: {
                value: "new-docs-path",
            },
        });
        const addDocsPathButton = screen.getByTestId("add-list-entry-rag-doc-button");
        expect(addDocsPathButton).toBeInTheDocument();
        fireEvent.click(addDocsPathButton);
        const docsPathItemInput = screen.getByTestId("list-entry-item-rag-doc-0") as HTMLInputElement;
        expect(docsPathItemInput).toBeInTheDocument();
        fireEvent.change(docsPathItemInput, {
            target: {
                value: "changed-docs-path",
            },
        });
        submitAgentChanges();
    });
    it("should change the collection name", async () => {
        await goToRetrieveConfigTab();
        const collectionNameInput = screen.getByTestId(
            `rag-retrieve-collection-name-${agentId}`,
        ) as HTMLInputElement;
        expect(collectionNameInput).toBeInTheDocument();
        fireEvent.change(collectionNameInput, {
            target: {
                value: "new-collection",
            },
        });
        submitAgentChanges();
    });
    it("should change the number of results", async () => {
        await goToRetrieveConfigTab();
        const nResultsInput = screen.getByTestId(`rag-retrieve-n-results-${agentId}`) as HTMLInputElement;
        expect(nResultsInput).toBeInTheDocument();
        fireEvent.change(nResultsInput, {
            target: {
                value: "10",
            },
        });
        submitAgentChanges();
    });
    it("should change the distance threshold", async () => {
        await goToRetrieveConfigTab();
        const distanceThresholdInput = screen.getByTestId(
            `rag-retrieve-distance-threshold-${agentId}`,
        ) as HTMLInputElement;
        expect(distanceThresholdInput).toBeInTheDocument();
        fireEvent.change(distanceThresholdInput, {
            target: {
                value: "0.5",
            },
        });
        submitAgentChanges();
    });
    it("should handle file uploads", async () => {
        await goToRetrieveConfigTab();
        const files = [new File(["file1"], "file1.txt")];
        const dropZone = screen.getByText("Drop files here or click to upload");
        fireEvent.drop(dropZone, {
            dataTransfer: {
                files,
            },
        });
        const removeFileButton = screen.getByTestId("delete-list-entry-rag-doc-0");
        expect(removeFileButton).toBeInTheDocument();
        submitAgentChanges();
        // await for the upload to finish ? (avoid act warning)
        await waitFor(() => {
            expect(uploading).toBe(false);
        });
    });
    it("should handle invalid file uploads", async () => {
        await goToRetrieveConfigTab();
        const largeFile = new File(["file1"], "large-file.txt");
        Object.defineProperty(largeFile, "size", {
            value: 1024 * 1024 * 10 + 2,
        });
        const imageFile = new File(["file1"], "image-file.png", {
            type: "image/png",
        });
        Object.defineProperty(imageFile, "name", {
            value: "image-file.png",
        });
        const docFile = new File(["file1"], "doc-file.doc", {
            type: "application/msword",
        }); // only this file should be uploaded (doc-0)
        Object.defineProperty(docFile, "name", {
            value: "doc-file.doc",
        });
        const files = [largeFile, imageFile, docFile];
        const dropZone = screen.getByText("Drop files here or click to upload");
        fireEvent.drop(dropZone, {
            dataTransfer: {
                files,
            },
        });
        expect(screen.queryByTestId("delete-list-entry-rag-doc-0")).not.toBeNull();
        expect(screen.queryByTestId("delete-list-entry-rag-doc-1")).toBeNull();
    });
    it("should open the upload dialog", async () => {
        await goToRetrieveConfigTab();
        const dropZone = screen.getByText("Drop files here or click to upload");
        fireEvent.click(dropZone);
    });
    it("should remove an uploaded file", async () => {
        await goToRetrieveConfigTab();
        const files = [new File(["file1"], "file1.txt")];
        const dropZone = screen.getByText("Drop files here or click to upload");
        fireEvent.drop(dropZone, {
            dataTransfer: {
                files,
            },
        });
        const docsPathInput = screen.getByTestId("new-list-entry-rag-doc-item") as HTMLInputElement;
        fireEvent.change(docsPathInput, {
            target: {
                value: "new-docs-path",
            },
        });
        const addDocsPathButton = screen.getByTestId("add-list-entry-rag-doc-button");
        fireEvent.click(addDocsPathButton);
        const removeFileButton = screen.getByTestId("delete-list-entry-rag-doc-0");
        fireEvent.click(removeFileButton);
        submitAgentChanges();
    });
});
