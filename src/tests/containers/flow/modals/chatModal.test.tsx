/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatModal } from "@waldiez/containers/flow/modals/chatModal/main";
import { WaldiezThemeProvider } from "@waldiez/theme";
import type { WaldiezChatConfig, WaldiezTimelineData } from "@waldiez/types";

const mockTimelineData: WaldiezTimelineData = {
    timeline: [
        {
            id: "session-1",
            type: "session",
            start: 0,
            end: 5,
            duration: 5,
            agent: "test_agent_1",
            cost: 0.001234,
            color: "#3B82F6",
            label: "Test Agent 1 Session",
            prompt_tokens: 100,
            completion_tokens: 50,
            tokens: 150,
            agent_class: "assistant",
            is_cached: false,
            llm_model: "gpt-4",
            y_position: 0,
            session_id: "session-1",
            real_start_time: "2024-01-01T10:00:00Z",
        },
        {
            id: "gap-1",
            type: "gap",
            start: 5,
            end: 10,
            duration: 2,
            color: "#D1D5DB",
            label: "Human Input Gap",
            gap_type: "human_input_waiting",
            real_duration: 15,
            compressed: true,
        },
        {
            id: "session-2",
            type: "session",
            start: 7,
            end: 12,
            duration: 5,
            agent: "test_agent_2",
            cost: 0.002345,
            color: "#EF4444",
            label: "Test Agent 2 Session",
            prompt_tokens: 120,
            completion_tokens: 80,
            tokens: 200,
            agent_class: "user_proxy",
            is_cached: true,
            llm_model: "gpt-3.5-turbo",
            y_position: 1,
            session_id: "session-2",
            real_start_time: "2024-01-01T10:00:15Z",
        },
    ],
    cost_timeline: [
        {
            time: 5,
            cumulative_cost: 0.001234,
            session_cost: 0.001234,
            session_id: "session-1",
        },
        {
            time: 12,
            cumulative_cost: 0.003579,
            session_cost: 0.002345,
            session_id: "session-2",
        },
    ],
    summary: {
        total_sessions: 2,
        total_time: 15.5,
        total_cost: 0.0045,
        total_agents: 3,
        total_events: 4,
        total_tokens: 350,
        avg_cost_per_session: 0.00225,
        compression_info: {
            gaps_compressed: 1,
            time_saved: 13,
        },
    },
    metadata: {
        time_range: [0, 15.5],
        cost_range: [0, 0.0045],
        colors: {
            test_agent_1: "#3B82F6",
            test_agent_2: "#EF4444",
        },
    },
    agents: [
        {
            name: "test_agent_1",
            class: "assistant",
            color: "#3B82F6",
        },
        {
            name: "test_agent_2",
            class: "user_proxy",
            color: "#EF4444",
        },
    ],
};

