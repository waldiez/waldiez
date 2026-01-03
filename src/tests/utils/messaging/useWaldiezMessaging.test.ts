/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezChatConfig, WaldiezChatHandlers } from "@waldiez/components/chatUI/types";
import type { WaldiezStepByStep, WaldiezStepHandlers } from "@waldiez/components/stepByStep/types";
import {
    type WaldiezChatMessageDeduplicationOptions,
    useWaldiezChat,
} from "@waldiez/utils/chat/hooks/useWaldiezChat";
import { useWaldiezMessaging } from "@waldiez/utils/messaging/useWaldiezMessaging";
import { isPromise } from "@waldiez/utils/promises";
import {
    type WaldiezStepByStepMessageDeduplicationOptions,
    useWaldiezStepByStep,
} from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";

// Mock dependencies
vi.mock("@waldiez/utils/chat/hooks/useWaldiezChat", () => ({
    useWaldiezChat: vi.fn(),
}));

vi.mock("@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep", () => ({
    useWaldiezStepByStep: vi.fn(),
}));

vi.mock("@waldiez/utils/promises", () => ({
    isPromise: vi.fn(),
}));

const mockedUseWaldiezChat = vi.mocked(useWaldiezChat);
const mockedUseWaldiezStepByStep = vi.mocked(useWaldiezStepByStep);
const mockedIsPromise = vi.mocked(isPromise);

