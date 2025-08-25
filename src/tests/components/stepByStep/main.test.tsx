/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines, max-lines-per-function */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepByStepView } from "@waldiez/components/stepByStep";
import type { WaldiezStepByStep } from "@waldiez/components/stepByStep/types";

// Mock nanoid
vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-id-123"),
}));

// Mock React Icons
vi.mock("react-icons/fa", () => ({
    FaStepForward: () => <div data-testid="icon-step-forward" />,
}));

vi.mock("react-icons/fa6", () => ({
    FaBug: () => <div data-testid="icon-bug" />,
    FaChevronDown: () => <div data-testid="icon-chevron-down" />,
    FaChevronUp: () => <div data-testid="icon-chevron-up" />,
    FaPlay: () => <div data-testid="icon-play" />,
    FaStop: () => <div data-testid="icon-stop" />,
    FaX: () => <div data-testid="icon-x" />,
}));

describe("StepByStepView", () => {
    const mockHandlers = {
        sendControl: vi.fn(),
        respond: vi.fn(),
        close: vi.fn(),
    };

    const defaultStepByStep: WaldiezStepByStep = {
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

    describe("rendering", () => {
        it("should render successfully when active", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

            expect(screen.getByText("Step-by-step Panel")).toBeInTheDocument();
            expect(screen.getByTestId("icon-bug")).toBeInTheDocument();
        });

        it("should not render when inactive and no event history", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [],
            };

            const { container } = render(
                <StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />,
            );

            expect(container.firstChild).toBeNull();
        });

        it("should render when inactive but has event history and close handler", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [{ data: "some event" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />);

            expect(screen.getByText("Step-by-step Panel")).toBeInTheDocument();
            expect(screen.getByText("Finished")).toBeInTheDocument();
        });

        it("should not render when stepByStep is null", () => {
            const { container } = render(<StepByStepView flowId="flow-123" stepByStep={null} />);

            expect(container.firstChild).toBeNull();
        });

        it("should not render when stepByStep is undefined", () => {
            const { container } = render(<StepByStepView flowId="flow-123" />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe("header functionality", () => {
        it("should display current event type in badge when active", () => {
            const stepByStepWithEvent = {
                ...defaultStepByStep,
                currentEvent: { type: "message", sender: "user" },
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithEvent} />);

            expect(screen.getByText("message")).toBeInTheDocument();
        });

        it("should display 'Running' when active but no current event type", () => {
            const stepByStepWithoutEventType = {
                ...defaultStepByStep,
                currentEvent: { sender: "user" }, // No type property
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithoutEventType} />);

            expect(screen.getByText("Running")).toBeInTheDocument();
        });

        it("should show 'Finished' badge when inactive", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [{ type: "something", data: "some event" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />);

            expect(screen.getByText("Finished")).toBeInTheDocument();
        });

        it("should toggle expansion when toggle button is clicked", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

            // Initially expanded - should show collapse icon
            expect(screen.getByTestId("icon-chevron-down")).toBeInTheDocument();
            expect(screen.getByText("Messages")).toBeInTheDocument();

            // Click toggle button
            const toggleButton = screen.getByTitle("Collapse");
            fireEvent.click(toggleButton);

            // Should be collapsed - show expand icon and hide content
            expect(screen.getByTestId("icon-chevron-up")).toBeInTheDocument();
            expect(screen.queryByText("Messages")).not.toBeInTheDocument();

            // Click again to expand
            const expandButton = screen.getByTitle("Expand");
            fireEvent.click(expandButton);

            // Should be expanded again
            expect(screen.getByTestId("icon-chevron-down")).toBeInTheDocument();
            expect(screen.getByText("Messages")).toBeInTheDocument();
        });

        it("should show close button when inactive and can close", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [{ data: "some event" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />);

            expect(screen.getByTitle("Close")).toBeInTheDocument();
            expect(screen.getByTestId("icon-x")).toBeInTheDocument();
        });

        it("should not show close button when active", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

            expect(screen.queryByTitle("Close")).not.toBeInTheDocument();
        });

        it("should not show close button when no event history", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [],
            };

            const { container } = render(
                <StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />,
            );

            expect(container.firstChild).toBeNull();
        });

        it("should call close handler when close button is clicked", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [{ data: "some event" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />);

            const closeButton = screen.getByTitle("Close");
            fireEvent.click(closeButton);

            expect(mockHandlers.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("control buttons", () => {
        it("should show control buttons when there is pending control input", () => {
            const stepByStepWithPendingInput = {
                ...defaultStepByStep,
                pendingControlInput: {
                    request_id: "req-123",
                    prompt: "Enter command:",
                },
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

            expect(screen.getByText("Continue")).toBeInTheDocument();
            expect(screen.getByText("Run")).toBeInTheDocument();
            expect(screen.getByText("Quit")).toBeInTheDocument();
        });

        it("should not show control buttons when no pending control input", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

            const continueButton = screen.getByText("Continue");
            fireEvent.click(continueButton);

            expect(mockHandlers.sendControl).toHaveBeenCalledWith({
                data: "c",
                request_id: "<unknown>",
            });
        });
    });

    describe("active request (user input)", () => {
        it("should show input field when there is an active request", () => {
            const stepByStepWithActiveRequest = {
                ...defaultStepByStep,
                activeRequest: {
                    request_id: "req-input-123",
                    prompt: "Please enter your name:",
                },
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            expect(screen.getByText("Waiting for input")).toBeInTheDocument();
            expect(screen.getByText("Please enter your name:")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Type your response… (Enter to send)")).toBeInTheDocument();
            expect(screen.getByText("Send")).toBeInTheDocument();
        });

        it("should not show input field when no active request", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

            expect(screen.queryByText("Waiting for input")).not.toBeInTheDocument();
            expect(
                screen.queryByPlaceholderText("Type your response… (Enter to send)"),
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPasswordRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithTextRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
            const sendButton = screen.getByText("Send");

            fireEvent.change(input, { target: { value: "25" } });
            fireEvent.click(sendButton);

            expect(mockHandlers.respond).toHaveBeenCalledWith({
                id: "mock-id-123",
                timestamp: expect.any(Number),
                data: "25",
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
            fireEvent.change(input, { target: { value: "John" } });
            fireEvent.keyDown(input, { key: "Tab" });

            expect(mockHandlers.respond).not.toHaveBeenCalled();
            expect(input).toHaveValue("John");
        });
    });

    describe("event history", () => {
        it("should display 'No messages yet' when event history is empty", () => {
            render(<StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} />);

            expect(screen.getByText("Messages")).toBeInTheDocument();
            expect(screen.getByText("No messages yet")).toBeInTheDocument();
        });

        it("should display formatted event history when available", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [
                    { data: "First event", timestamp: "2024-01-01T10:00:00Z" },
                    { message: "Second event", type: "message" },
                    { content: "Third event", sender: "user" },
                    { nested: { data: "Fourth event" } },
                ],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            expect(jsonArea).toBeInTheDocument();

            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("First event");
            expect(jsonContent).toContain("Second event");
            expect(jsonContent).toContain("Third event");
        });

        it("should handle events with data property", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [{ data: "Event with data" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("Event with data");
        });

        it("should handle events with message property when no data", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [{ message: "Event with message", type: "info" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("Event with message");
        });

        it("should handle events with content property when no data or message", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [{ content: "Event with content", sender: "user" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("Event with content");
        });

        it("should fallback to entire entry when no data, message, or content", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [{ type: "custom", timestamp: "2024-01-01T10:00:00Z" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("custom");
            expect(jsonContent).toContain("2024-01-01T10:00:00Z");
        });

        it("should handle complex nested event data", () => {
            const stepByStepWithHistory = {
                ...defaultStepByStep,
                eventHistory: [
                    {
                        data: {
                            nested: {
                                deeply: {
                                    value: "Complex data",
                                    array: [1, 2, 3],
                                },
                            },
                        },
                    },
                ],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            const jsonContent = jsonArea?.textContent;
            expect(jsonContent).toContain("Complex data");
            const expectedArrayString = JSON.stringify(stepByStepWithHistory.eventHistory[0]!.data, null, 2);
            expect(jsonContent).toContain(expectedArrayString);
        });
    });

    describe("edge cases", () => {
        it("should handle missing handlers gracefully", () => {
            const stepByStepWithoutHandlers = {
                ...defaultStepByStep,
                handlers: {} as any,
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithoutHandlers} />);

            expect(screen.getByText("Step-by-step Panel")).toBeInTheDocument();
        });

        it("should handle undefined activeRequest.request_id", () => {
            const stepByStepWithActiveRequest = {
                ...defaultStepByStep,
                activeRequest: {
                    prompt: "Please enter your name:",
                } as any,
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithActiveRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
            fireEvent.change(input, { target: { value: "John" } });
            fireEvent.keyDown(input, { key: "Enter" });

            expect(mockHandlers.respond).toHaveBeenCalledWith({
                id: "mock-id-123",
                timestamp: expect.any(Number),
                data: "John",
                request_id: undefined,
                type: "input_response",
            });
        });

        it("should handle invalid JSON in event history gracefully", () => {
            const stepByStepWithInvalidHistory: any = {
                ...defaultStepByStep,
                eventHistory: [{ data: { circular: {} } }],
            };

            // Create circular reference
            stepByStepWithInvalidHistory.eventHistory[0].data.circular =
                stepByStepWithInvalidHistory.eventHistory[0].data;

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithInvalidHistory} />);

            const jsonArea = document.querySelector(".json .pre");
            expect(jsonArea).toBeInTheDocument();
            // Should fallback to String() representation
            expect(jsonArea?.textContent).toContain("[object Object]");
        });

        it("should apply custom className when provided", () => {
            const { container } = render(
                <StepByStepView flowId="flow-123" stepByStep={defaultStepByStep} className="custom-class" />,
            );

            const stepByStepElement = container.querySelector(".waldiez-step-by-step-view");
            expect(stepByStepElement).toBeInTheDocument();
        });
    });

    describe("accessibility", () => {
        it("should have proper button titles for accessibility", () => {
            const inactiveStepByStep = {
                ...defaultStepByStep,
                active: false,
                eventHistory: [{ data: "some event" }],
            };

            render(<StepByStepView flowId="flow-123" stepByStep={inactiveStepByStep} />);

            expect(screen.getByTitle("Collapse")).toBeInTheDocument();
            expect(screen.getByTitle("Close")).toBeInTheDocument();
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

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPasswordRequest} />);

            const input = screen.getByPlaceholderText("Type your response… (Enter to send)");
            expect(input).toHaveAttribute("type", "password");
        });

        it("should have proper button types", () => {
            const stepByStepWithPendingInput = {
                ...defaultStepByStep,
                pendingControlInput: {
                    request_id: "req-123",
                    prompt: "Enter command:",
                },
            };

            render(<StepByStepView flowId="flow-123" stepByStep={stepByStepWithPendingInput} />);

            const buttons = screen.getAllByRole("button");
            buttons.forEach(button => {
                expect(button).toHaveAttribute("type", "button");
            });
        });
    });
});
