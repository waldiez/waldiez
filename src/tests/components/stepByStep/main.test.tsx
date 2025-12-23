/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepByStepView } from "@waldiez/components/stepByStep";
import type { WaldiezEvent, WaldiezStepByStep } from "@waldiez/components/stepByStep/types";
import { WaldiezProvider } from "@waldiez/store";

// Mock nanoid
vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-id-123"),
}));

// Mock React Icons
// noinspection JSUnusedGlobalSymbols
vi.mock("react-icons/fa", () => ({
    FaStepForward: () => <div data-testid="icon-step-forward" />,
}));

// noinspection JSUnusedGlobalSymbols
vi.mock("react-icons/fa6", () => ({
    FaBug: () => <div data-testid="icon-bug" />,
    FaChevronDown: () => <div data-testid="icon-chevron-down" />,
    FaChevronUp: () => <div data-testid="icon-chevron-up" />,
    FaPlay: () => <div data-testid="icon-play" />,
    FaStop: () => <div data-testid="icon-stop" />,
    FaX: () => <div data-testid="icon-x" />,
}));

const _renderView = (stepByStep?: WaldiezStepByStep | null, events?: WaldiezEvent[]) => {
    return render(
        <WaldiezProvider flowId="flow-123" edges={[]} nodes={[]}>
            <StepByStepView
                flowId="flow-123"
                stepByStep={stepByStep}
                isDarkMode={false}
                events={events || []}
            />
        </WaldiezProvider>,
    );
};