describe("useWaldiezMessaging", () => {
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

    const mockHandlers = {
        onSave: vi.fn(),
        onConvert: vi.fn(),
        onRun: vi.fn(),
        onStepRun: vi.fn(),
        preprocess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseWaldiezChat.mockReturnValue(mockChatHook);
        mockedUseWaldiezStepByStep.mockReturnValue(mockStepByStepHook);
        mockedIsPromise.mockReturnValue(false);
    });

    describe("initialization", () => {
        it("should initialize with basic configuration", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith({});
            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith({});
            expect(result.current.chat).toBe(mockChatHook.chat);
            expect(result.current.stepByStep).toBe(mockStepByStepHook.stepByStep);
            expect(result.current.getRunningMode()).toBeUndefined();
        });

        it("should initialize with chat configuration", () => {
            const chatConfig = {
                initialConfig: { show: true, active: true } as Partial<WaldiezChatConfig>,
                handlers: { onSend: vi.fn() } as WaldiezChatHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: { enabled: true } as WaldiezChatMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    chat: chatConfig,
                }),
            );

            expect(mockedUseWaldiezChat).toHaveBeenCalledWith(chatConfig);
        });

        it("should initialize with step-by-step configuration", () => {
            const stepByStepConfig = {
                initialConfig: { show: true, active: true } as Partial<WaldiezStepByStep>,
                handlers: { sendControl: vi.fn(), respond: vi.fn() } as WaldiezStepHandlers,
                preprocess: vi.fn(),
                onPreview: vi.fn(),
                deduplicationOptions: { enabled: true } as WaldiezStepByStepMessageDeduplicationOptions,
            };

            renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    stepByStep: stepByStepConfig,
                }),
            );

            expect(mockedUseWaldiezStepByStep).toHaveBeenCalledWith(stepByStepConfig);
        });
    });

    describe("save functionality", () => {
        it("should save with synchronous handler", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onSave: mockHandlers.onSave,
                }),
            );

            mockedIsPromise.mockReturnValue(false);

            await act(async () => {
                await result.current.save("content");
            });

            expect(mockHandlers.onSave).toHaveBeenCalledWith("content", undefined, undefined);
        });

        it("should save with asynchronous handler", async () => {
            const asyncHandler = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onSave: asyncHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await act(async () => {
                await result.current.save("content");
            });

            expect(asyncHandler).toHaveBeenCalledWith("content", undefined, undefined);
        });

        it("should handle save without handler", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            await act(async () => {
                await result.current.save("content");
            });

            expect(mockHandlers.onSave).not.toHaveBeenCalled();
        });
    });

    describe("convert functionality", () => {
        it("should convert with synchronous handler", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onConvert: mockHandlers.onConvert,
                }),
            );

            mockedIsPromise.mockReturnValue(false);

            await act(async () => {
                await result.current.convert("content", "py");
            });

            expect(mockHandlers.onConvert).toHaveBeenCalledWith("content", "py", undefined);
        });

        it("should convert with asynchronous handler", async () => {
            const asyncHandler = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onConvert: asyncHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await act(async () => {
                await result.current.convert("content", "ipynb");
            });

            expect(asyncHandler).toHaveBeenCalledWith("content", "ipynb", undefined);
        });
    });

    describe("run functionality", () => {
        it("should run with synchronous handler", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onRun: mockHandlers.onRun,
                }),
            );

            mockedIsPromise.mockReturnValue(false);

            await act(async () => {
                await result.current.run("content");
            });

            expect(mockHandlers.onRun).toHaveBeenCalledWith("content", undefined);
            expect(result.current.getRunningMode()).toBe("chat");
            expect(mockChatHook.setShow).toHaveBeenCalledWith(true);
        });

        it("should run with asynchronous handler", async () => {
            const asyncHandler = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onRun: asyncHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await act(async () => {
                await result.current.run("content");
            });

            expect(asyncHandler).toHaveBeenCalledWith("content", undefined);
            expect(result.current.getRunningMode()).toBe("chat");
            expect(mockChatHook.setShow).toHaveBeenCalledWith(true);
        });
    });

    describe("stepRun functionality", () => {
        it("should stepRun with synchronous handler", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onStepRun: mockHandlers.onStepRun,
                }),
            );

            mockedIsPromise.mockReturnValue(false);
            const breakpoints = ["message"];

            await act(async () => {
                await result.current.stepRun("content", breakpoints, "/path");
            });

            expect(mockHandlers.onStepRun).toHaveBeenCalledWith("content", breakpoints, "/path");
            expect(result.current.getRunningMode()).toBe("step");
            expect(mockStepByStepHook.setShow).toHaveBeenCalledWith(true);
        });

        it("should stepRun with asynchronous handler", async () => {
            const asyncHandler = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onStepRun: asyncHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await act(async () => {
                await result.current.stepRun("content");
            });

            expect(asyncHandler).toHaveBeenCalledWith("content", undefined, undefined);
            expect(result.current.getRunningMode()).toBe("step");
            expect(mockStepByStepHook.setShow).toHaveBeenCalledWith(true);
        });
    });

    describe("running mode management", () => {
        it("should get and set running mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            expect(result.current.getRunningMode()).toBeUndefined();

            act(() => {
                result.current.setRunningMode("chat");
            });

            expect(result.current.getRunningMode()).toBe("chat");

            act(() => {
                result.current.setRunningMode("step");
            });

            expect(result.current.getRunningMode()).toBe("step");

            act(() => {
                result.current.setRunningMode(undefined);
            });

            expect(result.current.getRunningMode()).toBeUndefined();
        });
    });

    describe("reset functionality", () => {
        it("should reset chat mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("chat");
            });

            act(() => {
                result.current.reset();
            });

            expect(mockChatHook.reset).toHaveBeenCalled();
            expect(mockStepByStepHook.reset).not.toHaveBeenCalled();
            expect(result.current.getRunningMode()).toBeUndefined();
        });

        it("should reset step mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("step");
            });

            act(() => {
                result.current.reset();
            });

            expect(mockStepByStepHook.reset).toHaveBeenCalled();
            expect(mockChatHook.reset).not.toHaveBeenCalled();
            expect(result.current.getRunningMode()).toBeUndefined();
        });

        it("should handle reset with no running mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.reset();
            });

            expect(mockChatHook.reset).not.toHaveBeenCalled();
            expect(mockStepByStepHook.reset).not.toHaveBeenCalled();
            expect(result.current.getRunningMode()).toBeUndefined();
        });
    });

    describe("process functionality", () => {
        it("should process data in chat mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("chat");
            });

            const testData = { type: "message", content: "test" };

            act(() => {
                result.current.process(testData);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(testData);
            expect(mockStepByStepHook.process).not.toHaveBeenCalled();
        });

        it("should process data in step mode", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("step");
            });

            const testData = { type: "debug_message", content: "test" };

            act(() => {
                result.current.process(testData);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(testData);
            expect(mockChatHook.process).not.toHaveBeenCalled();
        });

        it("should process JSON string data", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("chat");
            });

            const testData = { type: "message", content: "test" };
            const jsonString = JSON.stringify(testData);

            act(() => {
                result.current.process(jsonString);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(testData);
        });

        it("should handle invalid JSON string data", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            act(() => {
                result.current.setRunningMode("chat");
            });

            const invalidJson = "invalid json {";

            act(() => {
                result.current.process(invalidJson);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(invalidJson);
        });

        it("should handle process with no running mode and preprocess", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    preprocess: mockHandlers.preprocess,
                }),
            );

            const testData = { type: "unknown", content: "test" };

            act(() => {
                result.current.process(testData);
            });

            expect(mockHandlers.preprocess).toHaveBeenCalledWith(testData);
            expect(mockChatHook.process).not.toHaveBeenCalled();
            expect(mockStepByStepHook.process).not.toHaveBeenCalled();
        });

        it("should handle process with no running mode and no preprocess", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            const testData = { type: "unknown", content: "test" };

            act(() => {
                result.current.process(testData);
            });

            expect(mockChatHook.process).not.toHaveBeenCalled();
            expect(mockStepByStepHook.process).not.toHaveBeenCalled();
        });
    });

    describe("actions delegation", () => {
        it("should expose chat actions", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            expect(result.current.actions.chat.process).toBe(mockChatHook.process);
            expect(result.current.actions.chat.reset).toBe(mockChatHook.reset);
            expect(result.current.actions.chat.setActive).toBe(mockChatHook.setActive);
            expect(result.current.actions.chat.setShow).toBe(mockChatHook.setShow);
            expect(result.current.actions.chat.setActiveRequest).toBe(mockChatHook.setActiveRequest);
            expect(result.current.actions.chat.setError).toBe(mockChatHook.setError);
            expect(result.current.actions.chat.setTimeline).toBe(mockChatHook.setTimeline);
            expect(result.current.actions.chat.setParticipants).toBe(mockChatHook.setParticipants);
            expect(result.current.actions.chat.addMessage).toBe(mockChatHook.addMessage);
            expect(result.current.actions.chat.removeMessage).toBe(mockChatHook.removeMessage);
            expect(result.current.actions.chat.clearMessages).toBe(mockChatHook.clearMessages);
        });

        it("should expose step-by-step actions", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            expect(result.current.actions.step.process).toBe(mockStepByStepHook.process);
            expect(result.current.actions.step.reset).toBe(mockStepByStepHook.reset);
            expect(result.current.actions.step.setActive).toBe(mockStepByStepHook.setActive);
            expect(result.current.actions.step.setShow).toBe(mockStepByStepHook.setShow);
            expect(result.current.actions.step.setActiveRequest).toBe(mockStepByStepHook.setActiveRequest);
            expect(result.current.actions.step.setError).toBe(mockStepByStepHook.setError);
            expect(result.current.actions.step.setTimeline).toBe(mockStepByStepHook.setTimeline);
            expect(result.current.actions.step.setParticipants).toBe(mockStepByStepHook.setParticipants);
            expect(result.current.actions.step.setBreakpoints).toBe(mockStepByStepHook.setBreakpoints);
            expect(result.current.actions.step.addEvent).toBe(mockStepByStepHook.addEvent);
            expect(result.current.actions.step.removeEvent).toBe(mockStepByStepHook.removeEvent);
            expect(result.current.actions.step.clearEvents).toBe(mockStepByStepHook.clearEvents);
            expect(result.current.actions.step.setPendingControl).toBe(mockStepByStepHook.setPendingControl);
        });

        it("should expose dispatchers", () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                }),
            );

            expect(result.current.dispatch.chat).toBe(mockChatHook.dispatch);
            expect(result.current.dispatch.step).toBe(mockStepByStepHook.dispatch);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete workflow - run, process, reset", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onRun: mockHandlers.onRun,
                }),
            );

            await act(async () => {
                await result.current.run("content");
            });

            expect(result.current.getRunningMode()).toBe("chat");
            expect(mockChatHook.setShow).toHaveBeenCalledWith(true);

            const message = { type: "text", content: "Hello" };
            act(() => {
                result.current.process(message);
            });

            expect(mockChatHook.process).toHaveBeenCalledWith(message);

            act(() => {
                result.current.reset();
            });

            expect(mockChatHook.reset).toHaveBeenCalled();
            expect(result.current.getRunningMode()).toBeUndefined();
        });

        it("should handle mode switching", async () => {
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onRun: mockHandlers.onRun,
                    onStepRun: mockHandlers.onStepRun,
                }),
            );

            await act(async () => {
                await result.current.run("content");
            });

            expect(result.current.getRunningMode()).toBe("chat");

            await act(async () => {
                await result.current.stepRun("content");
            });

            expect(result.current.getRunningMode()).toBe("step");

            const message = { type: "debug", content: "test" };
            act(() => {
                result.current.process(message);
            });

            expect(mockStepByStepHook.process).toHaveBeenCalledWith(message);
            expect(mockChatHook.process).not.toHaveBeenCalledWith(message);
        });
    });

    describe("error handling", () => {
        it("should handle save handler throwing error", async () => {
            const errorHandler = vi.fn().mockRejectedValue(new Error("Save failed"));
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onSave: errorHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await expect(
                act(async () => {
                    await result.current.save("content");
                }),
            ).rejects.toThrow("Save failed");
        });

        it("should handle run handler throwing error", async () => {
            const errorHandler = vi.fn().mockRejectedValue(new Error("Run failed"));
            const { result } = renderHook(() =>
                useWaldiezMessaging({
                    flowId: "test-flow",
                    onRun: errorHandler,
                }),
            );

            mockedIsPromise.mockReturnValue(true);

            await expect(
                act(async () => {
                    await result.current.run("content");
                }),
            ).rejects.toThrow("Run failed");

            expect(result.current.getRunningMode()).toBe("chat");
        });
    });
});
