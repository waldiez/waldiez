/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { flow, flowId } from "../../data";
import { renderFlow } from "../common";

afterEach(() => {
    vi.resetAllMocks();
});

export const loadFlow = async () => {
    fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
    expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).not.toBeTruthy();
    const localCollapsible = screen.getByTestId(`import-flow-modal-collapsible-local-${flowId}`);
    expect(localCollapsible).toBeTruthy();
    const header = localCollapsible?.querySelector(".collapsible-header");
    expect(header).toBeTruthy();
    fireEvent.click(header as HTMLElement);
    const dropZone = screen.queryByTestId(`drop-zone-${flowId}`);
    expect(dropZone).toBeTruthy();
    fireEvent.click(dropZone as HTMLElement);
    const file = new File([JSON.stringify(flow)], "test.waldiez");
    const fileInput = screen.getByTestId("drop-zone-file-input");
    expect(fileInput).toBeTruthy();
    await userEvent.upload(fileInput, file);
    const nextButton = screen.getByTestId("wizard-next-btn");
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).toBeTruthy();
};

describe("Import flow modal load step", () => {
    // noinspection DuplicatedCode
    it("should open and close the modal", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
        const modalTestId = `import-flow-modal-${flowId}`;
        const modalElement = screen.getByTestId(modalTestId) as HTMLDivElement;
        expect(modalElement).toBeTruthy();
        const closeButton = modalElement.querySelector(".modal-close-btn");
        expect(closeButton).toBeTruthy();
        fireEvent.click(closeButton as HTMLElement);
    });
    it("should load a flow from a file", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        await loadFlow();
    });
    it("should clear the loaded flow data", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        await loadFlow();
        const clearButton = screen.getByTestId("clear-loaded-flow-data");
        expect(clearButton).toBeTruthy();
        fireEvent.click(clearButton);
        expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).not.toBeTruthy();
    });
    it("should close with the back button", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        await loadFlow();
        let backButton = screen.getByTestId("wizard-back-btn");
        expect(backButton).toBeTruthy();
        fireEvent.click(backButton);
        backButton = screen.getByTestId("wizard-back-btn");
        expect(backButton).toBeTruthy();
        fireEvent.click(backButton);
        expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).not.toBeTruthy();
    });
});

describe("Import flow modal search flow", () => {
    const mockSearchResults = {
        files: [
            {
                id: "result-1",
                name: "Test Flow 1",
                description: "A test flow description",
                tags: "tag1, tag2",
                url: "https://hub.example.com/flows/result-1.json",
                upload_date: "2024-01-01T00:00:00Z",
            },
            {
                id: "result-2",
                name: "Test Flow 2",
                description: "Another test flow",
                tags: "tag3",
                url: "https://hub.example.com/flows/result-2.json",
                upload_date: "2024-01-02T00:00:00Z",
            },
        ],
    };

    beforeEach(() => {
        vi.spyOn(global, "fetch").mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockSearchResults),
            } as Response),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should display the search collapsible expanded by default", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        expect(searchCollapsible).toBeTruthy();
        // Should be expanded by default
        const searchInput = searchCollapsible.querySelector('input[type="text"]');
        expect(searchInput).toBeTruthy();
    });

    it("should show warning when submitting empty search", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        expect(searchSubmitButton).toBeTruthy();
        await act(async () => {
            fireEvent.click(searchSubmitButton);
        });
        // fetch should not be called when search term is empty
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should search and display results", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;
        expect(searchInput).toBeTruthy();

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("search"), expect.any(Object));
        });

        // Wait for results to appear
        await waitFor(() => {
            expect(screen.getByText("Test Flow 1")).toBeTruthy();
            expect(screen.getByText("Test Flow 2")).toBeTruthy();
        });
    });

    it("should search on Enter key press", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;
        expect(searchInput).toBeTruthy();

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test query" } });
        });

        await act(async () => {
            fireEvent.keyDown(searchInput, { key: "Enter" });
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it("should display tags in search results", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(screen.getByText("tag1")).toBeTruthy();
            expect(screen.getByText("tag2")).toBeTruthy();
            expect(screen.getByText("tag3")).toBeTruthy();
        });
    });

    it("should select a search result and load the flow", async () => {
        vi.spyOn(global, "fetch")
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockSearchResults),
                } as Response),
            )
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(flow),
                } as Response),
            );

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(screen.getByText("Test Flow 1")).toBeTruthy();
        });

        // Click on the first result
        const resultItem = screen.getByText("Test Flow 1").closest(".search-result-item");
        expect(resultItem).toBeTruthy();

        await act(async () => {
            fireEvent.click(resultItem as HTMLElement);
            await vi.runAllTimersAsync();
        });

        // Should have called fetch twice - once for search, once for loading the flow
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    it("should handle search API error gracefully", async () => {
        vi.spyOn(global, "fetch").mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            } as Response),
        );
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching search results:", expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });

    it("should handle network error during search", async () => {
        vi.spyOn(global, "fetch").mockImplementation(() => Promise.reject(new Error("Network error")));
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        consoleErrorSpy.mockRestore();
    });

    it("should handle error when loading selected result", async () => {
        vi.spyOn(global, "fetch")
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockSearchResults),
                } as Response),
            )
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: false,
                    status: 404,
                    statusText: "Not Found",
                } as Response),
            );
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        const searchCollapsible = screen.getByTestId(`import-flow-modal-collapsible-search-${flowId}`);
        const searchInput = searchCollapsible.querySelector('input[type="text"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "test" } });
        });

        const searchSubmitButton = screen.getByTestId(`import-flow-modal-search-submit-${flowId}`);
        await act(async () => {
            fireEvent.click(searchSubmitButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(screen.getByText("Test Flow 1")).toBeTruthy();
        });

        const resultItem = screen.getByText("Test Flow 1").closest(".search-result-item");
        await act(async () => {
            fireEvent.click(resultItem as HTMLElement);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error fetching selected result:",
                expect.any(Error),
            );
        });

        consoleErrorSpy.mockRestore();
    });
});