describe("StepByStepView", () => {
    const mockHandlers = {
        sendControl: vi.fn(),
        respond: vi.fn(),
        close: vi.fn(),
    };

    const defaultStepByStep: WaldiezStepByStep = {
        show: true,
        active: true,
        stepMode: true,
        autoContinue: false,
        breakpoints: [],
        eventHistory: [],
        pendingControlInput: null,
        activeRequest: null,
        handlers: mockHandlers,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("should show control buttons when there is pending control input", () => {
        const stepByStepWithPendingInput = {
            ...defaultStepByStep,
            pendingControlInput: {
                request_id: "req-123",
                prompt: "Enter command:",
            },
        };

        _renderView(stepByStepWithPendingInput);

        expect(screen.getByText("Continue")).toBeInTheDocument();
        expect(screen.getByText("Run")).toBeInTheDocument();
        expect(screen.getByText("Quit")).toBeInTheDocument();
    });

    it("should not show control buttons when no pending control input", () => {
        _renderView(defaultStepByStep);

        expect(screen.queryByText("Continue")).not.toBeInTheDocument();
        expect(screen.queryByText("Run")).not.toBeInTheDocument();
        expect(screen.queryByText("Quit")).not.toBeInTheDocument();
    });

    it("should send continue command when Continue button is clicked", () => {
        const stepByStepWithPendingInput = {
            ...defaultStepByStep,
            pendingControlInput: {
                request_id: "req-123",
                prompt: "Enter command:",
            },
            activeRequest: {
                request_id: "req-123",
                prompt: "Enter command:",
            },
        };

        _renderView(stepByStepWithPendingInput);

        const continueButton = screen.getByText("Continue");
        fireEvent.click(continueButton);

        expect(mockHandlers.sendControl).toHaveBeenCalledWith({
            data: "c",
            request_id: "req-123",
        });
    });

    it("should send run command when Run button is clicked", () => {
        const stepByStepWithPendingInput = {
            ...defaultStepByStep,
            pendingControlInput: {
                request_id: "req-456",
                prompt: "Enter command:",
            },
            activeRequest: {
                request_id: "req-456",
                prompt: "Enter command:",
            },
        };

        _renderView(stepByStepWithPendingInput);

        const runButton = screen.getByText("Run");
        fireEvent.click(runButton);

        expect(mockHandlers.sendControl).toHaveBeenCalledWith({
            data: "r",
            request_id: "req-456",
        });
    });

    it("should send quit command when Quit button is clicked", () => {
        const stepByStepWithPendingInput = {
            ...defaultStepByStep,
            pendingControlInput: {
                request_id: "req-789",
                prompt: "Enter command:",
            },
            activeRequest: {
                request_id: "req-789",
                prompt: "Enter command:",
            },
        };

        _renderView(stepByStepWithPendingInput);

        const quitButton = screen.getByText("Quit");
        fireEvent.click(quitButton);

        expect(mockHandlers.sendControl).toHaveBeenCalledWith({
            data: "q",
            request_id: "req-789",
        });
    });

    it("should use '<unknown>' as request_id when activeRequest is null", () => {
        const stepByStepWithPendingInput = {
            ...defaultStepByStep,
            pendingControlInput: {
                request_id: "req-123",
                prompt: "Enter command:",
            },
            activeRequest: null,
        };

        _renderView(stepByStepWithPendingInput);

        const continueButton = screen.getByText("Continue");
        fireEvent.click(continueButton);

        expect(mockHandlers.sendControl).toHaveBeenCalledWith({
            data: "c",
            request_id: "<unknown>",
        });
    });
    it("should show input field when there is an active request", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-input-123",
                prompt: "Please enter your name:",
            },
        };

        _renderView(stepByStepWithActiveRequest);

        expect(screen.getByText("Waiting for input")).toBeInTheDocument();
        expect(screen.getByText("Please enter your name:")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Type your response... (Enter to send)")).toBeInTheDocument();
        expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("should not show input field when no active request", () => {
        _renderView(defaultStepByStep);

        expect(screen.queryByText("Waiting for input")).not.toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText("Type your response... (Enter to send)"),
        ).not.toBeInTheDocument();
    });

    it("should show password input when activeRequest has password flag", () => {
        const stepByStepWithPasswordRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-pwd-123",
                prompt: "Enter password:",
                password: true,
            },
        };

        _renderView(stepByStepWithPasswordRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        expect(input).toHaveAttribute("type", "password");
    });

    it("should show text input when activeRequest does not have password flag", () => {
        const stepByStepWithTextRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-txt-123",
                prompt: "Enter your name:",
                password: false,
            },
        };

        _renderView(stepByStepWithTextRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        expect(input).toHaveAttribute("type", "text");
    });

    it("should update input value when typed", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-input-123",
                prompt: "Please enter your name:",
            },
        };

        _renderView(stepByStepWithActiveRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        fireEvent.change(input, { target: { value: "John Doe" } });

        expect(input).toHaveValue("John Doe");
    });

    it("should send response when Enter key is pressed", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-input-123",
                prompt: "Please enter your name:",
            },
        };

        _renderView(stepByStepWithActiveRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        fireEvent.change(input, { target: { value: "John Doe" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(mockHandlers.respond).toHaveBeenCalledWith({
            id: "mock-id-123",
            timestamp: expect.any(Number),
            data: "John Doe",
            request_id: "req-input-123",
            type: "input_response",
        });

        // Input should be cleared after sending
        expect(input).toHaveValue("");
    });

    it("should send response when Send button is clicked", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-input-456",
                prompt: "Please enter your age:",
            },
        };

        _renderView(stepByStepWithActiveRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        const sendButton = screen.getByText("Send");

        fireEvent.change(input, { target: { value: "25" } });
        fireEvent.click(sendButton);

        expect(mockHandlers.respond).toHaveBeenCalledWith({
            id: "mock-id-123",
            timestamp: expect.any(Number),
            data: JSON.stringify("25"),
            request_id: "req-input-456",
            type: "input_response",
        });

        // Input should be cleared after sending
        expect(input).toHaveValue("");
    });

    it("should not send response for non-Enter keys", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-input-123",
                prompt: "Please enter your name:",
            },
        };

        _renderView(stepByStepWithActiveRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        fireEvent.change(input, { target: { value: "John" } });
        fireEvent.keyDown(input, { key: "Tab" });

        expect(mockHandlers.respond).not.toHaveBeenCalled();
        expect(input).toHaveValue("John");
    });
    it("should handle undefined activeRequest.request_id", () => {
        const stepByStepWithActiveRequest = {
            ...defaultStepByStep,
            activeRequest: {
                prompt: "Please enter your name:",
            } as any,
        };

        _renderView(stepByStepWithActiveRequest);
        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        fireEvent.change(input, { target: { value: "John" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(mockHandlers.respond).not.toHaveBeenCalled();
    });
    it("should have proper input types for password fields", () => {
        const stepByStepWithPasswordRequest = {
            ...defaultStepByStep,
            activeRequest: {
                request_id: "req-pwd-123",
                prompt: "Enter password:",
                password: true,
            },
        };
        _renderView(stepByStepWithPasswordRequest);

        const input = screen.getByPlaceholderText("Type your response... (Enter to send)");
        expect(input).toHaveAttribute("type", "password");
    });
});
