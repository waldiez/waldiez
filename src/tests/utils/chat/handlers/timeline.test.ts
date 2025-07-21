/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines-per-function, max-lines */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";

// Mock dependencies
vi.mock("strip-ansi", () => ({
    default: vi.fn((str: string) => str),
}));

vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("WaldiezChatMessageProcessor", () => {
    let mockDate: Date;

    beforeEach(() => {
        mockDate = new Date("2024-01-01T12:00:00.000Z");
        vi.setSystemTime(mockDate);
    });

    describe("timeline data handling", () => {
        it("should handle valid timeline data with all required fields", () => {
            const validTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            agent: "agent1",
                            cost: 0.01,
                            color: "#FF5733",
                            label: "Session 1",
                            prompt_tokens: 100,
                            completion_tokens: 50,
                            tokens: 150,
                            agent_class: "Assistant",
                            is_cached: false,
                            llm_model: "gpt-4",
                            y_position: 0,
                            session_id: "session-1",
                            real_start_time: "2024-01-01T10:00:00.000Z",
                        },
                        {
                            id: "timeline-2",
                            type: "gap",
                            start: 1000,
                            end: 1200,
                            duration: 200,
                            color: "#CCCCCC",
                            label: "Gap",
                            gap_type: "processing",
                            real_duration: 150,
                            compressed: true,
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                        {
                            time: 1000,
                            cumulative_cost: 0.01,
                            session_cost: 0.01,
                            session_id: "session-1",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1200,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 2,
                        total_tokens: 150,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 1,
                            time_saved: 50,
                        },
                    },
                    metadata: {
                        time_range: [0, 1200],
                        cost_range: [0.0, 0.01],
                        colors: {
                            agent1: "#FF5733",
                            gap: "#CCCCCC",
                        },
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(validTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                timeline: {
                    timeline: validTimelineData.content.timeline,
                    cost_timeline: validTimelineData.content.cost_timeline,
                    summary: validTimelineData.content.summary,
                    metadata: validTimelineData.content.metadata,
                    agents: validTimelineData.content.agents,
                },
            });
        });

        it("should return undefined when timeline array is empty", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [], // Empty timeline
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 0,
                        total_time: 0,
                        total_cost: 0.0,
                        total_agents: 0,
                        total_events: 0,
                        total_tokens: 0,
                        avg_cost_per_session: 0.0,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 0],
                        cost_range: [0.0, 0.0],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when cost_timeline array is empty", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [], // Empty cost timeline
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when agents array is empty", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 0,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [], // Empty agents array
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when summary is missing", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    // summary is missing
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when metadata is missing", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    // metadata is missing
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when content is not an object", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: "invalid content", // Should be an object
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined when data is not an object", () => {
            const invalidMessage = "invalid message"; // Should be a JSON object

            const result = WaldiezChatMessageProcessor.process(invalidMessage);

            expect(result).toBeUndefined();
        });

        it("should return undefined when content is missing", () => {
            const invalidTimelineData = {
                type: "timeline",
                // content is missing
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle timeline data with non-array timeline field", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: "not-an-array", // Should be an array
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle timeline data with non-array cost_timeline field", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: "not-an-array", // Should be an array
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle timeline data with non-array agents field", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: "not-an-array", // Should be an array
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle timeline data with null summary", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: null, // Should be an object
                    metadata: {
                        time_range: [0, 1000],
                        cost_range: [0.0, 0.01],
                    },
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle timeline data with null metadata", () => {
            const invalidTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "timeline-1",
                            type: "session",
                            start: 0,
                            end: 1000,
                            duration: 1000,
                            color: "#FF5733",
                            label: "Session 1",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "session-0",
                        },
                    ],
                    summary: {
                        total_sessions: 1,
                        total_time: 1000,
                        total_cost: 0.01,
                        total_agents: 1,
                        total_events: 1,
                        total_tokens: 100,
                        avg_cost_per_session: 0.01,
                        compression_info: {
                            gaps_compressed: 0,
                            time_saved: 0,
                        },
                    },
                    metadata: null, // Should be an object
                    agents: [
                        {
                            name: "agent1",
                            class: "Assistant",
                            color: "#FF5733",
                        },
                    ],
                },
            };

            const message = JSON.stringify(invalidTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle complex timeline data with multiple sessions and gaps", () => {
            const complexTimelineData = {
                type: "timeline",
                content: {
                    timeline: [
                        {
                            id: "session-1",
                            type: "session",
                            start: 0,
                            end: 500,
                            duration: 500,
                            agent: "user_proxy",
                            cost: 0.005,
                            color: "#FF5733",
                            label: "User Proxy Session",
                            prompt_tokens: 50,
                            completion_tokens: 25,
                            tokens: 75,
                            agent_class: "UserProxy",
                            is_cached: false,
                            llm_model: "gpt-3.5-turbo",
                            y_position: 0,
                            session_id: "session-1",
                            real_start_time: "2024-01-01T10:00:00.000Z",
                        },
                        {
                            id: "gap-1",
                            type: "gap",
                            start: 500,
                            end: 600,
                            duration: 100,
                            color: "#CCCCCC",
                            label: "Processing Gap",
                            gap_type: "thinking",
                            real_duration: 80,
                            compressed: true,
                        },
                        {
                            id: "session-2",
                            type: "session",
                            start: 600,
                            end: 1200,
                            duration: 600,
                            agent: "assistant",
                            cost: 0.012,
                            color: "#33C3F0",
                            label: "Assistant Session",
                            prompt_tokens: 120,
                            completion_tokens: 80,
                            tokens: 200,
                            agent_class: "Assistant",
                            is_cached: true,
                            llm_model: "gpt-4",
                            y_position: 1,
                            session_id: "session-2",
                            real_start_time: "2024-01-01T10:00:30.000Z",
                        },
                    ],
                    cost_timeline: [
                        {
                            time: 0,
                            cumulative_cost: 0.0,
                            session_cost: 0.0,
                            session_id: "init",
                        },
                        {
                            time: 500,
                            cumulative_cost: 0.005,
                            session_cost: 0.005,
                            session_id: "session-1",
                        },
                        {
                            time: 1200,
                            cumulative_cost: 0.017,
                            session_cost: 0.012,
                            session_id: "session-2",
                        },
                    ],
                    summary: {
                        total_sessions: 2,
                        total_time: 1200,
                        total_cost: 0.017,
                        total_agents: 2,
                        total_events: 3,
                        total_tokens: 275,
                        avg_cost_per_session: 0.0085,
                        compression_info: {
                            gaps_compressed: 1,
                            time_saved: 20,
                        },
                    },
                    metadata: {
                        time_range: [0, 1200],
                        cost_range: [0.0, 0.017],
                        colors: {
                            user_proxy: "#FF5733",
                            assistant: "#33C3F0",
                            gap: "#CCCCCC",
                        },
                    },
                    agents: [
                        {
                            name: "user_proxy",
                            class: "UserProxy",
                            color: "#FF5733",
                        },
                        {
                            name: "assistant",
                            class: "Assistant",
                            color: "#33C3F0",
                        },
                    ],
                },
            };

            const message = JSON.stringify(complexTimelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.timeline).toBeDefined();
            expect(result?.timeline?.timeline).toHaveLength(3);
            expect(result?.timeline?.cost_timeline).toHaveLength(3);
            expect(result?.timeline?.agents).toHaveLength(2);
            expect(result?.timeline?.summary.total_sessions).toBe(2);
            expect(result?.timeline?.summary.total_cost).toBe(0.017);
            expect(result?.timeline?.metadata.colors).toBeDefined();
        });
    });
});
