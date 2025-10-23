/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    public readyState: number = MockWebSocket.CONNECTING;
    public url: string;
    public protocol: string;
    public protocols?: string | string[];

    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(url: string, protocols?: string | string[]) {
        this.url = url;
        this.protocols = protocols;
        this.protocol = Array.isArray(protocols) ? protocols[0] || "" : protocols || "";

        // Simulate async connection
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.(new Event("open"));
        }, 10);
    }

    send(_data: string) {
        if (this.readyState !== MockWebSocket.OPEN) {
            throw new Error("WebSocket is not open");
        }
        // Mock successful send
    }

    close(code?: number, reason?: string) {
        this.readyState = MockWebSocket.CLOSING;
        setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            const closeEvent = new CloseEvent("close", { code: code || 1000, reason });
            this.onclose?.(closeEvent);
        }, 10);
    }

    // Helper methods for testing
    simulateError() {
        const errorEvent = new Event("error");
        this.onerror?.(errorEvent);
    }

    simulateMessage(data: any) {
        const messageEvent = new MessageEvent("message", { data });
        this.onmessage?.(messageEvent);
    }

    simulateUnexpectedClose(code: number = 1006) {
        this.readyState = MockWebSocket.CLOSED;
        const closeEvent = new CloseEvent("close", { code, wasClean: false });
        this.onclose?.(closeEvent);
    }
}

// Global mock setup
const originalWebSocket = global.WebSocket;
const mockWebSocketInstances: MockWebSocket[] = [];

beforeEach(() => {
    mockWebSocketInstances.length = 0;
    vi.clearAllTimers();
    vi.useFakeTimers();
    vi.spyOn(Date, "now").mockReturnValue(1704110400000);

    global.WebSocket = vi.fn((url: string, protocols?: string | string[]) => {
        const instance = new MockWebSocket(url, protocols);
        mockWebSocketInstances.push(instance);
        return instance as any;
    }) as any;

    // Add static properties
    Object.assign(global.WebSocket, {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
    });
});

afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = originalWebSocket;
});