describe("Import flow modal URL loading", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should have URL input disabled until valid https URL is entered", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        // Expand URL collapsible
        const urlCollapsible = screen.getByTestId(`import-flow-modal-collapsible-url-${flowId}`);
        const header = urlCollapsible.querySelector(".collapsible-header");
        expect(header).toBeTruthy();
        fireEvent.click(header as HTMLElement);

        const urlInput = screen.getByTestId(`import-flow-modal-url-input-${flowId}`);
        const loadButton = screen.getByTestId(`import-flow-modal-url-submit-${flowId}`);

        expect(loadButton).toBeDisabled();

        await act(async () => {
            fireEvent.change(urlInput, { target: { value: "http://example.com" } });
        });
        expect(loadButton).toBeDisabled();

        await act(async () => {
            fireEvent.change(urlInput, { target: { value: "https://example.com" } });
        });
        expect(loadButton).toBeEnabled();
    });

    it("should load flow from URL", async () => {
        vi.spyOn(global, "fetch").mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(flow),
            } as Response),
        );

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        // Expand URL collapsible
        const urlCollapsible = screen.getByTestId(`import-flow-modal-collapsible-url-${flowId}`);
        const header = urlCollapsible.querySelector(".collapsible-header");
        fireEvent.click(header as HTMLElement);

        const urlInput = screen.getByTestId(`import-flow-modal-url-input-${flowId}`);
        const loadButton = screen.getByTestId(`import-flow-modal-url-submit-${flowId}`);

        await act(async () => {
            fireEvent.change(urlInput, { target: { value: "https://example.com/flow.json" } });
        });

        await act(async () => {
            fireEvent.click(loadButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "https://example.com/flow.json",
                expect.objectContaining({
                    mode: "cors",
                    redirect: "follow",
                }),
            );
        });
    });

    it("should handle URL fetch error", async () => {
        vi.spyOn(global, "fetch").mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 404,
                statusText: "Not Found",
            } as Response),
        );
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        // Expand URL collapsible
        const urlCollapsible = screen.getByTestId(`import-flow-modal-collapsible-url-${flowId}`);
        const header = urlCollapsible.querySelector(".collapsible-header");
        fireEvent.click(header as HTMLElement);

        const urlInput = screen.getByTestId(`import-flow-modal-url-input-${flowId}`);
        const loadButton = screen.getByTestId(`import-flow-modal-url-submit-${flowId}`);

        await act(async () => {
            fireEvent.change(urlInput, { target: { value: "https://example.com/flow.json" } });
        });

        await act(async () => {
            fireEvent.click(loadButton);
            await vi.runAllTimersAsync();
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching flow:", expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });

    it("should display warning about untrusted sources", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));

        // Expand URL collapsible
        const urlCollapsible = screen.getByTestId(`import-flow-modal-collapsible-url-${flowId}`);
        const header = urlCollapsible.querySelector(".collapsible-header");
        fireEvent.click(header as HTMLElement);

        expect(screen.getByText(/Warning: Importing from an untrusted source can be harmful/)).toBeTruthy();
    });
});
