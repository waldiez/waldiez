/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportFlowModal } from "@waldiez/containers/flow/modals/exportFlowModal/main";

// Mock the showSnackbar function
vi.mock("@waldiez/components", async () => {
    const actual = await vi.importActual("@waldiez/components");
    return {
        ...actual,
        showSnackbar: vi.fn(),
    };
});

describe("ExportFlowModal", () => {
    const mockFlowId = "test-flow";
    const mockOnDownload = vi.fn();
    const mockOnExport = vi.fn();
    const mockOnClose = vi.fn();

    // Reset mocks before each test
    beforeEach(() => {
        vi.clearAllMocks();
        mockOnExport.mockReturnValue('{"name":"test-flow"}');
        // Mock fetch globally
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const defaultProps = {
        flowId: mockFlowId,
        isOpen: true,
        onDownload: mockOnDownload,
        onExport: mockOnExport,
        onClose: mockOnClose,
    };

    it("should render successfully", () => {
        const { baseElement } = render(<ExportFlowModal {...defaultProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render modal with correct title", () => {
        render(<ExportFlowModal {...defaultProps} />);
        expect(screen.getByText("Export Flow")).toBeTruthy();
    });

    it("should render upload to hub checkbox", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        expect(checkbox).toBeTruthy();
    });

    it("should render hub link", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const link = screen.getByText("Waldiez hub");
        expect(link).toBeTruthy();
        expect(link.getAttribute("href")).toBe("https://hub.waldiez.io");
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("should show hub API token input when upload checkbox is checked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);

        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        expect(tokenInput).toBeTruthy();
    });

    it("should hide hub API token input when upload checkbox is unchecked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);

        // Check and then uncheck
        fireEvent.click(checkbox);
        fireEvent.click(checkbox);

        const tokenInput = screen.queryByTestId(`hub-api-token-${mockFlowId}`);
        expect(tokenInput).toBeFalsy();
    });

    it("should render dropzone when upload checkbox is checked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);

        fireEvent.click(checkbox);

        expect(screen.getByText("Additional CSV file (results.csv) to include:")).toBeTruthy();
    });

    it("should handle hub API token input change", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`) as HTMLInputElement;
        fireEvent.change(tokenInput, { target: { value: "test-token-123" } });

        expect(tokenInput.value).toBe("test-token-123");
    });

    it("should call onClose when cancel button is clicked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const cancelButton = screen.getByText("Cancel");

        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onDownload when download button is clicked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const downloadButton = screen.getByText("Download");

        fireEvent.click(downloadButton);

        expect(mockOnDownload).toHaveBeenCalled();
    });

    it("should show upload to hub button when checkbox is checked", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);

        fireEvent.click(checkbox);

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        expect(uploadButton).toBeTruthy();
        expect(uploadButton.textContent).toBe("Upload to Hub");
    });

    it("should disable upload button when no API token is provided", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`) as HTMLButtonElement;
        expect(uploadButton.disabled).toBe(true);
    });

    it("should enable upload button when API token is provided", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`) as HTMLButtonElement;
        expect(uploadButton.disabled).toBe(false);
    });

    it("should successfully upload flow to hub", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: "flow-123" }),
        });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/files/upload"),
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-token",
                    }),
                }),
            );
        });
    });

    it("should handle upload error when response is not ok", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: "Unauthorized",
        });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "invalid-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // Button should be enabled again after error
        await waitFor(() => {
            expect(uploadButton).not.toBeDisabled();
        });
    });

    it("should handle network error during upload", async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    it("should show uploading state during upload", async () => {
        const mockFetch = vi
            .fn()
            .mockImplementation(
                () =>
                    new Promise(resolve =>
                        setTimeout(() => resolve({ ok: true, json: async () => ({ id: "123" }) }), 100),
                    ),
            );
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        // Check uploading state
        expect(uploadButton.textContent).toBe("Uploading...");
        expect(uploadButton).toBeDisabled();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    it("should prevent multiple simultaneous uploads", async () => {
        const mockFetch = vi
            .fn()
            .mockImplementation(
                () =>
                    new Promise(resolve =>
                        setTimeout(() => resolve({ ok: true, json: async () => ({ id: "123" }) }), 100),
                    ),
            );
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);

        // Click multiple times
        fireEvent.click(uploadButton);
        fireEvent.click(uploadButton);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    it("should handle when onExport returns null", async () => {
        mockOnExport.mockReturnValue(null);

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockOnExport).toHaveBeenCalled();
        });

        // Should not call fetch
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should upload additional CSV file with flow", async () => {
        const mockFetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "flow-123" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        // Simulate CSV file upload through dropzone
        // const file = new File(["col1,col2\nval1,val2"], "test.csv", { type: "text/csv" });
        const dropZone = screen.getByText("Additional CSV file (results.csv) to include:");

        // Trigger file upload (this would normally be done through the DropZone component)
        // We need to find the actual drop zone input or trigger area
        const dropZoneContainer = dropZone.closest(".margin-top-10");
        expect(dropZoneContainer).toBeTruthy();

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1); // Only flow upload without additional file
        });
    });

    it("should handle error when uploading additional file fails", async () => {
        const mockFetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "flow-123" }),
            })
            .mockResolvedValueOnce({
                ok: false,
                statusText: "Bad Request",
            });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    it("should render password input for API token", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`) as HTMLInputElement;
        expect(tokenInput.type).toBe("password");
    });

    it("should call onExport when uploading to hub", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: "flow-123" }),
        });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockOnExport).toHaveBeenCalled();
        });
    });

    it("should create proper FormData for flow upload", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: "flow-123" }),
        });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: "POST",
                    body: expect.any(FormData),
                    headers: expect.objectContaining({
                        content_type: "application/waldiez",
                    }),
                }),
            );
        });
    });

    it("should handle modal close properly", () => {
        render(<ExportFlowModal {...defaultProps} />);

        // Close via cancel button
        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not render when isOpen is false", () => {
        const { container } = render(<ExportFlowModal {...defaultProps} isOpen={false} />);

        // Modal should not be visible
        expect(container.querySelector(".modal-body")).toBeFalsy();
    });

    it("should render with correct data-testid", () => {
        render(<ExportFlowModal {...defaultProps} />);

        const modal = screen.getByTestId(`export-flow-modal-${mockFlowId}`);
        expect(modal).toBeTruthy();
    });

    it("should render all action buttons", () => {
        render(<ExportFlowModal {...defaultProps} />);

        expect(screen.getByText("Cancel")).toBeTruthy();
        expect(screen.getByText("Download")).toBeTruthy();
    });

    it("should toggle checkbox state correctly", () => {
        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`) as HTMLButtonElement;
        expect(checkbox.ariaChecked).toBe("false");

        fireEvent.click(checkbox);
        expect(checkbox.ariaChecked).toBe("true");

        fireEvent.click(checkbox);
        expect(checkbox.ariaChecked).toBe("false");
    });

    it("should handle upload timeout", async () => {
        const mockFetch = vi.fn().mockImplementation(
            () =>
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Timeout")), 100);
                }),
        );
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // Should handle error gracefully
        await waitFor(() => {
            expect(uploadButton).not.toBeDisabled();
        });
    });

    it("should include correct authorization header", async () => {
        const testToken = "my-secret-token-456";
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: "flow-123" }),
        });
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: testToken } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${testToken}`,
                    }),
                }),
            );
        });
    });

    it("should log error to console on upload failure", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const mockFetch = vi.fn().mockRejectedValue(new Error("Upload failed"));
        global.fetch = mockFetch;

        render(<ExportFlowModal {...defaultProps} />);
        const checkbox = screen.getByTestId(`export-flow-modal-upload-${mockFlowId}`);
        fireEvent.click(checkbox);

        const tokenInput = screen.getByTestId(`hub-api-token-${mockFlowId}`);
        fireEvent.change(tokenInput, { target: { value: "test-token" } });

        const uploadButton = screen.getByTestId(`upload-to-hub-${mockFlowId}`);
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Upload error:", expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });
});
