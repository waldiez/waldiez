/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Timeline, TimelineModal } from "@waldiez/components/timeline";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

// Mock the theme hook
vi.mock("@waldiez/theme", async importOriginal => {
    const actual = await importOriginal<typeof import("@waldiez/theme")>();
    return {
        ...actual,
        useWaldiezTheme: () => ({ isDark: false }),
    };
});

// Mock recharts ResponsiveContainer
// noinspection JSUnusedGlobalSymbols
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

const mockTimelineData: WaldiezTimelineData = {
    timeline: [
        {
            id: "session-1",
            type: "session",
            start: 0,
            end: 5,
            duration: 5,
            agent: "test_agent_1",
            cost: 0.001234,
            color: "#3B82F6",
            label: "Test Agent 1 Session",
            prompt_tokens: 100,
            completion_tokens: 50,
            tokens: 150,
            agent_class: "assistant",
            is_cached: false,
            llm_model: "gpt-4",
            y_position: 0,
            session_id: "session-1",
            real_start_time: "2024-01-01T10:00:00Z",
        },
        {
            id: "gap-1",
            type: "gap",
            start: 5,
            end: 10,
            duration: 2,
            color: "#D1D5DB",
            label: "Human Input Gap",
            gap_type: "human_input_waiting",
            real_duration: 15,
            compressed: true,
        },
        {
            id: "session-2",
            type: "session",
            start: 7,
            end: 12,
            duration: 5,
            agent: "test_agent_2",
            cost: 0.002345,
            color: "#EF4444",
            label: "Test Agent 2 Session",
            prompt_tokens: 120,
            completion_tokens: 80,
            tokens: 200,
            agent_class: "user_proxy",
            is_cached: true,
            llm_model: "gpt-3.5-turbo",
            y_position: 1,
            session_id: "session-2",
            real_start_time: "2024-01-01T10:00:15Z",
        },
    ],
    cost_timeline: [
        {
            time: 5,
            cumulative_cost: 0.001234,
            session_cost: 0.001234,
            session_id: "session-1",
        },
        {
            time: 12,
            cumulative_cost: 0.003579,
            session_cost: 0.002345,
            session_id: "session-2",
        },
    ],
    summary: {
        total_sessions: 2,
        total_time: 15.5,
        total_cost: 0.0045,
        total_agents: 3,
        total_events: 4,
        total_tokens: 350,
        avg_cost_per_session: 0.00225,
        compression_info: {
            gaps_compressed: 1,
            time_saved: 13,
        },
    },
    metadata: {
        time_range: [0, 15.5],
        cost_range: [0, 0.0045],
        colors: {
            test_agent_1: "#3B82F6",
            test_agent_2: "#EF4444",
        },
    },
    agents: [
        {
            name: "test_agent_1",
            class: "assistant",
            color: "#3B82F6",
        },
        {
            name: "test_agent_2",
            class: "user_proxy",
            color: "#EF4444",
        },
    ],
};

const emptyTimelineData: WaldiezTimelineData = {
    timeline: [],
    cost_timeline: [],
    summary: {
        total_sessions: 0,
        total_time: 0,
        total_cost: 0,
        total_agents: 0,
        total_events: 0,
        total_tokens: 0,
        avg_cost_per_session: 0,
        compression_info: {
            gaps_compressed: 0,
            time_saved: 0,
        },
    },
    metadata: {
        time_range: [0, 0],
        cost_range: [0, 0],
    },
    agents: [],
};

