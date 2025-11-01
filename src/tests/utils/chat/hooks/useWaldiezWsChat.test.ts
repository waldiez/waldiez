/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezChatConfig, WaldiezChatHandlers } from "@waldiez/components/chatUI/types";
import {
    type WaldiezChatMessageDeduplicationOptions,
    useWaldiezChat,
} from "@waldiez/utils/chat/hooks/useWaldiezChat";
import { useWaldiezWsChat } from "@waldiez/utils/chat/hooks/useWaldiezWsChat";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

// Mock dependencies
vi.mock("@waldiez/utils/chat/hooks/useWaldiezChat", () => ({
    useWaldiezChat: vi.fn(),
}));

vi.mock("@waldiez/utils/ws", () => ({
    useWaldiezWs: vi.fn(),
}));

const mockedUseWaldiezChat = vi.mocked(useWaldiezChat);
const mockedUseWaldiezWs = vi.mocked(useWaldiezWs);

describe("useWaldiezWsChat", () => {
    const mockChatHook = {
        chat: {
            show: false,
            active: false,
            messages: [],
            userParticipants: [],
            activeRequest: undefined,
            error: undefined,
            timeline: undefined,
            mediaConfig: undefined,
            handlers: undefined,
        } as WaldiezChatConfig,
        dispatch: vi.fn(),
        process: vi.fn(),
        reset: vi.fn(),
        setActive: vi.fn(),
        setShow: vi.fn(),
        setActiveRequest: vi.fn(),
        setError: vi.fn(),
        setTimeline: vi.fn(),
        setParticipants: vi.fn(),
        addMessage: vi.fn(),
        removeMessage: vi.fn(),
        clearMessages: vi.fn(),
    };

    const mockWsHook = {
        wsRef: undefined as any,
        send: vi.fn(),
        connected: false,
        getConnectionState: vi.fn(() => 0), // WebSocket.CONNECTING
        reconnect: vi.fn(),
        disconnect: vi.fn(),
        setMessageHandler: vi.fn(),
    };

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
        mockedUseWaldiezChat.mockReturnValue(mockChatHook);
        mockedUseWaldiezWs.mockReturnValue(mockWsHook);
    });

    describe("initialization", () => {
        it("should initialize with required WebSocket configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
                protocols: ["chat"],
                autoPingMs: 30000,
                onError: vi.fn(),
            };

            const { result } = renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith({});
            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "ws://localhost:8080",
                protocols: ["chat"],
                autoPingMs: 30000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            expect(result.current.chat).toBe(mockChatHook.chat);
            expect(result.current.dispatch).toBe(mockChatHook.dispatch);
            expect(result.current.connected).toBe(mockWsHook.connected);
            expect(result.current.reset).toBe(mockChatHook.reset);
            expect(result.current.getConnectionState).toBe(mockWsHook.getConnectionState);
            expect(result.current.send).toBe(mockWsHook.send);
            expect(result.current.reconnect).toBe(mockWsHook.reconnect);
        });

        it("should initialize with chat configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const chatConfig = {
                initialConfig: {
                    show: true,
                    active: true,
                } as Partial<WaldiezChatConfig>,
                handlers: mockHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: {
                    enabled: true,
                    maxCacheSize: 500,
                } as WaldiezChatMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezWsChat({
                    ws: wsConfig,
                    chat: chatConfig,
                }),
            );

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith(chatConfig);
        });

        it("should handle minimal WebSocket configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "ws://localhost:8080",
                protocols: undefined,
                autoPingMs: undefined,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });
        });
    });

    describe("WebSocket message handling", () => {
        let wsMessageHandler: WaldiezWsMessageHandler;

        beforeEach(() => {
            const wsConfig = {
                url: "ws://localhost:8080",
                onError: vi.fn(),
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            // Extract the message handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            wsMessageHandler = wsCall.onWsMessage!;
        });

        it("should process JSON string messages", () => {
            const messageData = { type: "text", content: "Hello" };
            const mockEvent = {
                data: JSON.stringify(messageData),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should process object messages directly", () => {
            const messageData = { type: "text", content: "Hello" };
            const mockEvent = {
                data: messageData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should handle invalid JSON by passing raw data", () => {
            const invalidJsonData = "invalid json {";
            const mockEvent = {
                data: invalidJsonData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(invalidJsonData);
        });

        it("should handle non-string, non-object data", () => {
            const binaryData = new ArrayBuffer(8);
            const mockEvent = {
                data: binaryData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(binaryData);
        });

        it("should handle empty messages", () => {
            const mockEvent = {
                data: "",
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith("");
        });

        it("should handle null/undefined data", () => {
            const mockEvent = {
                data: null,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(null);
        });
    });

    describe("error handling", () => {
        it("should call provided onError handler and set chat error", () => {
            const onError = vi.fn();
            const wsConfig = {
                url: "ws://localhost:8080",
                onError,
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            // Get the error handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const errorHandler = wsCall.onError!;

            const testError = new Error("WebSocket error");
            errorHandler(testError);

            expect(onError).toHaveBeenCalledWith(testError);
            expect(mockChatHook.setError).toHaveBeenCalledWith({
                message: "Connection error occurred",
                code: "CONNECTION_ERROR",
            });
        });

        it("should handle missing onError gracefully but still set chat error", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            // Get the error handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const errorHandler = wsCall.onError!;

            // Should not throw when onError is not provided
            expect(() => {
                errorHandler(new Error("test"));
            }).not.toThrow();

            expect(mockChatHook.setError).toHaveBeenCalledWith({
                message: "Connection error occurred",
                code: "CONNECTION_ERROR",
            });
        });
    });

    describe("WebSocket state management", () => {
        it("should reflect WebSocket connection state", () => {
            mockWsHook.connected = true;
            mockedUseWaldiezWs.mockReturnValue(mockWsHook);

            const { result } = renderHook(() =>
                useWaldiezWsChat({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            expect(result.current.connected).toBe(true);
        });

        it("should provide WebSocket connection state getter", () => {
            const { result } = renderHook(() =>
                useWaldiezWsChat({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            const state = result.current.getConnectionState();
            expect(mockWsHook.getConnectionState).toHaveBeenCalled();
            expect(state).toBe(0);
        });

        it("should provide reconnect functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsChat({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.reconnect();

            expect(mockWsHook.reconnect).toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complex WebSocket and chat configuration", () => {
            const wsConfig = {
                url: "wss://production.example.com/chat",
                protocols: ["chat-v1", "chat-v2"],
                autoPingMs: 60000,
                onError: vi.fn(),
            };

            const chatConfig = {
                initialConfig: {
                    show: true,
                    active: false,
                    messages: [
                        {
                            id: "welcome",
                            type: "text" as const,
                            content: "Welcome to chat!",
                            timestamp: "2024-01-01T12:00:00Z",
                            sender: "system",
                            recipient: "user",
                        },
                    ],
                } as Partial<WaldiezChatConfig>,
                handlers: {
                    onUserInput: vi.fn(),
                    onMediaUpload: vi.fn(),
                    onChatError: vi.fn(),
                    onMessageStreamEvent: vi.fn(),
                    onInterrupt: vi.fn(),
                    onClose: vi.fn(),
                },
                preprocess: vi.fn().mockReturnValue({ handled: false, updated: null }),
                onPreview: vi.fn().mockReturnValue("https://preview.example.com"),
                deduplicationOptions: {
                    enabled: true,
                    maxCacheSize: 1000,
                    keyGenerator: vi.fn(),
                },
            };

            const { result } = renderHook(() =>
                useWaldiezWsChat({
                    ws: wsConfig,
                    chat: chatConfig,
                }),
            );

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith(chatConfig);
            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "wss://production.example.com/chat",
                protocols: ["chat-v1", "chat-v2"],
                autoPingMs: 60000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            // Verify all expected return values are exposed
            expect(result.current).toHaveProperty("chat");
            expect(result.current).toHaveProperty("dispatch");
            expect(result.current).toHaveProperty("connected");
            expect(result.current).toHaveProperty("reset");
            expect(result.current).toHaveProperty("getConnectionState");
            expect(result.current).toHaveProperty("send");
            expect(result.current).toHaveProperty("reconnect");
        });

        it("should handle message processing chain correctly", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            // Get the message handler
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate receiving a complex message
            const complexMessage = {
                type: "text",
                content: {
                    content: "Hello from WebSocket!",
                    sender: "remote-user",
                    recipient: "local-user",
                },
                timestamp: "2024-01-01T12:00:00Z",
            };

            const mockEvent = {
                data: JSON.stringify(complexMessage),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(complexMessage);
        });

        it("should handle rapid message sequences", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig }));

            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate rapid message sequence
            const messages = Array.from({ length: 10 }, (_, i) => ({
                type: "text",
                content: `Message ${i}`,
                id: `msg-${i}`,
            }));

            act(() => {
                messages.forEach(msg => {
                    const mockEvent = {
                        data: JSON.stringify(msg),
                    } as MessageEvent;
                    wsMessageHandler(mockEvent);
                });
            });

            expect(mockChatHook.process).toHaveBeenCalledTimes(10);
            messages.forEach((msg, index) => {
                expect(mockChatHook.process).toHaveBeenNthCalledWith(index + 1, msg);
            });
        });
    });

    describe("edge cases", () => {
        it("should handle undefined chat configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsChat({ ws: wsConfig, chat: undefined }));

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith({});
        });

        it("should handle partial chat configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const partialChatConfig = {
                handlers: { onUserInput: vi.fn() },
            };

            renderHook(() =>
                useWaldiezWsChat({
                    ws: wsConfig,
                    chat: partialChatConfig,
                }),
            );

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith(partialChatConfig);
        });

        it("should handle WebSocket URL variations", () => {
            const testUrls = [
                "ws://localhost:8080",
                "wss://secure.example.com",
                "ws://192.168.1.100:3000/chat",
                "wss://example.com:443/ws/chat?token=abc123",
            ];

            testUrls.forEach(url => {
                const { unmount } = renderHook(() => useWaldiezWsChat({ ws: { url } }));

                expect(mockedUseWaldiezWs).toHaveBeenCalledWith(expect.objectContaining({ wsUrl: url }));

                unmount();
                vi.clearAllMocks();
                mockedUseWaldiezChat.mockReturnValue(mockChatHook);
                mockedUseWaldiezWs.mockReturnValue(mockWsHook);
            });
        });
    });
});
