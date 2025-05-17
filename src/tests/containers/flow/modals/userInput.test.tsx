/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

// import { flowId } from "../data";
// import { renderFlow } from "./common";

describe("WaldiezFlow User Input modal", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    it("should pass until we implement", () => {
        expect(1 + 1).toBe(2);
    });
    // it("should open the user input modal", () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     expect(screen.getByTestId(`rf-${flowId}-user-input-modal`)).toBeTruthy();
    // });
    // it("should close the user input modal on submit", async () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     const submitButton = screen.getByTestId(`rf-${flowId}-user-input-modal-submit`);
    //     expect(submitButton).toBeTruthy();
    //     const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
    //     expect(input).toBeTruthy();
    //     fireEvent.change(input, { target: { value: "User Input" } });
    //     fireEvent.click(submitButton);
    //     await waitFor(() => {
    //         expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
    //     });
    // });
    // it("should submit on Enter key press", async () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
    //     fireEvent.keyDown(input, { key: "Enter" });
    //     await waitFor(() => {
    //         expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
    //     });
    // });
    // it("should cancel on Esc key press", async () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     const input = screen.getByTestId(`rf-${flowId}-user-input-modal-input`);
    //     fireEvent.keyDown(input, { key: "Escape" });
    //     await waitFor(() => {
    //         expect(screen.queryByTestId(`rf-${flowId}-user-input-modal`)).toBeNull();
    //     });
    // });
    // it("should show image preview when an image is uploaded", async () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     const file = new File(["dummy content"], "example.png", { type: "image/png" });
    //     const uploadInput = screen.getByTestId(`rf-${flowId}-user-input-modal-image`);
    //     fireEvent.change(uploadInput, {
    //         target: { files: [file] },
    //     });
    //     // Check that the preview image appears
    //     await waitFor(() => {
    //         const img = screen.getByAltText("Preview");
    //         expect(img).toBeInTheDocument();
    //         expect(img).toHaveAttribute("src");
    //         const imgSrc = img.getAttribute("src");
    //         expect(imgSrc).toMatch(/^data:image\/png;base64,/);
    //     });
    // });
    // it("should submit with image when uploaded", async () => {
    //     const mockOnUserInput = vi.fn();
    //     act(() => {
    //         renderFlow(true, undefined, undefined, { onUserInput: mockOnUserInput });
    //     });
    //     const file = new File(["dummy content"], "example.png", { type: "image/png" });
    //     const uploadInput = screen.getByTestId(`rf-${flowId}-user-input-modal-image`);
    //     fireEvent.change(uploadInput, { target: { files: [file] } });
    //     // Wait for preview to appear
    //     await waitFor(() => {
    //         expect(screen.getByAltText("Preview")).toBeInTheDocument();
    //     });
    //     // Press "Send"
    //     const sendButton = screen.getByTestId(`rf-${flowId}-user-input-modal-submit`);
    //     fireEvent.click(sendButton);
    //     // Check that onUserInput was called with image
    //     await waitFor(() => {
    //         expect(mockOnUserInput).toHaveBeenCalledWith(
    //             expect.objectContaining({
    //                 id: expect.any(String),
    //                 type: "input_response",
    //                 request_id: expect.any(String),
    //                 data: {
    //                     text: null,
    //                     image: expect.stringMatching(/^data:image\/png;base64,/),
    //                 },
    //             }),
    //         );
    //     });
    // });
    // it("should clear image preview when remove button is clicked", async () => {
    //     act(() => {
    //         renderFlow(true);
    //     });
    //     const file = new File(["dummy content"], "example.png", { type: "image/png" });
    //     const uploadInput = screen.getByTestId(`rf-${flowId}-user-input-modal-image`);
    //     fireEvent.change(uploadInput, { target: { files: [file] } });
    //     await waitFor(() => {
    //         expect(screen.getByAltText("Preview")).toBeInTheDocument();
    //     });
    //     const removeButton = screen.getByTitle("Remove Image");
    //     expect(removeButton).toBeTruthy();
    //     fireEvent.click(removeButton);
    //     await waitFor(() => {
    //         expect(screen.queryByAltText("Preview")).toBeNull();
    //     });
    // });
    // it("should render previous messages correctly", async () => {
    //     const previousMessages: WaldiezPreviousMessage[] = [
    //         { id: "1", timestamp: "1", type: "print", data: "Simple text message" },
    //         { id: "2", timestamp: "1", type: "print", data: { key1: "value1", key2: "value2" } },
    //         // @ts-expect-error not a string or object
    //         { id: "3", timestamp: "1", type: "print", data: 42 },
    //     ];
    //     act(() => {
    //         renderFlow(true, undefined, undefined, { previousMessages });
    //     });
    //     expect(screen.getByText("Simple text message")).toBeInTheDocument();
    //     expect(screen.getByText('{"key1":"value1","key2":"value2"}')).toBeInTheDocument();
    //     const chatMessages = screen.getAllByTestId("rf-chat-message");
    //     expect(chatMessages.length).toBe(3);
    // });
});
