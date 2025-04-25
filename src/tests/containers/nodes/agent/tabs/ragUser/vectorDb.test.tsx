/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

const goToVectorDbTab = async (isQdrant: boolean = false) => {
    renderAgent("rag_user", {
        openModal: true,
    });
    const ragUserTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}`);
    fireEvent.click(ragUserTab);
    const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-vectorDb`);
    fireEvent.click(vectorDbTab);
    if (isQdrant) {
        const vectorDbSelect = screen.getByLabelText("Vector DB:");
        selectEvent.openMenu(vectorDbSelect);
        await selectEvent.select(vectorDbSelect, "Qdrant");
        fireEvent.change(vectorDbSelect, {
            target: {
                label: "Qdrant",
                value: "qdrant",
            },
        });
    }
};

describe("Rag User tab Vector DB", () => {
    it("should render the Rag User tab Vector DB", async () => {
        await goToVectorDbTab();
        const vectorDbTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-ragUser-${agentId}-vectorDb`);
        expect(vectorDbTab).toBeInTheDocument();
    });
    it("should change the vector DB", async () => {
        await goToVectorDbTab();
        const vectorDbSelect = screen.getByLabelText("Vector DB:");
        expect(vectorDbSelect).toBeInTheDocument();
        selectEvent.openMenu(vectorDbSelect);
        await selectEvent.select(vectorDbSelect, "Qdrant");
        fireEvent.change(vectorDbSelect, {
            target: {
                label: "Qdrant",
                value: "qdrant",
            },
        });
        submitAgentChanges();
    });
    it("should change the model", async () => {
        await goToVectorDbTab();
        const modelInput = screen.getByTestId(`rag-vector-db-model-${agentId}`) as HTMLInputElement;
        expect(modelInput).toBeInTheDocument();
        fireEvent.change(modelInput, { target: { value: "model" } });
        submitAgentChanges();
    });
    it("should change the Qdrant use memory", async () => {
        await goToVectorDbTab(true);
        const useMemoryCheckbox = screen.getByTestId(
            `rag-vector-db-use-memory-${agentId}`,
        ) as HTMLInputElement;
        expect(useMemoryCheckbox).toBeInTheDocument();
        fireEvent.click(useMemoryCheckbox);
        submitAgentChanges();
    });
    it("should change the Qdrant use local storage", async () => {
        await goToVectorDbTab(true);
        const useLocalStorageCheckbox = screen.getByTestId(
            `rag-vector-db-use-local-storage-${agentId}`,
        ) as HTMLInputElement;
        expect(useLocalStorageCheckbox).toBeInTheDocument();
        fireEvent.click(useLocalStorageCheckbox);
        submitAgentChanges();
    });
    it("should change the Qdrant local storage path", async () => {
        await goToVectorDbTab(true);
        const useLocalStorageCheckbox = screen.getByTestId(
            `rag-vector-db-use-local-storage-${agentId}`,
        ) as HTMLInputElement;
        fireEvent.click(useLocalStorageCheckbox);
        const localStoragePathInput = screen.getByTestId(
            `rag-vector-db-local-storage-path-${agentId}`,
        ) as HTMLInputElement;
        expect(localStoragePathInput).toBeInTheDocument();
        fireEvent.change(localStoragePathInput, { target: { value: "path" } });
        submitAgentChanges();
    });
    it("should change the Qdrant connection URL", async () => {
        await goToVectorDbTab(true);
        const connectionUrlInput = screen.getByTestId(
            `rag-vector-db-connection-url-${agentId}`,
        ) as HTMLInputElement;
        expect(connectionUrlInput).toBeInTheDocument();
        fireEvent.change(connectionUrlInput, { target: { value: "url" } });
        submitAgentChanges();
    });
    it("should change the Chroma use local storage", async () => {
        await goToVectorDbTab();
        const useLocalStorageCheckbox = screen.getByTestId(
            `rag-vector-db-use-local-storage-${agentId}`,
        ) as HTMLInputElement;
        expect(useLocalStorageCheckbox).toBeInTheDocument();
        fireEvent.click(useLocalStorageCheckbox);
        submitAgentChanges();
    });
    it("should change the Chroma local storage path", async () => {
        await goToVectorDbTab();
        const useLocalStorageCheckbox = screen.getByTestId(
            `rag-vector-db-use-local-storage-${agentId}`,
        ) as HTMLInputElement;
        fireEvent.click(useLocalStorageCheckbox);
        const localStoragePathInput = screen.getByTestId(
            `rag-vector-db-local-storage-path-${agentId}`,
        ) as HTMLInputElement;
        expect(localStoragePathInput).toBeInTheDocument();
        fireEvent.change(localStoragePathInput, { target: { value: "path" } });
        submitAgentChanges();
    });
    it("should change the connection URL", async () => {
        await goToVectorDbTab();
        const connectionUrlInput = screen.getByTestId(
            `rag-vector-db-connection-url-${agentId}`,
        ) as HTMLInputElement;
        expect(connectionUrlInput).toBeInTheDocument();
        fireEvent.change(connectionUrlInput, { target: { value: "url" } });
        submitAgentChanges();
    });
});
