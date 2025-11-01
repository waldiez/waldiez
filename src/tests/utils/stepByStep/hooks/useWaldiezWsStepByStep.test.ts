/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezStepByStep, WaldiezStepHandlers } from "@waldiez/components/stepByStep/types";
import {
    type WaldiezStepByStepMessageDeduplicationOptions,
    useWaldiezStepByStep,
} from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import { useWaldiezWsStepByStep } from "@waldiez/utils/stepByStep/hooks/useWaldiezWsStepByStep";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

// Mock dependencies
vi.mock("@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep", () => ({
    useWaldiezStepByStep: vi.fn(),
}));

vi.mock("@waldiez/utils/ws", () => ({
    useWaldiezWs: vi.fn(),
}));

const mockedUseWaldiezStepByStep = vi.mocked(useWaldiezStepByStep);
const mockedUseWaldiezWs = vi.mocked(useWaldiezWs);

describe("useWaldiezWsStepByStep", () => {
    const mockStepByStepHook = {
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
        dispatch: vi.fn(),
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
    };

    const mockWsHook = {
        wsRef: undefined as any,
        send: vi.fn(),
        connected: false,
        getConnectionState: vi.fn(() => 0), //WebSocket.CONNECTING
        reconnect: vi.fn(),
        disconnect: vi.fn(),
        setMessageHandler: vi.fn(),
    };

    const mockHandlers: WaldiezStepHandlers = {
        onStart: vi.fn(),
        close: vi.fn(),
        sendControl: vi.fn(),
        respond: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseWaldiezStepByStep.mockReturnValue(mockStepByStepHook);
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

            const { result } = renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith({});
            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "ws://localhost:8080",
                protocols: ["chat"],
                autoPingMs: 30000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            expect(result.current.stepByStep).toBe(mockStepByStepHook.stepByStep);
            expect(result.current.dispatch).toBe(mockStepByStepHook.dispatch);
            expect(result.current.connected).toBe(mockWsHook.connected);
            expect(result.current.reset).toBe(mockStepByStepHook.reset);
            expect(result.current.getConnectionState).toBe(mockWsHook.getConnectionState);
            expect(result.current.send).toBe(mockWsHook.send);
            expect(result.current.reconnect).toBe(mockWsHook.reconnect);
        });

        it("should initialize with step-by-step configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const stepByStepConfig = {
                initialConfig: {
                    show: true,
                    active: true,
                } as Partial<WaldiezStepByStep>,
                handlers: mockHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: {
                    enabled: true,
                    maxCacheSize: 500,
                } as WaldiezStepByStepMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezWsStepByStep({
                    ws: wsConfig,
                    stepByStep: stepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith(stepByStepConfig);
        });

        it("should handle minimal WebSocket configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

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

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            // Extract the message handler passed to useWaldiezWs
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            wsMessageHandler = wsCall.onWsMessage!;
        });

        it("should process JSON string messages", () => {
            const messageData = { type: "debug_message", content: "test" };
            const mockEvent = {
                data: JSON.stringify(messageData),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should process object messages directly", () => {
            const messageData = { type: "debug_message", content: "test" };
            const mockEvent = {
                data: messageData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(messageData);
        });

        it("should handle invalid JSON by passing raw data", () => {
            const invalidJsonData = "invalid json {";
            const mockEvent = {
                data: invalidJsonData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(invalidJsonData);
        });

        it("should handle non-string, non-object data", () => {
            const binaryData = new ArrayBuffer(8);
            const mockEvent = {
                data: binaryData,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(binaryData);
        });

        it("should handle empty messages", () => {
            const mockEvent = {
                data: "",
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith("");
        });

        it("should handle null/undefined data", () => {
            const mockEvent = {
                data: null,
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(null);
        });
    });

    describe("error handling", () => {
        it("should call provided onError handler", () => {
            const onError = vi.fn();
            const wsConfig = {
                url: "ws://localhost:8080",
                onError,
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

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

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

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
                useWaldiezWsStepByStep({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            expect(result.current.connected).toBe(true);
        });

        it("should provide WebSocket connection state getter", () => {
            const { result } = renderHook(() =>
                useWaldiezWsStepByStep({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            const state = result.current.getConnectionState();
            expect(mockWsHook.getConnectionState).toHaveBeenCalled();
            expect(state).toBe(0);
        });

        it("should provide reconnect functionality", () => {
            const { result } = renderHook(() =>
                useWaldiezWsStepByStep({
                    ws: { url: "ws://localhost:8080" },
                }),
            );

            result.current.reconnect();

            expect(mockWsHook.reconnect).toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complex WebSocket and step-by-step configuration", () => {
            const wsConfig = {
                url: "wss://production.example.com/step-by-step",
                protocols: ["debug-v1", "debug-v2"],
                autoPingMs: 60000,
                onError: vi.fn(),
            };

            const stepByStepConfig = {
                initialConfig: {
                    show: true,
                    active: false,
                    stepMode: true,
                    eventHistory: [
                        {
                            id: "event1",
                            type: "debug_print",
                            content: "Starting debug session",
                            timestamp: "2024-01-01T12:00:00Z",
                        },
                    ],
                } as Partial<WaldiezStepByStep>,
                handlers: {
                    onStart: vi.fn(),
                    close: vi.fn(),
                    sendControl: vi.fn(),
                    respond: vi.fn(),
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
                useWaldiezWsStepByStep({
                    ws: wsConfig,
                    stepByStep: stepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith(stepByStepConfig);
            expect(mockedUseWaldiezWs).toHaveBeenCalledWith({
                wsUrl: "wss://production.example.com/step-by-step",
                protocols: ["debug-v1", "debug-v2"],
                autoPingMs: 60000,
                onWsMessage: expect.any(Function),
                onError: expect.any(Function),
            });

            // Verify all expected return values are exposed
            expect(result.current).toHaveProperty("stepByStep");
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

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            // Get the message handler
            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate receiving a complex debug message
            const complexMessage = {
                type: "debug_event_info",
                event: {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                    content: "Hello from step-by-step!",
                },
                metadata: {
                    timestamp: "2024-01-01T12:00:00Z",
                    step: 5,
                },
            };

            const mockEvent = {
                data: JSON.stringify(complexMessage),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(complexMessage);
        });

        it("should handle rapid debug message sequences", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate rapid debug message sequence
            const messages = Array.from({ length: 10 }, (_, i) => ({
                type: "debug_print",
                content: `Debug step ${i + 1}`,
                timestamp: `2024-01-01T12:0${i}:00Z`,
                id: `debug-${i}`,
            }));

            act(() => {
                messages.forEach(msg => {
                    const mockEvent = {
                        data: JSON.stringify(msg),
                    } as MessageEvent;
                    wsMessageHandler(mockEvent);
                });
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledTimes(10);
            messages.forEach((msg, index) => {
                expect(mockStepByStepHook.process).toHaveBeenNthCalledWith(index + 1, msg);
            });
        });
    });

    describe("edge cases", () => {
        it("should handle undefined stepByStep configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig, stepByStep: undefined }));

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith({});
        });

        it("should handle partial stepByStep configuration", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            const partialStepByStepConfig = {
                handlers: { sendControl: vi.fn() },
            };

            renderHook(() =>
                useWaldiezWsStepByStep({
                    ws: wsConfig,
                    stepByStep: partialStepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith(partialStepByStepConfig);
        });

        it("should handle WebSocket URL variations", () => {
            const testUrls = [
                "ws://localhost:8080",
                "wss://secure.example.com",
                "ws://192.168.1.100:3000/debug",
                "wss://example.com:443/ws/step?token=abc123",
            ];

            testUrls.forEach(url => {
                const { unmount } = renderHook(() => useWaldiezWsStepByStep({ ws: { url } }));

                expect(mockedUseWaldiezWs).toHaveBeenCalledWith(expect.objectContaining({ wsUrl: url }));

                unmount();
                vi.clearAllMocks();
                mockedUseWaldiezStepByStep.mockReturnValue(mockStepByStepHook);
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

            const { result, rerender } = renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            expect(result.current.connected).toBe(false);

            // Simulate connection
            mockWsHook.connected = true;
            mockedUseWaldiezWs.mockReturnValue(mockWsHook);

            rerender();

            expect(result.current.connected).toBe(true);
        });

        it("should handle debug control responses", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate debug input request
            const inputRequest = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: "Enter debug command:",
            };

            const mockEvent = {
                data: JSON.stringify(inputRequest),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(inputRequest);
        });

        it("should handle breakpoint messages", () => {
            const wsConfig = {
                url: "ws://localhost:8080",
            };

            renderHook(() => useWaldiezWsStepByStep({ ws: wsConfig }));

            const wsCall = mockedUseWaldiezWs.mock.calls[0]![0];
            const wsMessageHandler = wsCall.onWsMessage!;

            // Simulate breakpoint hit
            const breakpointHit = {
                type: "debug_breakpoint_hit",
                breakpoint: {
                    id: "bp-1",
                    type: "message",
                    condition: "sender == 'user'",
                },
                event: {
                    type: "message",
                    sender: "user",
                    content: "Hello",
                },
            };

            const mockEvent = {
                data: JSON.stringify(breakpointHit),
            } as MessageEvent;

            act(() => {
                wsMessageHandler(mockEvent);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(breakpointHit);
        });
    });
});
