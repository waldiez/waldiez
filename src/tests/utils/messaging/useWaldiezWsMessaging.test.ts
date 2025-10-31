/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezChatConfig, WaldiezChatHandlers } from "@waldiez/components/chatUI/types";
import type { WaldiezStepByStep, WaldiezStepHandlers } from "@waldiez/components/stepByStep/types";
import { type WaldiezChatMessageDeduplicationOptions } from "@waldiez/utils/chat/hooks/useWaldiezChat";
import { useWaldiezMessaging } from "@waldiez/utils/messaging/useWaldiezMessaging";
import { useWaldiezWsMessaging } from "@waldiez/utils/messaging/useWaldiezWsMessaging";
import { type WaldiezStepByStepMessageDeduplicationOptions } from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

// Mock dependencies
vi.mock("@waldiez/utils/messaging/useWaldiezMessaging", () => ({
    useWaldiezMessaging: vi.fn(),
}));

vi.mock("@waldiez/utils/ws", () => ({
    useWaldiezWs: vi.fn(),
}));

const mockedUseWaldiezMessaging = vi.mocked(useWaldiezMessaging);
const mockedUseWaldiezWs = vi.mocked(useWaldiezWs);

describe("useWaldiezWsMessaging", () => {
    const mockMessagingHook = {
        save: vi.fn().mockResolvedValue(undefined),
        convert: vi.fn().mockResolvedValue(undefined),
        run: vi.fn().mockResolvedValue(undefined),
        stepRun: vi.fn().mockResolvedValue(undefined),
        getRunningMode: vi.fn(() => undefined),
        setRunningMode: vi.fn(),
        process: vi.fn(),
        reset: vi.fn(),
        dispatch: {
            chat: vi.fn(),
            step: vi.fn(),
        },
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
        stepByStep: {
            show: false,
            active: false,
            stepMode: true,
            autoContinue: false,
            currentEvent: undefined,
            pendingControlInput: undefined,
            activeRequest: undefined,
            eventHistory: [],
            participants: [],
            breakpoints: [],
            lastError: undefined,
            timeline: undefined,
            stats: undefined,
            help: undefined,
            handlers: undefined,
        } as WaldiezStepByStep,
        actions: {
            chat: {
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
            },
            step: {
                process: vi.fn(),
                reset: vi.fn(),
                setActive: vi.fn(),
                setShow: vi.fn(),
                setActiveRequest: vi.fn(),
                setPendingControl: vi.fn(),
                setBreakpoints: vi.fn(),
                setError: vi.fn(),
                setTimeline: vi.fn(),
                setParticipants: vi.fn(),
                addEvent: vi.fn(),
                removeEvent: vi.fn(),
                clearEvents: vi.fn(),
            },
        },
    };

    const mockWsHook = {
        wsRef: undefined as any,
        send: vi.fn(),
        connected: false,
        getConnectionState: vi.fn(() => WebSocket.CONNECTING as number),
        reconnect: vi.fn(),
        disconnect: vi.fn(),
        setMessageHandler: vi.fn(),
    };

    const mockHandlers = {
        onSave: vi.fn(),
        onConvert: vi.fn(),
        onRun: vi.fn(),
        onStepRun: vi.fn(),
        preprocess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseWaldiezMessaging.mockReturnValue(mockMessagingHook);
        mockedUseWaldiezWs.mockReturnValue(mockWsHook);
    });

    describe("initialization", () => {
        it("should initialize with required configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
                protocols: ["messaging"],
                autoPingMs: 30000,
                onError: vi.fn(),
            };

            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "test-flow",
                onSave: undefined,
                onConvert: undefined,
                onRun: undefined,
                onStepRun: undefined,
                preprocess: undefined,
                chat: undefined,
                stepByStep: undefined,
            });

            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "ws://localhost:8080",
                protocols: ["messaging"],
                autoPingMs: 30000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            // Verify exposed interface
            expect(result.current.save).toBe(mockMessagingHook.save);
            expect(result.current.convert).toBe(mockMessagingHook.convert);
            expect(result.current.run).toBe(mockMessagingHook.run);
            expect(result.current.stepRun).toBe(mockMessagingHook.stepRun);
            expect(result.current.getRunningMode).toBe(mockMessagingHook.getRunningMode);
            expect(result.current.setRunningMode).toBe(mockMessagingHook.setRunningMode);
            expect(result.current.reset).toBe(mockMessagingHook.reset);
            expect(result.current.dispatch).toBe(mockMessagingHook.dispatch);
            expect(result.current.chat).toBe(mockMessagingHook.chat);
            expect(result.current.stepByStep).toBe(mockMessagingHook.stepByStep);
            expect(result.current.actions).toBe(mockMessagingHook.actions);
            expect(result.current.send).toBe(mockWsHook.send);
            expect(result.current.connected).toBe(mockWsHook.connected);
            expect(result.current.getConnectionState).toBe(mockWsHook.getConnectionState);
        });

        it("should initialize with all handlers", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
                onError: vi.fn(),
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                    onSave: mockHandlers.onSave,
                    onConvert: mockHandlers.onConvert,
                    onRun: mockHandlers.onRun,
                    onStepRun: mockHandlers.onStepRun,
                    preprocess: mockHandlers.preprocess,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "test-flow",
                onSave: mockHandlers.onSave,
                onConvert: mockHandlers.onConvert,
                onRun: mockHandlers.onRun,
                onStepRun: mockHandlers.onStepRun,
                preprocess: mockHandlers.preprocess,
                chat: undefined,
                stepByStep: undefined,
            });
        });

        it("should initialize with chat configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const chatConfig = {
                initialConfig: { show: true, active: true } as Partial<WaldiezChatConfig>,
                handlers: { onSend: vi.fn() } as WaldiezChatHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: { enabled: true } as WaldiezChatMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                    chat: chatConfig,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "test-flow",
                onSave: undefined,
                onConvert: undefined,
                onRun: undefined,
                onStepRun: undefined,
                preprocess: undefined,
                chat: chatConfig,
                stepByStep: undefined,
            });
        });

        it("should initialize with step-by-step configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const stepByStepConfig = {
                initialConfig: { show: true, active: true } as Partial<WaldiezStepByStep>,
                handlers: { respond: vi.fn(), sendControl: vi.fn() } as WaldiezStepHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: { enabled: true } as WaldiezStepByStepMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                    stepByStep: stepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "test-flow",
                onSave: undefined,
                onConvert: undefined,
                onRun: undefined,
                onStepRun: undefined,
                preprocess: undefined,
                chat: undefined,
                stepByStep: stepByStepConfig,
            });
        });

        it("should handle minimal WebSocket configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

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

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            // Extract the message handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            wsMessageHandler = wsCall.onWsMessage!;
        });

        it("should process JSON string messages", () => {
            const messageData = { type: "message", content: "Hello" };
            const mockEvent = {
                data: JSON.stringify(messageData),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should process object messages directly", () => {
            const messageData = { type: "message", content: "Hello" };
            const mockEvent = {
                data: messageData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should handle invalid JSON by passing raw data", () => {
            const invalidJsonData = "invalid json {";
            const mockEvent = {
                data: invalidJsonData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(invalidJsonData);
        });

        it("should handle non-string, non-object data", () => {
            const binaryData = new ArrayBuffer(8);
            const mockEvent = {
                data: binaryData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(binaryData);
        });

        it("should handle empty messages", () => {
            const mockEvent = {
                data: "",
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith("");
        });

        it("should handle null/undefined data", () => {
            const mockEvent = {
                data: null,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(null);
        });
    });

    describe("error handling", () => {
        it("should call provided onError handler", () => {
            const onError = vi.fn();
            const wsConfig = {
                url: "ws://localhost:8080",
                onError,
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            // Get the error handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const errorHandler = wsCall.onError!;

            const testError = new Error("WebSocket error");
            errorHandler(testError);

            expect(onError).toHaveBeenCalledWith(testError);
        });

        it("should handle missing onError gracefully", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            // Get the error handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const errorHandler = wsCall.onError!;

            // Should not throw when onError is not provided
            expect(() => {
                errorHandler(new Error("test"));
            }).not.toThrow();
        });
    });

    describe("WebSocket state management", () => {
        it("should reflect WebSocket connection state", () => {
            mockWsHook.connected = true;
            mockedUseWaldiezWs.mockReturnValue(mockWsHook);

            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            expect(result.current.connected).toBe(true);
        });

        it("should provide WebSocket connection state getter", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            const state = result.current.getConnectionState();
            expect(mockWsHook.getConnectionState).toHaveBeenCalled();
            expect(state).toBe(WebSocket.CONNECTING);
        });

        it("should provide send functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            const message = { type: "test", data: "hello" };
            result.current.send(message);

            expect(mockWsHook.send).toHaveBeenCalledWith(message);
        });

        it("should provide reconnect functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.reconnect();

            expect(mockWsHook.reconnect).toHaveBeenCalled();
        });

        it("should provide disconnect functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.disconnect();

            expect(mockWsHook.disconnect).toHaveBeenCalled();
        });
    });

    describe("messaging functionality delegation", () => {
        it("should delegate save functionality", async () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            await result.current.save("content", "/path");

            expect(mockMessagingHook.save).toHaveBeenCalledWith("content", "/path");
        });

        it("should delegate convert functionality", async () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            await result.current.convert("content", "py", "/path");

            expect(mockMessagingHook.convert).toHaveBeenCalledWith("content", "py", "/path");
        });

        it("should delegate run functionality", async () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            await result.current.run("content", "/path");

            expect(mockMessagingHook.run).toHaveBeenCalledWith("content", "/path");
        });

        it("should delegate stepRun functionality", async () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            const breakpoints = ["message"];
            await result.current.stepRun("content", breakpoints, "/path");

            expect(mockMessagingHook.stepRun).toHaveBeenCalledWith("content", breakpoints, "/path");
        });

        it("should delegate running mode management", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.getRunningMode();
            expect(mockMessagingHook.getRunningMode).toHaveBeenCalled();

            result.current.setRunningMode("chat");
            expect(mockMessagingHook.setRunningMode).toHaveBeenCalledWith("chat");
        });

        it("should delegate reset functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.reset();

            expect(mockMessagingHook.reset).toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complex configuration", () => {
            const wsConfig = {
                url: "wss://production.example.com/messaging",
                protocols: ["messaging-v1", "messaging-v2"],
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
                            content: "Welcome to messaging!",
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

            const stepByStepConfig = {
                initialConfig: {
                    show: false,
                    active: false,
                    stepMode: true,
                } as Partial<WaldiezStepByStep>,
                handlers: {
                    respond: vi.fn(),
                    sendControl: vi.fn(),
                },
                preprocess: vi.fn(),
                deduplicationOptions: {
                    enabled: false,
                },
            };

            const { result } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "production-flow",
                    ws: wsConfig,
                    onSave: mockHandlers.onSave,
                    onConvert: mockHandlers.onConvert,
                    onRun: mockHandlers.onRun,
                    onStepRun: mockHandlers.onStepRun,
                    preprocess: mockHandlers.preprocess,
                    chat: chatConfig,
                    stepByStep: stepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "production-flow",
                onSave: mockHandlers.onSave,
                onConvert: mockHandlers.onConvert,
                onRun: mockHandlers.onRun,
                onStepRun: mockHandlers.onStepRun,
                preprocess: mockHandlers.preprocess,
                chat: chatConfig,
                stepByStep: stepByStepConfig,
            });

            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "wss://production.example.com/messaging",
                protocols: ["messaging-v1", "messaging-v2"],
                autoPingMs: 60000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            // Verify all expected return values are exposed
            expect(result.current).toHaveProperty("save");
            expect(result.current).toHaveProperty("convert");
            expect(result.current).toHaveProperty("run");
            expect(result.current).toHaveProperty("stepRun");
            expect(result.current).toHaveProperty("getRunningMode");
            expect(result.current).toHaveProperty("setRunningMode");
            expect(result.current).toHaveProperty("reset");
            expect(result.current).toHaveProperty("actions");
            expect(result.current).toHaveProperty("dispatch");
            expect(result.current).toHaveProperty("chat");
            expect(result.current).toHaveProperty("stepByStep");
            expect(result.current).toHaveProperty("connected");
            expect(result.current).toHaveProperty("getConnectionState");
            expect(result.current).toHaveProperty("send");
            expect(result.current).toHaveProperty("reconnect");
            expect(result.current).toHaveProperty("disconnect");
        });

        it("should handle message processing chain correctly", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            // Get the message handler
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate receiving a complex message
            const complexMessage = {
                type: "workflow_status",
                data: {
                    flowId: "test-flow",
                    status: "running",
                    mode: "chat",
                    messages: [
                        {
                            id: "msg1",
                            type: "text",
                            content: "Hello from WebSocket!",
                            sender: "remote-user",
                            recipient: "local-user",
                        },
                    ],
                },
                timestamp: "2024-01-01T12:00:00Z",
            };

            const mockEvent = {
                data: JSON.stringify(complexMessage),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockMessagingHook.process).toHaveBeenCalledWith(complexMessage);
        });

        it("should handle rapid message sequences", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate rapid message sequence
            const messages = Array.from({ length: 10 }, (_, i) => ({
                type: "progress_update",
                progress: (i + 1) * 10,
                step: `Step ${i + 1}`,
                id: `progress-${i}`,
            }));

            act(() => {
                messages.forEach(msg => {
                    const mockEvent = {
                        data: JSON.stringify(msg),
                    } as MessageEvent;
                    wsMessageHandler(mockEvent);
                });
            });

            expect(mockMessagingHook.process).toHaveBeenCalledTimes(10);
            messages.forEach((msg, index) => {
                expect(mockMessagingHook.process).toHaveBeenNthCalledWith(index + 1, msg);
            });
        });
    });

    describe("edge cases", () => {
        it("should handle undefined chat and stepByStep configurations", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                    chat: undefined,
                    stepByStep: undefined,
                }),
            );

            expect(mockedUseWaldiezMessaging).toHaveBeenCalledWith({
                flowId: "test-flow",
                onSave: undefined,
                onConvert: undefined,
                onRun: undefined,
                onStepRun: undefined,
                preprocess: undefined,
                chat: undefined,
                stepByStep: undefined,
            });
        });

        it("should handle WebSocket URL variations", () => {
            const testUrls = [
                "ws://localhost:8080",
                "wss://secure.example.com",
                "ws://192.168.1.100:3000/messaging",
                "wss://example.com:443/ws/messaging?token=abc123",
            ];

            testUrls.forEach(url => {
                const { unmount } = renderHook(() =>
                    useWaldiezWsMessaging({
                        flowId: "test-flow",
                        ws: { url },
                    }),
                );

                expect(mockedUseWaldiezWs).toHaveBeenCalledWith(expect.objectContaining({ wsUrl: url }));

                unmount();
                vi.clearAllMocks();
                mockedUseWaldiezMessaging.mockReturnValue(mockMessagingHook);
                mockedUseWaldiezWs.mockReturnValue(mockWsHook);
            });
        });

        it("should handle WebSocket connection state changes", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            // Start disconnected
            mockWsHook.connected = false;
            mockedUseWaldiezWs.mockReturnValue(mockWsHook);

            const { result, rerender } = renderHook(() =>
                useWaldiezWsMessaging({
                    flowId: "test-flow",
                    ws: wsConfig,
                }),
            );

            expect(result.current.connected).toBe(false);

            // Simulate connection
            mockWsHook.connected = true;
            mockedUseWaldiezWs.mockReturnValue(mockWsHook);

            rerender();

            expect(result.current.connected).toBe(true);
        });
    });
});