describe("Timeline", () => {
    it("should render successfully", () => {
        const { baseElement } = render(<Timeline data={mockTimelineData} />);
        expect(baseElement).toBeTruthy();
    });

    it("should display summary statistics", () => {
        render(<Timeline data={mockTimelineData} />);

        // Check all the summary cards with more specific queries
        expect(screen.getByText("Sessions")).toBeInTheDocument();
        expect(screen.getByText("Sessions").closest(".card")).toHaveTextContent("2");

        expect(screen.getByText("Total Cost")).toBeInTheDocument();
        expect(screen.getByText("Total Cost").closest(".card")).toHaveTextContent("$0.004500");

        expect(screen.getByText("Duration")).toBeInTheDocument();
        expect(screen.getByText("Duration").closest(".card")).toHaveTextContent("15.5s");

        expect(screen.getByText("Agents")).toBeInTheDocument();
        expect(screen.getByText("Agents").closest(".card")).toHaveTextContent("3");

        expect(screen.getByText("Tokens")).toBeInTheDocument();
        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("350");

        expect(screen.getByText("Avg Cost")).toBeInTheDocument();
        expect(screen.getByText("Avg Cost").closest(".card")).toHaveTextContent("$0.002250");
    });

    it("should display chart title and description", () => {
        render(<Timeline data={mockTimelineData} />);

        expect(screen.getByText("Session Activity Timeline with Cumulative Cost")).toBeInTheDocument();
        expect(
            screen.getByText(/Interactive timeline showing agent sessions and cost accumulation/),
        ).toBeInTheDocument();
    });

    it("should display compression info when gaps are compressed", () => {
        render(<Timeline data={mockTimelineData} />);

        expect(screen.getByText("1 gaps compressed,13.0s saved")).toBeInTheDocument();
    });

    it("should not display compression info when no gaps are compressed", () => {
        const dataWithoutCompression = {
            ...mockTimelineData,
            summary: {
                ...mockTimelineData.summary,
                compression_info: {
                    gaps_compressed: 0,
                    time_saved: 0,
                },
            },
        };

        render(<Timeline data={dataWithoutCompression} />);

        expect(screen.queryByText(/gaps compressed/)).not.toBeInTheDocument();
    });

    it("should display agent legend", () => {
        render(<Timeline data={mockTimelineData} />);

        expect(screen.getByText("test agent 1")).toBeInTheDocument();
        expect(screen.getByText("(assistant)")).toBeInTheDocument();

        expect(screen.getByText("test agent 2")).toBeInTheDocument();
        expect(screen.getByText("(user_proxy)")).toBeInTheDocument();
    });

    it("should not display agent legend when no agents", () => {
        render(<Timeline data={emptyTimelineData} />);

        expect(screen.queryByText("test agent 1")).not.toBeInTheDocument();
        expect(screen.queryByText("test agent 2")).not.toBeInTheDocument();
    });

    it("should handle custom width and height", () => {
        render(<Timeline data={mockTimelineData} width="100%" height={600} />);

        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should handle empty timeline data", () => {
        render(<Timeline data={emptyTimelineData} />);

        // Use more specific selectors to avoid multiple matches
        expect(screen.getByText("Sessions").closest(".card")).toHaveTextContent("0");
        expect(screen.getByText("Total Cost").closest(".card")).toHaveTextContent("$0.000000");
        expect(screen.getByText("Duration").closest(".card")).toHaveTextContent("0.0s");
        expect(screen.getByText("Agents").closest(".card")).toHaveTextContent("0");
        expect(screen.getByText("Avg Cost").closest(".card")).toHaveTextContent("$0.000000");
    });

    it("should format large token numbers with locale string", () => {
        const dataWithLargeTokens = {
            ...mockTimelineData,
            summary: {
                ...mockTimelineData.summary,
                total_tokens: 1234567,
            },
        };

        render(<Timeline data={dataWithLargeTokens} />);

        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("1,234,567");
    });

    it("should render responsive container", () => {
        render(<Timeline data={mockTimelineData} />);

        const responsiveContainer = screen.getByTestId("responsive-container");
        expect(responsiveContainer).toBeInTheDocument();
    });

    it("should display correct cost formatting", () => {
        render(<Timeline data={mockTimelineData} />);

        // Total cost should be formatted to 6 decimal places
        expect(screen.getByText("Total Cost").closest(".card")).toHaveTextContent("$0.004500");

        // Average cost should be formatted to 6 decimal places
        expect(screen.getByText("Avg Cost").closest(".card")).toHaveTextContent("$0.002250");
    });

    it("should replace underscores with spaces in agent names", () => {
        const dataWithUnderscores = {
            ...mockTimelineData,
            agents: [
                {
                    name: "test_agent_with_underscores",
                    class: "assistant",
                    color: "#3B82F6",
                },
            ],
        };

        render(<Timeline data={dataWithUnderscores} />);

        expect(screen.getByText("test agent with underscores")).toBeInTheDocument();
    });

    it("should render all summary icons", () => {
        const { container } = render(<Timeline data={mockTimelineData} />);

        // Check that icon containers are present (icons are SVGs)
        const iconContainers = container.querySelectorAll(".timeline-icon");
        expect(iconContainers).toHaveLength(6); // 6 summary cards
    });
});