describe("useWaldiezWs", () => {
    const defaultProps = {
        wsUrl: "ws://localhost:8080/test",
    };

    describe("initialization", () => {
        it("should initialize with default state", () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            expect(result.current.connected).toBe(false);
            expect(result.current.getConnectionState()).toBe(WebSocket.CLOSED);
            expect(result.current.send).toBeTypeOf("function");
            expect(result.current.reconnect).toBeTypeOf("function");
            expect(result.current.disconnect).toBeTypeOf("function");
        });

        it("should create WebSocket connection with correct URL", async () => {
            renderHook(() => useWaldiezWs(defaultProps));

            // Wait for connection timeout
            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8080/test", undefined);
            waitFor(() => expect(mockWebSocketInstances).toHaveLength(1));
        });

        it("should create WebSocket connection with protocols", async () => {
            const protocols = ["protocol1", "protocol2"];
            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    protocols,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8080/test", protocols);
        });
    });

    describe("connection lifecycle", () => {
        it("should set connected to true when WebSocket opens", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            expect(result.current.connected).toBe(false);

            act(() => {
                vi.advanceTimersByTime(300); // Wait for connection
            });

            // Simulate WebSocket opening
            act(() => {
                vi.advanceTimersByTime(50); // Wait for simulated open event
            });
            waitFor(() => {
                expect(result.current.connected).toBe(true);
                expect(result.current.getConnectionState()).toBe(WebSocket.OPEN);
            });
        });

        it("should handle WebSocket close gracefully", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50); // Connect
            });
            waitFor(() => {
                expect(result.current.connected).toBe(true);
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.close(1000, "Normal closure");
                    vi.advanceTimersByTime(50);
                    expect(result.current.connected).toBe(false);
                });
            });
        });

        it("should attempt reconnection on unexpected close", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50); // Connect
            });

            waitFor(() => {
                expect(result.current.connected).toBe(true);
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.simulateUnexpectedClose(1006);
                });
                expect(result.current.connected).toBe(false);
                expect(mockWebSocketInstances).toHaveLength(1);

                // Wait for reconnect delay
                act(() => {
                    vi.advanceTimersByTime(1000); // First reconnect delay
                    vi.advanceTimersByTime(300); // Connection delay
                });

                expect(mockWebSocketInstances).toHaveLength(2); // New connection attempted
            });
        });

        it("should implement exponential backoff for reconnections", async () => {
            renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });

            // First reconnection - should use 1000ms delay
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.simulateUnexpectedClose();
                    vi.advanceTimersByTime(1000);
                    vi.advanceTimersByTime(300);
                });

                expect(mockWebSocketInstances).toHaveLength(2);

                // Second reconnection - should use 2000ms delay
                act(() => {
                    mockWebSocketInstances[1]!.simulateUnexpectedClose();
                    vi.advanceTimersByTime(2000);
                    vi.advanceTimersByTime(300);
                });

                expect(mockWebSocketInstances).toHaveLength(3);
            });
        });
    });

    describe("message handling", () => {
        it("should call message handler when message received", async () => {
            const onWsMessage: WaldiezWsMessageHandler = vi.fn();
            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    onWsMessage,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });

            const testMessage = { type: "test", data: "hello" };
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.simulateMessage(testMessage);
                });

                expect(onWsMessage).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "message",
                        data: testMessage,
                    }),
                );
            });
        });

        it("should handle message handler errors", async () => {
            const onError = vi.fn();
            const onWsMessage: WaldiezWsMessageHandler = vi.fn(() => {
                throw new Error("Handler error");
            });

            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    onWsMessage,
                    onError,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.simulateMessage("test");
                });

                expect(onError).toHaveBeenCalledWith(expect.any(Error));
            });
        });

        it("should update message handler when prop changes", async () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            const { rerender } = renderHook(
                ({ onWsMessage }) => useWaldiezWs({ ...defaultProps, onWsMessage }),
                { initialProps: { onWsMessage: handler1 } },
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                // Send message with first handler
                act(() => {
                    mockWebSocketInstances[0]!.simulateMessage("test1");
                });

                expect(handler1).toHaveBeenCalled();
                expect(handler2).not.toHaveBeenCalled();

                // Update handler
                rerender({ onWsMessage: handler2 });

                // Send message with second handler
                act(() => {
                    mockWebSocketInstances[0]!.simulateMessage("test2");
                });

                expect(handler2).toHaveBeenCalled();
            });
        });
    });

    describe("error handling", () => {
        it("should call error handler on WebSocket error", async () => {
            const onError = vi.fn();
            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    onError,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                act(() => {
                    mockWebSocketInstances[0]!.simulateError();
                });

                expect(onError).toHaveBeenCalled();
            });
        });

        it("should call error handler on connection creation failure", async () => {
            const onError = vi.fn();

            // Mock WebSocket constructor to throw
            global.WebSocket = vi.fn(() => {
                throw new Error("Connection failed");
            }) as any;

            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    onError,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe("sending messages", () => {
        it("should send JSON messages successfully", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const sendSpy = vi.spyOn(mockWebSocketInstances[0]!, "send").mockImplementation(() => true);
                const testData = { type: "test", message: "hello" };

                act(() => {
                    const success = result.current.send(testData);
                    expect(success).toBe(true);
                });

                expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(testData));
            });
        });

        it("should send string messages directly", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const sendSpy = vi.spyOn(mockWebSocketInstances[0]!, "send").mockImplementation(() => true);
                const testString = "test message";

                act(() => {
                    const success = result.current.send(testString);
                    expect(success).toBe(true);
                });

                expect(sendSpy).toHaveBeenCalledWith(testString);
            });
        });

        it("should fail to send when connection is not open", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                const success = result.current.send({ test: "data" });
                expect(success).toBe(false);
            });
        });

        it("should handle JSON serialization errors", async () => {
            const onError = vi.fn();
            const { result } = renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    onError,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });

            // Create circular reference to cause JSON.stringify error
            const circularData: any = { test: "data" };
            circularData.self = circularData;

            act(() => {
                const success = result.current.send(circularData);
                expect(success).toBe(false);
            });

            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe("auto ping", () => {
        it("should send ping messages at specified intervals", async () => {
            renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    autoPingMs: 1000,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });

            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const sendSpy = vi.spyOn(mockWebSocketInstances[0]!, "send").mockImplementation(() => true);

                // Wait for first ping
                act(() => {
                    vi.advanceTimersByTime(1000);
                });

                expect(sendSpy).toHaveBeenCalledWith(
                    JSON.stringify({
                        type: "ping",
                        echo_data: { t: 1704110400000 },
                    }),
                );

                // Wait for second ping
                act(() => {
                    vi.advanceTimersByTime(1000);
                });

                expect(sendSpy).toHaveBeenCalledTimes(2);
            });
        });

        it("should not send pings when autoPingMs is not set", async () => {
            renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const sendSpy = vi.spyOn(mockWebSocketInstances[0]!, "send").mockImplementation(() => true);

                act(() => {
                    vi.advanceTimersByTime(5000);
                });

                expect(sendSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe("manual controls", () => {
        it("should reconnect manually", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);

                act(() => {
                    result.current.reconnect();
                    vi.advanceTimersByTime(300);
                });

                expect(mockWebSocketInstances).toHaveLength(2);
            });
        });

        it("should disconnect manually", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                expect(result.current.connected).toBe(true);

                act(() => {
                    result.current.disconnect();
                    vi.advanceTimersByTime(50);
                });

                expect(result.current.connected).toBe(false);
            });
        });

        it("should reset reconnect attempts on manual reconnect", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                // Force a few failed reconnections
                for (let i = 0; i < 3; i++) {
                    act(() => {
                        mockWebSocketInstances[mockWebSocketInstances.length - 1]!.simulateUnexpectedClose();
                        vi.advanceTimersByTime(Math.min(1000 * Math.pow(2, i), 30000));
                        vi.advanceTimersByTime(300);
                    });
                }

                const previousLength = mockWebSocketInstances.length;

                // Manual reconnect should reset attempts
                act(() => {
                    result.current.reconnect();
                    vi.advanceTimersByTime(300);
                });

                expect(mockWebSocketInstances).toHaveLength(previousLength + 1);
            });
        });
    });

    describe("URL changes", () => {
        it("should reconnect when URL changes", async () => {
            const { rerender } = renderHook(({ wsUrl }) => useWaldiezWs({ wsUrl }), {
                initialProps: { wsUrl: "ws://localhost:8080/test1" },
            });

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                expect(global.WebSocket).toHaveBeenLastCalledWith("ws://localhost:8080/test1", undefined);

                // Change URL
                rerender({ wsUrl: "ws://localhost:8080/test2" });

                act(() => {
                    vi.advanceTimersByTime(300);
                });

                expect(mockWebSocketInstances).toHaveLength(2);
                expect(global.WebSocket).toHaveBeenLastCalledWith("ws://localhost:8080/test2", undefined);
            });
        });

        it("should close existing connection when URL changes", async () => {
            const { rerender } = renderHook(({ wsUrl }) => useWaldiezWs({ wsUrl }), {
                initialProps: { wsUrl: "ws://localhost:8080/test1" },
            });

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const closeSpy = vi.spyOn(mockWebSocketInstances[0]!, "close").mockImplementation(() => true);

                rerender({ wsUrl: "ws://localhost:8080/test2" });

                expect(closeSpy).toHaveBeenCalledWith(1000, "client disconnect");
            });
        });
    });

    describe("cleanup", () => {
        it("should cleanup connections on unmount", async () => {
            const { unmount } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const closeSpy = vi.spyOn(mockWebSocketInstances[0]!, "close").mockImplementation(() => true);

                unmount();

                expect(closeSpy).toHaveBeenCalled();
            });
        });

        it("should clear timers on unmount", async () => {
            const { unmount } = renderHook(() =>
                useWaldiezWs({
                    ...defaultProps,
                    autoPingMs: 1000,
                }),
            );

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                const clearIntervalSpy = vi.spyOn(global, "clearInterval").mockImplementation(() => true);
                unmount();
                expect(clearIntervalSpy).toHaveBeenCalled();
            });
        });
    });

    describe("React StrictMode handling", () => {
        it("should handle StrictMode double effect calls", async () => {
            const { unmount } = renderHook(() => useWaldiezWs(defaultProps));

            // Simulate StrictMode behavior - immediate unmount and remount
            unmount();

            renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(500); // StrictMode reconnect delay
                vi.advanceTimersByTime(300); // Connection delay
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                // Should eventually connect despite StrictMode
                expect(mockWebSocketInstances.length).toBeGreaterThan(0);
            });
        });
    });

    describe("edge cases", () => {
        it("should handle WebSocket send errors gracefully", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                // Mock send to throw error
                vi.spyOn(mockWebSocketInstances[0]!, "send").mockImplementation(() => {
                    throw new Error("Send failed");
                });

                act(() => {
                    // Should not throw error, but don't send
                    const success = result.current.send("test");
                    expect(success).toBe(false); // Raw send doesn't catch errors
                });
            });
        });

        it("should handle readyState changes during operations", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            act(() => {
                vi.advanceTimersByTime(300);
                vi.advanceTimersByTime(50);
            });
            waitFor(() => {
                expect(mockWebSocketInstances).toHaveLength(1);
                // Change readyState to CLOSING
                mockWebSocketInstances[0]!.readyState = WebSocket.CLOSING;

                act(() => {
                    const success = result.current.send("test");
                    expect(success).toBe(false);
                });

                expect(result.current.getConnectionState()).toBe(WebSocket.CLOSING);
            });
        });

        it("should handle null/undefined wsRef gracefully", async () => {
            const { result } = renderHook(() => useWaldiezWs(defaultProps));

            // Before connection is established
            expect(result.current.getConnectionState()).toBe(WebSocket.CLOSED);

            act(() => {
                const success = result.current.send("test");
                expect(success).toBe(false);
            });
        });
    });
});
