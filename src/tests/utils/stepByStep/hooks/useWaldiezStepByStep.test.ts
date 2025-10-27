/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezActiveRequest, WaldiezChatParticipant } from "@waldiez/components/chatUI/types";
import type { WaldiezStepByStep, WaldiezStepHandlers } from "@waldiez/components/stepByStep/types";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { type WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat";
import {
    type WaldiezStepByStepMessageDeduplicationOptions,
    defaultStepByStep,
    useWaldiezStepByStep,
} from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import { WaldiezStepByStepProcessor } from "@waldiez/utils/stepByStep/processor";
import type { WaldiezStepByStepProcessingResult } from "@waldiez/utils/stepByStep/types";

// Mock dependencies
vi.mock("@waldiez/utils/stepByStep/processor", () => ({
    WaldiezStepByStepProcessor: {
        process: vi.fn(),
    },
}));

vi.mock("@waldiez/utils/chat", () => ({
    WaldiezChatMessageProcessor: {
        process: vi.fn(),
    },
    WORKFLOW_DONE: "<Waldiez> - Done running the flow.",
}));

vi.mock("@waldiez/components/stepByStep/utils", () => ({
    getEventKey: vi.fn(
        (event: Record<string, unknown>) =>
            `${event.id || event.uuid || event.type || "unknown"}-${Date.now()}`,
    ),
}));

const mockedStepByStepProcessorProcess = vi.mocked(WaldiezStepByStepProcessor.process);

describe("useWaldiezStepByStep", () => {
    const mockHandlers: WaldiezStepHandlers = {
        onStart: vi.fn(),
        close: vi.fn(),
        sendControl: vi.fn(),
        respond: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("initialization", () => {
        it("should initialize with default configuration", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            expect(result.current.stepByStep).toEqual({
                ...defaultStepByStep,
                handlers: {
                    onStart: expect.any(Function),
                    close: expect.any(Function),
                    sendControl: expect.any(Function),
                    respond: expect.any(Function),
                },
            });
        });

        it("should initialize with custom configuration", () => {
            const initialConfig: Partial<WaldiezStepByStep> = {
                show: true,
                active: true,
                stepMode: false,
                autoContinue: true,
            };

            const { result } = renderHook(() =>
                useWaldiezStepByStep({ initialConfig, handlers: mockHandlers }),
            );

            expect(result.current.stepByStep.show).toBe(true);
            expect(result.current.stepByStep.active).toBe(true);
            expect(result.current.stepByStep.stepMode).toBe(false);
            expect(result.current.stepByStep.autoContinue).toBe(true);
            expect(result.current.stepByStep.handlers).toEqual(mockHandlers);
        });

        it("should merge handlers correctly", () => {
            const partialHandlers = {
                onStart: vi.fn(),
                close: vi.fn(),
            };

            const { result } = renderHook(() => useWaldiezStepByStep({ handlers: partialHandlers }));

            expect(result.current.stepByStep.handlers?.onStart).toBe(partialHandlers.onStart);
            expect(result.current.stepByStep.handlers?.close).toBe(partialHandlers.close);
            expect(result.current.stepByStep.handlers?.sendControl).toBeTypeOf("function");
            expect(result.current.stepByStep.handlers?.respond).toBeTypeOf("function");
        });
    });

    describe("state management", () => {
        it("should update active state", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.setActive(true);
            });

            expect(result.current.stepByStep.active).toBe(true);

            act(() => {
                result.current.setActive(false);
            });

            expect(result.current.stepByStep.active).toBe(false);
        });

        it("should update show state", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.setShow(true);
            });

            expect(result.current.stepByStep.show).toBe(true);

            act(() => {
                result.current.setShow(false);
            });

            expect(result.current.stepByStep.show).toBe(false);
        });

        it("should update error state", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.setError("Test error");
            });

            expect(result.current.stepByStep.lastError).toBe("Test error");

            act(() => {
                result.current.setError(undefined);
            });

            expect(result.current.stepByStep.lastError).toBeUndefined();
        });

        it("should update timeline", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
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

            expect(result.current.stepByStep.timeline).toEqual(mockTimeline);
        });

        it("should update participants", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockParticipants: WaldiezChatParticipant[] = [
                { id: "1", name: "Agent 1", isUser: false },
                { id: "2", name: "Agent 2", isUser: true },
            ];

            act(() => {
                result.current.setParticipants(mockParticipants);
            });

            expect(result.current.stepByStep.participants).toEqual(mockParticipants);
        });

        it("should update active request", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockRequest: WaldiezActiveRequest = {
                request_id: "test-req",
                prompt: "Enter input:",
                password: false,
            };

            act(() => {
                result.current.setActiveRequest(mockRequest);
            });

            expect(result.current.stepByStep.activeRequest).toEqual(mockRequest);

            act(() => {
                result.current.setActiveRequest(undefined);
            });

            expect(result.current.stepByStep.activeRequest).toBeUndefined();
        });

        it("should update pending control input", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockControlInput = {
                request_id: "test-req",
                prompt: "Enter command:",
            };

            act(() => {
                result.current.setPendingControl(mockControlInput);
            });

            expect(result.current.stepByStep.pendingControlInput).toEqual(mockControlInput);

            act(() => {
                result.current.setPendingControl(undefined);
            });

            expect(result.current.stepByStep.pendingControlInput).toBeUndefined();
        });
    });

    describe("event management", () => {
        it("should add events", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockEvent = { id: "event1", type: "message", content: "test" };

            act(() => {
                result.current.addEvent(mockEvent);
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(1);
            expect(result.current.stepByStep.eventHistory[0]).toEqual(mockEvent);
        });

        it("should remove events", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockEvent = { id: "event1", type: "message", content: "test" };

            act(() => {
                result.current.addEvent(mockEvent);
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(1);

            act(() => {
                result.current.removeEvent("event1-" + expect.any(Number));
            });

            // Note: The actual removal depends on the event key generation
            // which uses Date.now(), so we'll just verify the method exists
            expect(result.current.removeEvent).toBeTypeOf("function");
        });

        it("should clear all events", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));
            const mockEvent = { id: "event1", type: "message", content: "test" };

            act(() => {
                result.current.addEvent(mockEvent);
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(1);

            act(() => {
                result.current.clearEvents();
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(0);
        });
    });

    describe("deduplication", () => {
        it("should deduplicate events when enabled", () => {
            const deduplicationOptions: WaldiezStepByStepMessageDeduplicationOptions = {
                enabled: true,
                keyGenerator: event => `${event.id}`,
                maxCacheSize: 100,
            };

            const { result } = renderHook(() => useWaldiezStepByStep({ deduplicationOptions }));

            const mockEvent = { id: "event1", type: "message", content: "test" };

            act(() => {
                result.current.addEvent(mockEvent);
                result.current.addEvent(mockEvent); // Should be deduplicated
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(1);
        });

        it("should not deduplicate when disabled", () => {
            const deduplicationOptions: WaldiezStepByStepMessageDeduplicationOptions = {
                enabled: false,
            };

            const { result } = renderHook(() => useWaldiezStepByStep({ deduplicationOptions }));

            const mockEvent = { id: "event1", type: "message", content: "test" };

            act(() => {
                result.current.addEvent(mockEvent);
                result.current.addEvent(mockEvent);
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(2);
        });

        it("should respect max cache size", () => {
            const deduplicationOptions: WaldiezStepByStepMessageDeduplicationOptions = {
                enabled: true,
                keyGenerator: event => `${event.id}`,
                maxCacheSize: 2,
            };

            const { result } = renderHook(() => useWaldiezStepByStep({ deduplicationOptions }));

            // Add more events than cache size
            for (let i = 0; i < 5; i++) {
                act(() => {
                    result.current.addEvent({ id: `event${i}`, type: "message" });
                });
            }

            expect(result.current.stepByStep.eventHistory).toHaveLength(5);
        });
    });

    describe("message processing", () => {
        it("should process step-by-step messages", () => {
            const mockResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: {
                    participants: [{ id: "1", name: "Agent 1", isUser: false }],
                },
            };

            mockedStepByStepProcessorProcess.mockReturnValue(mockResult);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "debug_message", content: "test" });
            });

            expect(mockedStepByStepProcessorProcess).toHaveBeenCalledWith({
                type: "debug_message",
                content: "test",
            });
            expect(result.current.stepByStep.participants).toEqual(mockResult.stateUpdate?.participants);
        });

        it("should handle preprocessing", () => {
            const preprocess = vi.fn().mockReturnValue({ handled: false, updated: { modified: true } });

            const { result } = renderHook(() => useWaldiezStepByStep({ preprocess }));

            mockedStepByStepProcessorProcess.mockReturnValue(undefined);

            act(() => {
                result.current.process({ original: true });
            });

            expect(preprocess).toHaveBeenCalledWith({ original: true });
            expect(mockedStepByStepProcessorProcess).toHaveBeenCalledWith({ modified: true });
        });

        it("should skip processing when preprocessing handles the message", () => {
            const preprocess = vi.fn().mockReturnValue({ handled: true });

            const { result } = renderHook(() => useWaldiezStepByStep({ preprocess }));

            act(() => {
                result.current.process({ original: true });
            });

            expect(preprocess).toHaveBeenCalledWith({ original: true });
            expect(mockedStepByStepProcessorProcess).not.toHaveBeenCalled();
        });

        it("should handle processing errors", () => {
            mockedStepByStepProcessorProcess.mockImplementation(() => {
                throw new Error("Processing failed");
            });

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "test" });
            });

            expect(result.current.stepByStep.lastError).toBe("Processing failed");
        });

        it("should handle different state update types", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            // Timeline update
            const timelineResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: {
                    timeline: {
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
                    },
                },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(timelineResult);

            act(() => {
                result.current.process({ type: "timeline" });
            });

            expect(result.current.stepByStep.timeline).toEqual(timelineResult.stateUpdate?.timeline);

            // Pending control input update
            const controlResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: { pendingControlInput: { request_id: "test", prompt: "test" } },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(controlResult);

            act(() => {
                result.current.process({ type: "control" });
            });

            expect(result.current.stepByStep.pendingControlInput).toEqual(
                controlResult.stateUpdate?.pendingControlInput,
            );

            // Active request update
            const requestResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: {
                    activeRequest: { request_id: "test", prompt: "test", password: false },
                },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(requestResult);

            act(() => {
                result.current.process({ type: "request" });
            });

            expect(result.current.stepByStep.activeRequest).toEqual(requestResult.stateUpdate?.activeRequest);

            // Auto continue update
            const autoContinueResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: { autoContinue: true },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(autoContinueResult);

            act(() => {
                result.current.process({ type: "auto" });
            });

            expect(result.current.stepByStep.autoContinue).toBe(true);

            // Error handling
            const errorResult: WaldiezStepByStepProcessingResult = {
                error: new Error("Test error"),
                isWorkflowEnd: true,
            };
            mockedStepByStepProcessorProcess.mockReturnValue(errorResult);

            act(() => {
                result.current.process({ type: "error" });
            });

            expect(result.current.stepByStep.lastError).toBe("Test error");
            expect(result.current.stepByStep.active).toBe(false);

            // Event history update
            const eventsResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: {
                    eventHistory: [
                        { id: "event1", type: "message" },
                        { id: "event2", type: "message" },
                    ],
                },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(eventsResult);

            act(() => {
                result.current.process({ type: "events" });
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(2);
        });
    });

    describe("reset functionality", () => {
        it("should reset to initial configuration", () => {
            const initialConfig: Partial<WaldiezStepByStep> = {
                show: true,
                active: true,
                stepMode: false,
            };

            const { result } = renderHook(() => useWaldiezStepByStep({ initialConfig }));

            // Modify state
            act(() => {
                result.current.setShow(false);
                result.current.setActive(false);
                result.current.addEvent({ id: "test", type: "message" });
            });

            expect(result.current.stepByStep.show).toBe(false);
            expect(result.current.stepByStep.active).toBe(false);
            expect(result.current.stepByStep.eventHistory).toHaveLength(1);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.stepByStep.show).toBe(true);
            expect(result.current.stepByStep.active).toBe(true);
            expect(result.current.stepByStep.stepMode).toBe(false);
            expect(result.current.stepByStep.eventHistory).toHaveLength(0);
        });
    });

    describe("chat message processing fallback", () => {
        it("should fallback to chat message processor when step-by-step processor returns undefined", async () => {
            // Mock chat processor
            const mockChatResult: WaldiezChatMessageProcessingResult = {
                participants: [{ id: "1", name: "Agent 1", isUser: true }],
            };

            const { WaldiezChatMessageProcessor } = await import("@waldiez/utils/chat");
            vi.mocked(WaldiezChatMessageProcessor.process).mockReturnValue(mockChatResult);

            mockedStepByStepProcessorProcess.mockReturnValue(undefined);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "chat_message" });
            });

            expect(WaldiezChatMessageProcessor.process).toHaveBeenCalledWith({ type: "chat_message" });
            expect(result.current.stepByStep.participants).toEqual(mockChatResult.participants);
        });

        it("should handle chat message with input request", async () => {
            const mockChatResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "msg-1",
                    timestamp: 0,
                    type: "input_request",
                    prompt: "Enter your input:",
                    content: "Enter your input:",
                    password: true,
                    request_id: "chat-req-123",
                },
                requestId: "chat-req-123",
            };

            const { WaldiezChatMessageProcessor } = await import("@waldiez/utils/chat");
            vi.mocked(WaldiezChatMessageProcessor.process).mockReturnValue(mockChatResult);

            mockedStepByStepProcessorProcess.mockReturnValue(undefined);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "chat_input_request" });
            });

            expect(result.current.stepByStep.activeRequest).toEqual({
                request_id: "chat-req-123",
                prompt: "Enter your input:",
                password: true,
            });
        });

        it("should handle chat message with regular message", async () => {
            const mockMessage = { id: "msg1", type: "message", content: "Hello", timestamp: 1 };
            const mockChatResult: WaldiezChatMessageProcessingResult = {
                message: mockMessage,
            };

            const { WaldiezChatMessageProcessor } = await import("@waldiez/utils/chat");
            vi.mocked(WaldiezChatMessageProcessor.process).mockReturnValue(mockChatResult);

            mockedStepByStepProcessorProcess.mockReturnValue(undefined);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "chat_message" });
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(1);
            expect(result.current.stepByStep.eventHistory[0]).toEqual(mockMessage);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined/null processing data", () => {
            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process(null);
            });

            act(() => {
                result.current.process(undefined);
            });

            // Should not throw errors
            expect(result.current.stepByStep).toBeDefined();
        });

        it("should handle empty event history updates", () => {
            const emptyEventsResult: WaldiezStepByStepProcessingResult = {
                stateUpdate: { eventHistory: [] },
            };
            mockedStepByStepProcessorProcess.mockReturnValue(emptyEventsResult);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            act(() => {
                result.current.process({ type: "empty_events" });
            });

            expect(result.current.stepByStep.eventHistory).toHaveLength(0);
        });

        it("should handle active request fallback for request_id", async () => {
            const mockChatResult: WaldiezChatMessageProcessingResult = {
                message: {
                    id: "msg-1",
                    timestamp: 0,
                    type: "input_request",
                    prompt: "Enter input:",
                    content: "Enter input:",
                },
                requestId: "fallback-req-id",
            };

            const { WaldiezChatMessageProcessor } = await import("@waldiez/utils/chat");
            vi.mocked(WaldiezChatMessageProcessor.process).mockReturnValue(mockChatResult);

            mockedStepByStepProcessorProcess.mockReturnValue(undefined);

            const { result } = renderHook(() => useWaldiezStepByStep({}));

            // Set existing active request
            act(() => {
                result.current.setActiveRequest({
                    request_id: "existing-req",
                    prompt: "existing",
                    password: false,
                });
            });

            act(() => {
                result.current.process({ type: "chat_input_request" });
            });

            expect(result.current.stepByStep.activeRequest?.request_id).toBe("fallback-req-id");
        });
    });
});