describe("TimelineModal", () => {
    it("should render successfully", () => {
        const { baseElement } = render(
            <TimelineModal flowId="test-flow" isOpen={true} onClose={vi.fn()} data={mockTimelineData} />,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should render timeline component inside modal", () => {
        render(<TimelineModal flowId="test-flow" isOpen={true} onClose={vi.fn()} data={mockTimelineData} />);

        // Timeline content should be present
        expect(screen.getByText("Sessions")).toBeInTheDocument();
        expect(screen.getByText("Session Activity Timeline with Cumulative Cost")).toBeInTheDocument();
    });

    it("should display close button", () => {
        render(<TimelineModal flowId="test-flow" isOpen={true} onClose={vi.fn()} data={mockTimelineData} />);

        const closeButton = screen.getByTestId("modal-close");
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute("title", "Close");
    });

    it("should call onClose when close button is clicked", () => {
        const onClose = vi.fn();
        render(<TimelineModal flowId="test-flow" isOpen={true} onClose={onClose} data={mockTimelineData} />);

        const closeButton = screen.getByTestId("modal-close");
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it("should handle empty timeline data in modal", () => {
        render(<TimelineModal flowId="test-flow" isOpen={true} onClose={vi.fn()} data={emptyTimelineData} />);

        // Should render without errors and show empty state
        expect(screen.getByText("Sessions").closest(".card")).toHaveTextContent("0");
        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("0");
    });

    it("should not render when isOpen is false", () => {
        render(<TimelineModal flowId="test-flow" isOpen={false} onClose={vi.fn()} data={mockTimelineData} />);

        // Timeline content should not be visible when modal is closed
        expect(screen.queryByText("Sessions")).not.toBeInTheDocument();
    });
});

describe("Timeline Data Validation", () => {
    it("should handle missing optional fields gracefully", () => {
        const minimalData: WaldiezTimelineData = {
            timeline: [
                {
                    id: "session-1",
                    type: "session",
                    start: 0,
                    end: 5,
                    duration: 5,
                    color: "#3B82F6",
                    label: "Minimal Session",
                },
            ],
            cost_timeline: [],
            summary: {
                total_sessions: 1,
                total_time: 5,
                total_cost: 0,
                total_agents: 1,
                total_events: 1,
                total_tokens: 0,
                avg_cost_per_session: 0,
                compression_info: {
                    gaps_compressed: 0,
                    time_saved: 0,
                },
            },
            metadata: {
                time_range: [0, 5],
                cost_range: [0, 0],
            },
            agents: [],
        };

        const { baseElement } = render(<Timeline data={minimalData} />);
        expect(baseElement).toBeTruthy();

        expect(screen.getByText("Sessions").closest(".card")).toHaveTextContent("1");
        expect(screen.getByText("Duration").closest(".card")).toHaveTextContent("5.0s");
        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("0");
    });

    it("should handle undefined tokens gracefully", () => {
        const dataWithUndefinedTokens = {
            ...mockTimelineData,
            summary: {
                ...mockTimelineData.summary,
                total_tokens: undefined as any,
            },
        };

        render(<Timeline data={dataWithUndefinedTokens} />);

        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("TokensN/A");
    });

    it("should handle zero values in summary", () => {
        const dataWithZeroValues = {
            ...mockTimelineData,
            summary: {
                total_sessions: 0,
                total_time: 0,
                total_cost: 0,
                total_agents: 0,
                total_events: 0,
                total_tokens: 0,
                avg_cost_per_session: 0,
                compression_info: {
                    gaps_compressed: 0,
                    time_saved: 0,
                },
            },
        };

        render(<Timeline data={dataWithZeroValues} />);

        expect(screen.getByText("Total Cost").closest(".card")).toHaveTextContent("$0.000000");
        expect(screen.getByText("Duration").closest(".card")).toHaveTextContent("0.0s");
        expect(screen.getByText("Tokens").closest(".card")).toHaveTextContent("Tokens0");
    });
});
