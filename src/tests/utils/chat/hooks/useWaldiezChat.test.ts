/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatParticipant,
} from "@waldiez/components/chatUI/types";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { WORKFLOW_DONE } from "@waldiez/utils/chat/constants";
import {
    type WaldiezChatMessageDeduplicationOptions,
    defaultChatConfig,
    useWaldiezChat,
} from "@waldiez/utils/chat/hooks/useWaldiezChat";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat/processor";
import type { WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

// Mock dependencies
vi.mock("@waldiez/utils/chat/processor", () => ({
    WaldiezChatMessageProcessor: {
        process: vi.fn(),
    },
}));

vi.mock("@waldiez/components/chatUI/utils/messageKey", () => ({
    getMessageKey: vi.fn(
        (message: WaldiezChatMessage) =>
            `${message.id || message.uuid || message.type || "unknown"}-${Date.now()}`,
    ),
}));

const mockedChatMessageProcessorProcess = vi.mocked(WaldiezChatMessageProcessor.process);

describe("useWaldiezChat", () => {
    const mockHandlers: WaldiezChatHandlers = {
        onUserInput: vi.fn(),
        onMediaUpload: vi.fn(),
        onChatError: vi.fn(),
        onMessageStreamEvent: vi.fn(),
        onInterrupt: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("initialization", () => {
        it("should initialize with default configuration", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            expect(result.current.chat).toEqual({
                ...defaultChatConfig,
                handlers: {},
            });
        });

        it("should initialize with custom configuration", () => {
            const initialConfig: Partial<WaldiezChatConfig> = {
                show: true,
                active: true,
                messages: [
                    {
                        id: "1",
                        type: "text",
                        content: "Hello",
                        timestamp: "2024-01-01T12:00:00Z",
                        sender: "user",
                        recipient: "assistant",
                    },
                ],
                userParticipants: [{ id: "user", name: "User", isUser: true }],
            };

            const { result } = renderHook(() => useWaldiezChat({ initialConfig, handlers: mockHandlers }));

            expect(result.current.chat.show).toBe(true);
            expect(result.current.chat.active).toBe(true);
            expect(result.current.chat.messages).toHaveLength(1);
            expect(result.current.chat.userParticipants).toHaveLength(1);
            expect(result.current.chat.handlers).toEqual(mockHandlers);
        });

        it("should merge handlers correctly", () => {
            const partialHandlers = {
                onUserInput: vi.fn(),
                onClose: vi.fn(),
            };

            const { result } = renderHook(() => useWaldiezChat({ handlers: partialHandlers }));

            expect(result.current.chat.handlers?.onUserInput).toBe(partialHandlers.onUserInput);
            expect(result.current.chat.handlers?.onClose).toBe(partialHandlers.onClose);
        });

        it("should merge initial config handlers with provided handlers", () => {
            const initialHandlers = {
                onUserInput: vi.fn(),
                onInterrupt: vi.fn(),
            };

            const providedHandlers = {
                onUserInput: vi.fn(), // Should override
                onClose: vi.fn(), // Should be added
            };

            const initialConfig: Partial<WaldiezChatConfig> = {
                handlers: initialHandlers,
            };

            const { result } = renderHook(() =>
                useWaldiezChat({ initialConfig, handlers: providedHandlers }),
            );

            expect(result.current.chat.handlers?.onUserInput).toBe(providedHandlers.onUserInput);
            expect(result.current.chat.handlers?.onClose).toBe(providedHandlers.onClose);
            expect(result.current.chat.handlers?.onInterrupt).toBe(initialHandlers.onInterrupt);
        });
    });

    describe("state management", () => {
        it("should update active state", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.setActive(true);
            });

            expect(result.current.chat.active).toBe(true);

            act(() => {
                result.current.setActive(false);
            });

            expect(result.current.chat.active).toBe(false);
        });

        it("should update show state", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.setShow(true);
            });

            expect(result.current.chat.show).toBe(true);

            act(() => {
                result.current.setShow(false);
            });

            expect(result.current.chat.show).toBe(false);
        });

        it("should update error state", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const error: WaldiezChatError = {
                message: "Test error",
                code: "TEST_ERROR",
            };

            act(() => {
                result.current.setError(error);
            });

            expect(result.current.chat.error).toEqual(error);

            act(() => {
                result.current.setError(undefined);
            });

            expect(result.current.chat.error).toBeUndefined();
        });

        it("should update timeline", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockTimeline: WaldiezTimelineData = {
                timeline: [],
                cost_timeline: [],
                summary: {
                    total_sessions: 1,
                    total_time: 2,
                    total_cost: 3,
                    total_agents: 4,
                    total_events: 5,
                    total_tokens: 6,
                    avg_cost_per_session: 7,
                    compression_info: {
                        gaps_compressed: 8,
                        time_saved: 9,
                    },
                },
                metadata: {
                    time_range: [10, 11],
                    cost_range: [12, 13],
                },
                agents: [],
            };

            act(() => {
                result.current.setTimeline(mockTimeline);
            });

            expect(result.current.chat.timeline).toEqual(mockTimeline);

            act(() => {
                result.current.setTimeline(undefined);
            });

            expect(result.current.chat.timeline).toBeUndefined();
        });

        it("should update participants", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockParticipants: WaldiezChatParticipant[] = [
                { id: "1", name: "User", isUser: true },
                { id: "2", name: "Assistant", isUser: false },
            ];

            act(() => {
                result.current.setParticipants(mockParticipants);
            });

            expect(result.current.chat.userParticipants).toEqual([{ id: "1", name: "User", isUser: true }]);
        });

        it("should update active request", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockRequest: WaldiezActiveRequest = {
                request_id: "test-req",
                prompt: "Enter input:",
                password: false,
            };

            act(() => {
                result.current.setActiveRequest(mockRequest);
            });

            expect(result.current.chat.activeRequest).toEqual(mockRequest);

            act(() => {
                result.current.setActiveRequest(undefined);
            });

            expect(result.current.chat.activeRequest).toBeUndefined();
        });
    });

    describe("message management", () => {
        it("should add messages", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };

            act(() => {
                result.current.addMessage(mockMessage);
            });

            expect(result.current.chat.messages).toHaveLength(1);
            expect(result.current.chat.messages[0]).toEqual(mockMessage);
        });

        it("should remove messages", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };

            act(() => {
                result.current.addMessage(mockMessage);
            });

            expect(result.current.chat.messages).toHaveLength(1);

            act(() => {
                result.current.removeMessage("msg1");
            });

            expect(result.current.chat.messages).toHaveLength(0);
        });

        it("should clear all messages", () => {
            const { result } = renderHook(() => useWaldiezChat({}));
            const mockMessage1: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };
            const mockMessage2: WaldiezChatMessage = {
                id: "msg2",
                type: "text",
                content: "Hi",
                timestamp: "2024-01-01T12:01:00Z",
                sender: "assistant",
                recipient: "user",
            };

            act(() => {
                result.current.addMessage(mockMessage1);
                result.current.addMessage(mockMessage2);
            });

            expect(result.current.chat.messages).toHaveLength(2);

            act(() => {
                result.current.clearMessages();
            });

            expect(result.current.chat.messages).toHaveLength(0);
        });
    });

    describe("deduplication", () => {
        it("should deduplicate messages when enabled", () => {
            const deduplicationOptions: WaldiezChatMessageDeduplicationOptions = {
                enabled: true,
                keyGenerator: message => message.id!,
                maxCacheSize: 100,
            };

            const { result } = renderHook(() => useWaldiezChat({ deduplicationOptions }));

            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };

            act(() => {
                result.current.addMessage(mockMessage);
                result.current.addMessage(mockMessage); // Should be deduplicated
            });

            expect(result.current.chat.messages).toHaveLength(1);
        });

        it("should not deduplicate when disabled", () => {
            const deduplicationOptions: WaldiezChatMessageDeduplicationOptions = {
                enabled: false,
            };

            const { result } = renderHook(() => useWaldiezChat({ deduplicationOptions }));

            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };

            act(() => {
                result.current.addMessage(mockMessage);
                result.current.addMessage(mockMessage);
            });

            expect(result.current.chat.messages).toHaveLength(2);
        });

        it("should respect max cache size", () => {
            const deduplicationOptions: WaldiezChatMessageDeduplicationOptions = {
                enabled: true,
                keyGenerator: message => message.id!,
                maxCacheSize: 2,
            };

            const { result } = renderHook(() => useWaldiezChat({ deduplicationOptions }));

            // Add more messages than cache size
            for (let i = 0; i < 5; i++) {
                act(() => {
                    result.current.addMessage({
                        id: `msg${i}`,
                        type: "text",
                        content: `Message ${i}`,
                        timestamp: "2024-01-01T12:00:00Z",
                        sender: "user",
                        recipient: "assistant",
                    });
                });
            }

            expect(result.current.chat.messages).toHaveLength(5);
        });

        it("should remove message from cache when message is removed", () => {
            const keyGenerator = vi.fn((message: WaldiezChatMessage) => message.id!);
            const deduplicationOptions: WaldiezChatMessageDeduplicationOptions = {
                enabled: true,
                keyGenerator,
                maxCacheSize: 100,
            };

            const { result } = renderHook(() => useWaldiezChat({ deduplicationOptions }));

            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };
            act(() => {
                result.current.addMessage(mockMessage);
            });
            expect(keyGenerator).toHaveBeenCalledWith(mockMessage);
            expect(result.current.chat.messages).toHaveLength(1);
            act(() => {
                result.current.removeMessage("msg1");
            });
            expect(result.current.chat.messages).toHaveLength(0);
        });
    });

    describe("message processing", () => {
        it("should process messages through the processor", () => {
            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "processed-msg",
                    type: "text",
                    content: "Processed message",
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                },
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "text", content: "test" });
            });

            expect(mockedChatMessageProcessorProcess).toHaveBeenCalledWith(
                { type: "text", content: "test" },
                undefined,
                undefined,
            );
            expect(result.current.chat.messages).toHaveLength(1);
            expect(result.current.chat.messages[0]).toEqual(mockResult.message);
        });

        it("should handle preprocessing", () => {
            const preprocess = vi.fn().mockReturnValue({ handled: false, updated: { modified: true } });

            const { result } = renderHook(() => useWaldiezChat({ preprocess }));

            mockedChatMessageProcessorProcess.mockReturnValue(undefined);

            act(() => {
                result.current.process({ original: true });
            });

            expect(preprocess).toHaveBeenCalledWith({ original: true });
            expect(mockedChatMessageProcessorProcess).toHaveBeenCalledWith(
                { modified: true },
                undefined,
                undefined,
            );
        });

        it("should skip processing when preprocessing handles the message", () => {
            const preprocess = vi.fn().mockReturnValue({ handled: true });

            const { result } = renderHook(() => useWaldiezChat({ preprocess }));

            act(() => {
                result.current.process({ original: true });
            });

            expect(preprocess).toHaveBeenCalledWith({ original: true });
            expect(mockedChatMessageProcessorProcess).not.toHaveBeenCalled();
        });

        it("should handle workflow done messages", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            // Set active to true first
            act(() => {
                result.current.setActive(true);
            });

            expect(result.current.chat.active).toBe(true);

            act(() => {
                result.current.process(WORKFLOW_DONE);
            });

            expect(result.current.chat.active).toBe(false);
            expect(mockedChatMessageProcessorProcess).not.toHaveBeenCalled();
        });

        it("should handle processing errors", () => {
            mockedChatMessageProcessorProcess.mockImplementation(() => {
                throw new Error("Processing failed");
            });

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "test" });
            });

            expect(result.current.chat.error).toEqual({
                message: "Processing failed",
                code: "PROCESSING_ERROR",
            });
        });

        it("should handle input request processing results", () => {
            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "input-msg",
                    type: "input_request",
                    prompt: "Enter your input:",
                    content: "Enter your input:",
                    password: true,
                    request_id: "req-123",
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                },
                requestId: "req-123",
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "input_request" });
            });

            expect(result.current.chat.activeRequest).toEqual({
                request_id: "req-123",
                prompt: "Enter your input:",
                password: true,
            });
            expect(result.current.chat.messages).toHaveLength(1);
        });

        it("should handle timeline processing results", () => {
            const mockTimeline: WaldiezTimelineData = {
                timeline: [],
                cost_timeline: [],
                summary: {
                    total_sessions: 1,
                    total_time: 2,
                    total_cost: 3,
                    total_agents: 4,
                    total_events: 5,
                    total_tokens: 6,
                    avg_cost_per_session: 7,
                    compression_info: {
                        gaps_compressed: 8,
                        time_saved: 9,
                    },
                },
                metadata: {
                    time_range: [10, 11],
                    cost_range: [12, 13],
                },
                agents: [],
            };

            const mockResult: WaldiezChatMessageProcessingResult = {
                timeline: mockTimeline,
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "timeline" });
            });

            expect(result.current.chat.timeline).toEqual(mockTimeline);
        });

        it("should handle participants processing results", () => {
            const mockParticipants: WaldiezChatParticipant[] = [
                { id: "1", name: "User", isUser: true },
                { id: "2", name: "Assistant", isUser: false },
            ];

            const mockResult: WaldiezChatMessageProcessingResult = {
                participants: mockParticipants,
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "participants" });
            });

            expect(result.current.chat.userParticipants).toEqual([{ id: "1", name: "User", isUser: true }]);
        });

        it("should pass request ID and preview URL to processor", () => {
            const onPreview = vi.fn().mockReturnValue("https://preview.url");
            const mockRequest: WaldiezActiveRequest = {
                request_id: "active-req",
                prompt: "test",
                password: false,
            };

            const { result } = renderHook(() => useWaldiezChat({ onPreview }));

            // Set active request
            act(() => {
                result.current.setActiveRequest(mockRequest);
            });

            mockedChatMessageProcessorProcess.mockReturnValue(undefined);

            act(() => {
                result.current.process({ type: "test" });
            });

            expect(onPreview).toHaveBeenCalledWith("active-req");
            expect(mockedChatMessageProcessorProcess).toHaveBeenCalledWith(
                { type: "test" },
                "active-req",
                "https://preview.url",
            );
        });

        it("should handle fallback request_id for input requests", () => {
            const mockRequest: WaldiezActiveRequest = {
                request_id: "fallback-req",
                prompt: "existing",
                password: false,
            };

            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "input-msg",
                    type: "input_request",
                    prompt: "New input:",
                    content: "New input:",
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                },
                requestId: "new-req",
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            // Set existing active request
            act(() => {
                result.current.setActiveRequest(mockRequest);
            });

            act(() => {
                result.current.process({ type: "input_request" });
            });

            expect(result.current.chat.activeRequest?.request_id).toBe("new-req");
        });

        it("should handle end of workflow messages", () => {
            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "end-msg",
                    type: "text",
                    content: "Workflow completed",
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                },
                isWorkflowEnd: true,
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            // Set active to true first
            act(() => {
                result.current.setActive(true);
            });

            expect(result.current.chat.active).toBe(true);

            act(() => {
                result.current.process({ type: "end" });
            });

            expect(result.current.chat.active).toBe(false);
            expect(result.current.chat.messages).toHaveLength(1);
        });
    });

    describe("reset functionality", () => {
        it("should reset to initial configuration", () => {
            const initialConfig: Partial<WaldiezChatConfig> = {
                show: true,
                active: true,
                messages: [
                    {
                        id: "initial-msg",
                        type: "text",
                        content: "Initial message",
                        timestamp: "2024-01-01T12:00:00Z",
                        sender: "user",
                        recipient: "assistant",
                    },
                ],
            };

            const { result } = renderHook(() => useWaldiezChat({ initialConfig }));

            // Modify state
            act(() => {
                result.current.setShow(false);
                result.current.setActive(false);
                result.current.clearMessages();
            });

            expect(result.current.chat.show).toBe(false);
            expect(result.current.chat.active).toBe(false);
            expect(result.current.chat.messages).toHaveLength(0);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.chat.show).toBe(true);
            expect(result.current.chat.active).toBe(true);
            expect(result.current.chat.messages).toHaveLength(1);
            expect(result.current.chat.messages[0]!.id).toBe("initial-msg");
        });

        it("should clear message cache on reset", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            const mockMessage: WaldiezChatMessage = {
                id: "msg1",
                type: "text",
                content: "Hello",
                timestamp: "2024-01-01T12:00:00Z",
                sender: "user",
                recipient: "assistant",
            };

            act(() => {
                result.current.addMessage(mockMessage);
            });

            expect(result.current.chat.messages).toHaveLength(1);

            act(() => {
                result.current.reset();
            });

            // Add the same message again - should not be deduplicated since cache was cleared
            act(() => {
                result.current.addMessage(mockMessage);
            });

            expect(result.current.chat.messages).toHaveLength(1);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined/null processing data", () => {
            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process(null);
            });

            act(() => {
                result.current.process(undefined);
            });

            // Should not throw errors
            expect(result.current.chat).toBeDefined();
        });

        it("should handle processor returning undefined", () => {
            mockedChatMessageProcessorProcess.mockReturnValue(undefined);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "test" });
            });

            // Should not throw or change state
            expect(result.current.chat.messages).toHaveLength(0);
        });

        it("should handle input request without prompt", () => {
            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "input-msg",
                    type: "input_request",
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                    content: "Enter input:",
                },
                requestId: "req-123",
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "input_request" });
            });

            expect(result.current.chat.activeRequest?.prompt).toBe("Enter your message:");
            expect(result.current.chat.activeRequest?.password).toBe(false);
        });

        it("should handle input request with password field", () => {
            const mockResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "input-msg",
                    type: "input_request",
                    prompt: "Enter password:",
                    content: "Enter password:",
                    password: "true", // String representation
                    timestamp: "2024-01-01T12:00:00Z",
                    sender: "assistant",
                    recipient: "user",
                },
                requestId: "req-123",
            };

            mockedChatMessageProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezChat({}));

            act(() => {
                result.current.process({ type: "input_request" });
            });

            expect(result.current.chat.activeRequest?.password).toBe(true);
        });
    });
});
