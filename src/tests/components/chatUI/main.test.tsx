/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatUI } from "@waldiez/components/chatUI";
import { type WaldiezChatMessage } from "@waldiez/components/chatUI/types";

// Mock the dependencies with inline functions
vi.mock("@waldiez/components/chatUI/utils", () => ({
    parseMessageContent: vi.fn((content: any) => <div data-testid="parsed-content">{String(content)}</div>),
}));

vi.mock("@waldiez/components/chatUI/imageModal", () => ({
    ImageModal: ({ isOpen, imageUrl, onClose }: any) =>
        isOpen ? (
            <div data-testid="image-modal">
                <img src={imageUrl} alt="Preview" />
                <button onClick={onClose} data-testid="close-modal">
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock("@waldiez/theme", () => ({
    WALDIEZ_ICON: "/mock-waldiez-icon.svg",
}));

// Mock useImageRetry for ChatUI tests
const mockResetRetries = vi.fn();
vi.mock("@waldiez/components/chatUI/hooks", () => ({
    useImageRetry: vi.fn(() => ({
        resetRetries: mockResetRetries,
    })),
}));

// Mock timers for useImageRetry tests
vi.useFakeTimers();

const mockMessages: WaldiezChatMessage[] = [
    {
        id: "msg-1",
        timestamp: "2024-01-01T10:00:00Z",
        type: "user",
        content: "Hello, how are you?",
        sender: "user1",
        recipient: "assistant1",
    },
    {
        id: "msg-2",
        timestamp: "2024-01-01T10:00:30Z",
        type: "agent",
        content: "I'm doing well, thank you for asking!",
        sender: "assistant1",
        recipient: "user1",
    },
    {
        id: "msg-3",
        timestamp: "2024-01-01T10:01:00Z",
        type: "system",
        content: "System message: Connection established",
    },
    {
        id: "msg-4",
        timestamp: "2024-01-01T10:01:30Z",
        type: "error",
        content: "Error: Something went wrong",
    },
    {
        id: "msg-5",
        timestamp: "2024-01-01T10:02:00Z",
        type: "input_request",
        content: "Please provide your input",
    },
    {
        id: "msg-6",
        timestamp: "2024-01-01T10:02:30Z",
        type: "termination",
        content: "Chat terminated",
    },
];

const getMessageAt = (index: number): WaldiezChatMessage => mockMessages[index]!;

const setup = (messages = mockMessages, userParticipants = ["user1"], isDarkMode = false) => {
    return render(<ChatUI messages={messages} userParticipants={userParticipants} isDarkMode={isDarkMode} />);
};

describe("ChatUI", () => {
    // Get the mocked function after imports are resolved
    let mockParseMessageContent: any;

    beforeAll(async () => {
        const utils = await import("@waldiez/components/chatUI/utils");
        mockParseMessageContent = vi.mocked(utils.parseMessageContent);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
        if (mockParseMessageContent) {
            mockParseMessageContent.mockImplementation((content: any) => (
                <div data-testid="parsed-content">{String(content)}</div>
            ));
        }
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.useFakeTimers();
    });

    it("should render successfully", () => {
        const { baseElement } = setup();
        expect(baseElement).toBeTruthy();
    });

    it("should render chat container", () => {
        setup();
        const chatContainer = document.querySelector(".chat-container");
        expect(chatContainer).toBeInTheDocument();
    });

    it("should render all messages", () => {
        setup();
        const messages = screen.getAllByTestId("rf-chat-message");
        expect(messages).toHaveLength(mockMessages.length);
    });

    it("should display user messages with user class", () => {
        setup();
        const userMessage = screen.getAllByTestId("rf-chat-message")[0]!;
        expect(userMessage).toHaveClass("user-message");
    });

    it("should display assistant messages with assistant class", () => {
        setup();
        const assistantMessage = screen.getAllByTestId("rf-chat-message")[1]!;
        expect(assistantMessage).toHaveClass("assistant-message");
    });

    it("should display system messages with system class", () => {
        setup();
        const systemMessage = screen.getAllByTestId("rf-chat-message")[2]!;
        expect(systemMessage).toHaveClass("system-message");
    });

    it("should display error messages with error class", () => {
        setup();
        const errorMessage = screen.getAllByTestId("rf-chat-message")[3]!;
        expect(errorMessage).toHaveClass("error-message");
    });

    it("should display input request messages with request class", () => {
        setup();
        const requestMessage = screen.getAllByTestId("rf-chat-message")[4]!;
        expect(requestMessage).toHaveClass("request-message");
    });

    it("should display termination messages with system class", () => {
        setup();
        const terminationMessage = screen.getAllByTestId("rf-chat-message")[5]!;
        expect(terminationMessage).toHaveClass("system-message");
    });

    it("should show assistant avatar for assistant messages", () => {
        setup();
        const assistantAvatar = screen.getByAltText("Assistant Avatar");
        expect(assistantAvatar).toBeInTheDocument();
        expect(assistantAvatar).toHaveAttribute("src", "/mock-waldiez-icon.svg");
    });

    it("should show user avatar for user messages", () => {
        setup();
        const userAvatars = document.querySelectorAll(".user-avatar");
        expect(userAvatars.length).toBeGreaterThan(0);
    });

    it("should display timestamps for all messages", () => {
        setup();
        const timestamps = document.querySelectorAll(".message-timestamp");
        expect(timestamps).toHaveLength(mockMessages.length);
    });

    it("should display sender names when available", () => {
        setup();
        const senders = document.querySelectorAll(".message-sender");
        expect(senders.length).toBeGreaterThan(0);
    });

    it("should handle messages with parsing errors gracefully", () => {
        mockParseMessageContent.mockImplementationOnce(() => {
            throw new Error("Parsing failed");
        });

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        setup([getMessageAt(0)]);

        expect(consoleSpy).toHaveBeenCalledWith("Error parsing message content:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("should not render messages that fail to parse", () => {
        mockParseMessageContent.mockReturnValueOnce(null);

        setup([getMessageAt(0)]);

        const messages = screen.queryAllByTestId("rf-chat-message");
        expect(messages).toHaveLength(0);
    });

    it("should handle empty messages array", () => {
        setup([]);
        const messages = screen.queryAllByTestId("rf-chat-message");
        expect(messages).toHaveLength(0);
    });

    it("should handle messages without sender", () => {
        const messagesWithoutSender = [
            {
                ...getMessageAt(0),
                sender: undefined,
            },
        ];

        setup(messagesWithoutSender);
        const messages = screen.getAllByTestId("rf-chat-message");
        expect(messages).toHaveLength(1);
    });

    it("should handle numeric timestamps", () => {
        const messagesWithNumericTimestamp = [
            {
                ...getMessageAt(0),
                timestamp: Date.now(),
            },
        ];

        setup(messagesWithNumericTimestamp);
        const messages = screen.getAllByTestId("rf-chat-message");
        expect(messages).toHaveLength(1);
    });

    it("should open image preview when image is clicked", () => {
        mockParseMessageContent.mockImplementation((_content: any, _isDarkMode: any, onImageClick: any) => (
            <button onClick={() => onImageClick("https://example.com/image.jpg")} data-testid="test-image">
                Image
            </button>
        ));

        setup([getMessageAt(0)]);

        const imageButton = screen.getByTestId("test-image");
        fireEvent.click(imageButton);

        const modal = screen.getByTestId("image-modal");
        expect(modal).toBeInTheDocument();
    });

    it("should close image preview when close button is clicked", () => {
        mockParseMessageContent.mockImplementation((_content: any, _isDarkMode: any, onImageClick: any) => (
            <button onClick={() => onImageClick("https://example.com/image.jpg")} data-testid="test-image">
                Image
            </button>
        ));

        setup([getMessageAt(0)]);

        // Open modal
        const imageButton = screen.getByTestId("test-image");
        fireEvent.click(imageButton);

        // Close modal
        const closeButton = screen.getByTestId("close-modal");
        fireEvent.click(closeButton);

        const modal = screen.queryByTestId("image-modal");
        expect(modal).not.toBeInTheDocument();
    });

    it("should scroll to bottom when new messages are added", () => {
        const mockScrollTo = vi.fn();
        const mockContainer = {
            scrollTop: 0,
            scrollHeight: 1000,
        };

        Object.defineProperty(mockContainer, "scrollTop", {
            set: mockScrollTo,
            get: () => 0,
        });

        const { rerender } = setup([getMessageAt(0)]);

        // Add a new message
        rerender(
            <ChatUI
                messages={[getMessageAt(0), getMessageAt(1)]}
                userParticipants={["user1"]}
                isDarkMode={false}
            />,
        );

        act(() => {
            vi.advanceTimersByTime(500);
        });

        // We can't easily test the scrolling directly due to jsdom limitations,
        // but we can verify the component renders without errors when messages change
        expect(screen.getAllByTestId("rf-chat-message")).toHaveLength(2);
    });

    it("should handle dark mode prop", () => {
        setup(mockMessages, ["user1"], true);

        expect(mockParseMessageContent).toHaveBeenCalledWith(expect.anything(), true, expect.any(Function));
    });

    it("should call resetRetries when messages length changes", () => {
        const { rerender } = setup([getMessageAt(0)]);

        rerender(
            <ChatUI
                messages={[getMessageAt(0), getMessageAt(1)]}
                userParticipants={["user1"]}
                isDarkMode={false}
            />,
        );

        expect(mockResetRetries).toHaveBeenCalled();
    });

    it("should generate unique keys for messages", () => {
        setup();

        const messages = screen.getAllByTestId("rf-chat-message");

        // All messages should render successfully
        expect(messages.length).toBe(mockMessages.length);
    });

    it("should handle fallback message types without avatars", () => {
        const customMessage: WaldiezChatMessage = {
            id: "custom-1",
            timestamp: "2024-01-01T10:00:00Z",
            type: "custom_type" as any,
            content: "Custom message",
            sender: "custom_sender",
        };

        setup([customMessage]);

        const message = screen.getByTestId("rf-chat-message");
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass("assistant-message"); // fallback class
    });

    it("should pass correct parameters to parseMessageContent", () => {
        setup([getMessageAt(0)], ["user1"], false);

        expect(mockParseMessageContent).toHaveBeenCalledWith(
            getMessageAt(0).content,
            false,
            expect.any(Function),
        );
    });

    it("should handle user participants correctly", () => {
        setup([getMessageAt(0)], ["user1"]);

        const userMessage = screen.getByTestId("rf-chat-message");
        expect(userMessage).toHaveClass("user-message");
    });

    it("should classify non-user participants as assistant messages", () => {
        setup([getMessageAt(1)], ["user1"]);

        const assistantMessage = screen.getByTestId("rf-chat-message");
        expect(assistantMessage).toHaveClass("assistant-message");
    });
});

// Tests for useImageRetry hook without mocking
describe("useImageRetry (real implementation)", () => {
    // Temporarily unmock the hook for these tests
    beforeAll(() => {
        vi.doUnmock("@waldiez/components/chatUI/hooks");
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.useFakeTimers();
    });

    it("should return registerImage and resetRetries functions", async () => {
        // Import the real hook after unmocking
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());

        expect(result.current.registerImage).toBeDefined();
        expect(result.current.resetRetries).toBeDefined();
        expect(typeof result.current.registerImage).toBe("function");
        expect(typeof result.current.resetRetries).toBe("function");
    });

    it("should handle successful image load", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // Simulate successful load
        act(() => {
            if (img.onload) {
                img.onload(new Event("load"));
            }
        });

        expect(img.classList.contains("loading")).toBe(false);
        expect(img.classList.contains("failed")).toBe(false);
        expect(img.style.opacity).toBe("1");
    });

    it("should handle image load error and retry", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry(3, 1000));
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // Simulate error
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        // Advance timers to trigger retry
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(img.src).toContain("retry=1");
    });

    it("should stop retrying after max retries reached", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry(2, 500));
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // First error
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Second error
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Third error (should fail permanently)
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        expect(img.classList.contains("loading")).toBe(false);
        expect(img.classList.contains("failed")).toBe(true);
        expect(img.style.opacity).toBe("0.8");
    });

    it("should reset retries when resetRetries is called", async () => {
        // noinspection DuplicatedCode
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // Trigger error to start retry count
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        // Reset retries
        act(() => {
            result.current.resetRetries();
        });

        // Should work as if no previous errors occurred
        result.current.registerImage(img, url);

        act(() => {
            if (img.onload) {
                img.onload(new Event("load"));
            }
        });

        expect(img.classList.contains("failed")).toBe(false);
    });

    it("should handle custom maxRetries and retryDelay", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry(1, 2000));
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // First error
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        // Should retry after 2000ms
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(img.src).toContain("retry=1");

        // Second error should fail permanently (maxRetries = 1)
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        expect(img.classList.contains("failed")).toBe(true);
    });

    it("should handle multiple images with different URLs", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());
        const img1 = document.createElement("img");
        const img2 = document.createElement("img");
        const url1 = "https://example.com/image1.jpg";
        const url2 = "https://example.com/image2.jpg";

        result.current.registerImage(img1, url1);
        result.current.registerImage(img2, url2);

        // img1 fails
        act(() => {
            if (img1.onerror) {
                img1.onerror(new Event("error"));
            }
        });

        // img2 succeeds
        act(() => {
            if (img2.onload) {
                img2.onload(new Event("load"));
            }
        });

        expect(img2.classList.contains("loading")).toBe(false);
        expect(img2.classList.contains("failed")).toBe(false);

        // Advance timer for img1 retry
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(img1.src).toContain("retry=1");
    });

    it("should append retry parameter correctly to URLs with existing query params", async () => {
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg?size=large";

        result.current.registerImage(img, url);

        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(img.src).toContain("&retry=1");
    });

    it("should remove URL from retries map on successful load", async () => {
        // noinspection DuplicatedCode
        const { useImageRetry: realUseImageRetry } = await import("@waldiez/components/chatUI/hooks");
        const { result } = renderHook(() => realUseImageRetry());
        const img = document.createElement("img");
        const url = "https://example.com/image.jpg";

        result.current.registerImage(img, url);

        // Simulate error first
        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        // Then successful load
        act(() => {
            if (img.onload) {
                img.onload(new Event("load"));
            }
        });

        // Register again - should start from 0 retries
        // noinspection DuplicatedCode
        result.current.registerImage(img, url);

        act(() => {
            if (img.onerror) {
                img.onerror(new Event("error"));
            }
        });

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(img.src).toContain("retry=1");
    });
});
