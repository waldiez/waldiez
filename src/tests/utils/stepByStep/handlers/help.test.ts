/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugHelpHandler } from "@waldiez/utils/stepByStep/handlers/help";

describe("DebugHelpHandler", () => {
    let handler: DebugHelpHandler;

    beforeEach(() => {
        handler = new DebugHelpHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_help type", () => {
            expect(handler.canHandle("debug_help")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid debug_help message with command groups", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Basic Commands",
                        commands: [
                            {
                                cmds: ["step", "s"],
                                desc: "Execute next step",
                            },
                            {
                                cmds: ["continue", "c"],
                                desc: "Continue execution",
                            },
                        ],
                    },
                    {
                        title: "Breakpoint Commands",
                        commands: [
                            {
                                cmds: ["list", "l"],
                                desc: "List breakpoints",
                            },
                        ],
                    },
                ],
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });

        it("should handle debug_help with single command group", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Available Commands",
                        commands: [
                            {
                                cmds: ["step"],
                                desc: "Execute next step",
                            },
                            {
                                cmds: ["continue", "cont"],
                                desc: "Continue execution",
                            },
                            {
                                desc: "Set breakpoint on event", // No cmds property
                            },
                        ],
                    },
                ],
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });

        it("should handle empty help array", () => {
            const data = {
                type: "debug_help",
                help: [],
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: [],
            });
        });

        it("should handle help with commands without aliases", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Simple Commands",
                        commands: [
                            {
                                desc: "Execute next step",
                            },
                            {
                                desc: "Continue execution",
                            },
                        ],
                    },
                ],
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });

        it("should return error for null help", () => {
            const data = {
                type: "debug_help",
                help: null,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_help structure",
                originalData: data,
            });
        });

        it("should return error for missing help property", () => {
            const data = {
                type: "debug_help",
                // Missing help property
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_help structure",
                originalData: data,
            });
        });

        it("should return error for string help instead of array", () => {
            const data = {
                type: "debug_help",
                help: "This should be an array",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_help structure",
                originalData: data,
            });
        });

        it("should return error for object help instead of array", () => {
            const data = {
                type: "debug_help",
                help: {
                    commands: ["step", "continue"],
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_help structure",
                originalData: data,
            });
        });

        it("should return error for invalid debug_help structure", () => {
            const data = {
                type: "debug_print",
                help: [
                    {
                        title: "Commands",
                        commands: [],
                    },
                ],
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_help structure",
                originalData: data,
            });
        });

        it("should ignore context parameter", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Commands",
                        commands: [
                            {
                                cmds: ["step"],
                                desc: "Execute step",
                            },
                        ],
                    },
                ],
            };

            const context = {
                requestId: "req-123",
                flowId: "flow-456",
                currentState: {
                    help: [],
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });

        it("should handle help with additional metadata", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Debug Commands",
                        commands: [
                            {
                                cmds: ["step", "s"],
                                desc: "Execute next step",
                            },
                            {
                                cmds: ["continue", "c"],
                                desc: "Continue execution",
                            },
                        ],
                    },
                ],
                timestamp: "2024-01-01T10:00:00Z",
                source: "debug_engine",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });

        it("should handle complex nested help structure", () => {
            const data = {
                type: "debug_help",
                help: [
                    {
                        title: "Basic Commands",
                        commands: [
                            {
                                cmds: ["step", "s"],
                                desc: "Execute the next event",
                            },
                            {
                                cmds: ["continue", "c", "cont"],
                                desc: "Continue until next breakpoint or end",
                            },
                        ],
                    },
                    {
                        title: "Breakpoint Commands",
                        commands: [
                            {
                                cmds: ["break", "b"],
                                desc: "Set breakpoint on event type",
                            },
                            {
                                cmds: ["unbreak", "ub"],
                                desc: "Remove breakpoint",
                            },
                            {
                                cmds: ["list", "l"],
                                desc: "List all breakpoints",
                            },
                        ],
                    },
                    {
                        title: "Information Commands",
                        commands: [
                            {
                                cmds: ["help", "h"],
                                desc: "Show this help message",
                            },
                            {
                                cmds: ["stats"],
                                desc: "Show execution statistics",
                            },
                        ],
                    },
                ],
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                help: data.help,
            });
        });
    });
});