describe("ChatModal", () => {
    const mockFlowId = "test-flow";
    const mockChat: WaldiezChatConfig = {
        show: true,
        messages: [
            {
                id: "msg-1",
                type: "text",
                sender: "user-1",
                content: "Hello",
                timestamp: new Date().toISOString(),
            },
        ],
        userParticipants: ["user-1", "user-2"],
        activeRequest: {
            request_id: "req-1",
            prompt: "Please enter your response",
            password: false,
        },
        handlers: {
            onUserInput: vi.fn(),
            onClose: vi.fn(),
            onInterrupt: vi.fn(),
        },
        active: true,
    };

    it("should render successfully", () => {
        const { baseElement } = render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should not render when chat is not provided", () => {
        const { container } = render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} />
            </WaldiezThemeProvider>,
        );
        // Modal should not be visible when no chat is provided
        expect(container.querySelector(".modal-body")).toBeFalsy();
    });

    it("should render with chat messages", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        expect(screen.getByText("Hello")).toBeTruthy();
    });

    it("should render input prompt", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        expect(screen.getByText("Please enter your response")).toBeTruthy();
    });

    it("should render text input when not password mode", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.type).toBe("text");
        expect(input.placeholder).toBe("Enter your message here");
    });

    it("should render password input when password mode is enabled", () => {
        const passwordChat = {
            ...mockChat,
            activeRequest: {
                ...mockChat.activeRequest!,
                password: true,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={passwordChat} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.type).toBe("password");
        expect(input.placeholder).toBe("Enter your password");
    });

    it("should toggle password visibility", () => {
        const passwordChat = {
            ...mockChat,
            activeRequest: {
                ...mockChat.activeRequest!,
                password: true,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={passwordChat} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        const toggleButton = screen.getByLabelText("Show password");

        expect(input.type).toBe("password");
        fireEvent.click(toggleButton);
        expect(input.type).toBe("text");
        fireEvent.click(screen.getByLabelText("Hide password"));
        expect(input.type).toBe("password");
    });

    it("should handle text input change", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;

        fireEvent.change(input, { target: { value: "Test message" } });
        expect(input.value).toBe("Test message");
    });

    it("should submit input on button click", () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        const submitButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-submit`);

        fireEvent.change(input, { target: { value: "Test message" } });
        fireEvent.click(submitButton);

        expect(onUserInput).toHaveBeenCalled();
    });

    it("should submit input on Enter key", () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`);

        fireEvent.change(input, { target: { value: "Test message" } });
        fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

        expect(onUserInput).toHaveBeenCalled();
    });

    it("should not submit input on Enter key with Shift", () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`);

        fireEvent.change(input, { target: { value: "Test message" } });
        fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

        expect(onUserInput).not.toHaveBeenCalled();
    });

    it("should handle image upload", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        const imageInput = screen.getByTestId(`rf-${mockFlowId}-chat-modal-image`) as HTMLInputElement;

        const file = new File(["dummy content"], "test.png", { type: "image/png" });
        Object.defineProperty(imageInput, "files", {
            value: [file],
        });

        fireEvent.change(imageInput);

        // Wait for FileReader to process
        waitFor(() => {
            expect(screen.getByAltText("Preview")).toBeTruthy();
        });
    });

    it("should clear image preview", async () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        const imageInput = screen.getByTestId(`rf-${mockFlowId}-chat-modal-image`) as HTMLInputElement;

        const file = new File(["dummy content"], "test.png", { type: "image/png" });
        Object.defineProperty(imageInput, "files", {
            value: [file],
        });

        fireEvent.change(imageInput);

        await waitFor(() => {
            expect(screen.getByAltText("Preview")).toBeTruthy();
        });

        const removeButton = screen.getByLabelText("Remove uploaded image");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByAltText("Preview")).toBeFalsy();
        });
    });

    it("should not show image upload button when media config disallows images", () => {
        const chatWithoutImages = {
            ...mockChat,
            mediaConfig: {
                allowedTypes: [] as string[],
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithoutImages} />
            </WaldiezThemeProvider>,
        );
        const imageInput = screen.queryByTestId(`rf-${mockFlowId}-chat-modal-image`);
        expect(imageInput).toBeFalsy();
    });

    it("should handle modal close", () => {
        const onClose = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onClose,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );
        const closeButton = screen.getByTitle("Close");

        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });

    it("should handle interrupt", () => {
        const onInterrupt = vi.fn();
        const chatWithInactive = {
            ...mockChat,
            active: false,
            handlers: {
                ...mockChat.handlers,
                onInterrupt,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithInactive} />
            </WaldiezThemeProvider>,
        );
        const interruptButton = screen.getByTitle("Interrupt");

        fireEvent.click(interruptButton);
        expect(onInterrupt).toHaveBeenCalled();
    });

    it("should show timeline button when timeline data is available", () => {
        const chatWithTimeline = {
            ...mockChat,
            timeline: mockTimelineData,
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithTimeline} />
            </WaldiezThemeProvider>,
        );
        const timelineButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-timeline`);
        expect(timelineButton).toBeTruthy();
    });

    it("should disable input when no active request", () => {
        const chatWithoutRequest = {
            ...mockChat,
            activeRequest: undefined,
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithoutRequest} />
            </WaldiezThemeProvider>,
        );
        const input = screen.queryByTestId(`rf-${mockFlowId}-chat-modal-input`);
        expect(input).toBeFalsy();
    });

    it("should reset input state when modal opens", () => {
        const { rerender } = render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={{ ...mockChat, show: false }} />
            </WaldiezThemeProvider>,
        );

        // Reopen modal
        rerender(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={{ ...mockChat, show: true }} />
            </WaldiezThemeProvider>,
        );

        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        expect(input.value).toBe("");
    });

    it("should clear input after submission", async () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );
        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`) as HTMLInputElement;
        const submitButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-submit`);

        fireEvent.change(input, { target: { value: "Test message" } });
        expect(input.value).toBe("Test message");

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(input.value).toBe("");
        });
    });

    it("should handle file select modal operations", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );
        const imageInput = screen.getByTestId(`rf-${mockFlowId}-chat-modal-image`);

        // Open file select modal
        fireEvent.click(imageInput);

        // Close on blur
        fireEvent.blur(imageInput);
    });

    it("should submit with image data when image is attached", async () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );

        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`);
        const imageInput = screen.getByTestId(`rf-${mockFlowId}-chat-modal-image`) as HTMLInputElement;
        const submitButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-submit`);

        // Add text
        fireEvent.change(input, { target: { value: "Test with image" } });

        // Add image
        const file = new File(["dummy content"], "test.png", { type: "image/png" });
        Object.defineProperty(imageInput, "files", {
            value: [file],
        });
        fireEvent.change(imageInput);

        await waitFor(() => {
            expect(screen.getByAltText("Preview")).toBeTruthy();
        });

        // Submit
        fireEvent.click(submitButton);

        expect(onUserInput).toHaveBeenCalled();
        const callArg = onUserInput.mock.calls[0]![0];
        expect(callArg.data).toBeDefined();
        expect(callArg.data.length).toBeGreaterThan(0);
    });

    it("should fallback to local close when no handler provided", () => {
        const chatWithoutCloseHandler = {
            ...mockChat,
            handlers: {
                onUserInput: vi.fn(),
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithoutCloseHandler} />
            </WaldiezThemeProvider>,
        );
        const closeButton = screen.getByTitle("Close");

        fireEvent.click(closeButton);
        // Should close locally without error
    });

    it("should render empty message list gracefully", () => {
        const chatWithoutMessages = {
            ...mockChat,
            messages: [],
        };
        const { baseElement } = render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithoutMessages} />
            </WaldiezThemeProvider>,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should handle modal cancel event", () => {
        const onClose = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onClose,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );

        const dialog = screen.getByTestId(`rf-${mockFlowId}-chat-modal`);
        fireEvent.keyDown(dialog, { key: "Escape" });

        expect(onClose).toHaveBeenCalled();
    });

    it("should create proper input response format", () => {
        const onUserInput = vi.fn();
        const chatWithHandler = {
            ...mockChat,
            handlers: {
                ...mockChat.handlers,
                onUserInput,
            },
        };
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithHandler} />
            </WaldiezThemeProvider>,
        );

        const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`);
        const submitButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-submit`);

        fireEvent.change(input, { target: { value: "Test response" } });
        fireEvent.click(submitButton);

        expect(onUserInput).toHaveBeenCalled();
        const response = onUserInput.mock.calls[0]![0];
        expect(response.id).toBeDefined();
        expect(response.request_id).toBe("req-1");
        expect(response.type).toBe("input_response");
        expect(response.timestamp).toBeDefined();
        expect(response.data[0].content.type).toBe("text");
        expect(response.data[0].content.text).toBe("Test response");
    });

    it("should focus input when modal opens with active request", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );

        waitFor(() => {
            const input = screen.getByTestId(`rf-${mockFlowId}-chat-modal-input`);
            expect(document.activeElement).toBe(input);
        });
    });

    it("should not render chat wrapper when no messages", () => {
        const chatWithoutMessages = {
            ...mockChat,
            messages: [] as any[],
        };
        const { container } = render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={chatWithoutMessages} />
            </WaldiezThemeProvider>,
        );
        expect(container.querySelector(".chat-wrapper")).toBeFalsy();
    });

    it("should render ChatUI with correct props", () => {
        render(
            <WaldiezThemeProvider>
                <ChatModal flowId={mockFlowId} isDarkMode={false} chat={mockChat} />
            </WaldiezThemeProvider>,
        );

        const chatWrapper = screen.getByTestId(`rf-${mockFlowId}-chat-modal`).querySelector(".chat-wrapper");
        expect(chatWrapper).toBeTruthy();
        expect(chatWrapper?.getAttribute("data-flow-id")).toBe(mockFlowId);
    });
});
