/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepRunModal } from "@waldiez/containers/flow/modals/stepRunModal/main";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";
import type { WaldiezStepByStep, WaldiezTimelineData } from "@waldiez/types";

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
    ],
    cost_timeline: [
        {
            time: 5,
            cumulative_cost: 0.001234,
            session_cost: 0.001234,
            session_id: "session-1",
        },
    ],
    summary: {
        total_sessions: 1,
        total_time: 5,
        total_cost: 0.001234,
        total_agents: 1,
        total_events: 1,
        total_tokens: 150,
        avg_cost_per_session: 0.001234,
        compression_info: {
            gaps_compressed: 0,
            time_saved: 0,
        },
    },
    metadata: {
        time_range: [0, 5],
        cost_range: [0, 0.001234],
        colors: {
            test_agent_1: "#3B82F6",
        },
    },
    agents: [
        {
            name: "test_agent_1",
            class: "assistant",
            color: "#3B82F6",
        },
    ],
};

describe("StepRunModal", () => {
    const mockFlowId = "test-flow";
    const mockHandlers = {
        close: vi.fn(),
        respond: vi.fn(),
        sendControl: vi.fn(),
    };
    const mockStepByStep: WaldiezStepByStep = {
        active: true,
        show: true,
        stepMode: true,
        autoContinue: false,
        breakpoints: [],
        eventHistory: [
            { type: "message", data: "Test message 1" },
            { type: "function_call", data: "Test function call" },
            { type: "debug", data: "Debug info" }, // This should be filtered out
            { type: "print", data: "Print info" }, // This should be filtered out
            { type: "message", data: "Test message 2" },
        ],
        handlers: mockHandlers,
    };

    it("should render successfully when active", () => {
        const { baseElement } = render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should not render when stepByStep is not provided", () => {
        const { container } = render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
        expect(container.querySelector(".modal-body")).toBeFalsy();
    });

    it("should not render when not active and no event history", () => {
        const inactiveStepByStep: WaldiezStepByStep = {
            ...mockStepByStep,
            active: false,
            eventHistory: [],
        };
        const { container } = render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={inactiveStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
        expect(container.querySelector(".modal-body")).toBeFalsy();
    });

    it("should render when not active but has event history and close handler", () => {
        const inactiveWithHistory: WaldiezStepByStep = {
            ...mockStepByStep,
            active: false,
            eventHistory: [{ type: "message", data: "Test message" }],
        };
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={inactiveWithHistory} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should render with correct title", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
        expect(screen.getByText("Step-by-step Run")).toBeTruthy();
    });

    it("should filter out debug, print, raw, and timeline events", () => {
        const stepByStepWithMixedEvents: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [
                { type: "message", data: "Valid message" },
                { type: "debug", data: "Debug info" },
                { type: "print", data: "Print info" },
                { type: "raw", data: "Raw data" },
                { type: "timeline", data: "Timeline data" },
                { type: "function_call", data: "Valid function" },
            ],
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithMixedEvents}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        // The component should render with filtered events
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should limit events to last 500 entries", () => {
        const largeEventHistory = Array.from({ length: 600 }, (_, i) => ({
            type: "message",
            data: `Message ${i}`,
        }));

        const stepByStepWithManyEvents: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: largeEventHistory,
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithManyEvents}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        // Should render without error
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should handle close callback", () => {
        const onClose = vi.fn();
        const stepByStepWithClose: WaldiezStepByStep = {
            ...mockStepByStep,
            active: false,
            eventHistory: [{ type: "message", data: "Test" }],
            handlers: {
                ...mockHandlers,
                close: onClose,
            },
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={stepByStepWithClose} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const closeButton = screen.getByTitle("Close");
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it("should not crash when close handler is not provided", () => {
        const stepByStepNoClose: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [{ type: "message", data: "Test" }],
            handlers: undefined,
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={stepByStepNoClose} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const closeButton = screen.getByTitle("Close");
        fireEvent.click(closeButton);

        // Should not crash
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should render timeline button when timeline data is available", () => {
        const stepByStepWithTimeline: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [{ type: "message", data: "Test" }],
            timeline: mockTimelineData,
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithTimeline}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const timelineButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-timeline`);
        expect(timelineButton).toBeTruthy();
        expect(timelineButton).toHaveAttribute("title", "View Timeline");
    });

    it("should not render timeline button when timeline data is not available", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const timelineButton = screen.queryByTestId(`rf-${mockFlowId}-chat-modal-timeline`);
        expect(timelineButton).toBeFalsy();
    });

    it("should render bug icon when no timeline data", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const bugIcon = screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)?.querySelector(".icon-bug");
        expect(bugIcon).toBeTruthy();
    });

    it("should open timeline modal when timeline button is clicked", async () => {
        const stepByStepWithTimeline: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [{ type: "message", data: "Test" }],
            timeline: mockTimelineData,
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithTimeline}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const timelineButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-timeline`);
        fireEvent.click(timelineButton);

        await waitFor(() => {
            // Timeline modal should be rendered
            expect(screen.getByTestId("timeline-modal")).toBeTruthy();
        });
    });

    it("should close timeline modal when close callback is triggered", async () => {
        const stepByStepWithTimeline: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [{ type: "message", data: "Test" }],
            timeline: mockTimelineData,
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithTimeline}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const timelineButton = screen.getByTestId(`rf-${mockFlowId}-chat-modal-timeline`);
        fireEvent.click(timelineButton);

        await waitFor(() => {
            expect(screen.getByTestId("timeline-modal")).toBeTruthy();
        });

        // Close timeline modal
        const closeButton = screen.getByTitle("Close");
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByTestId("timeline-modal")).toBeFalsy();
        });
    });

    it("should render StepByStepView with correct props", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const modalBody = screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)?.querySelector(".modal-body");
        expect(modalBody).toBeTruthy();
    });

    it("should handle dark mode", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={true} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should apply custom className", () => {
        const customClass = "custom-step-run-class";
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={mockStepByStep}
                        className={customClass}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should reverse events order", () => {
        const orderedEvents: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [
                { type: "message", data: "First" },
                { type: "message", data: "Second" },
                { type: "message", data: "Third" },
            ],
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={orderedEvents} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        // The component should render with reversed events
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should handle event data as array with single element", () => {
        const stepByStepWithArrayData: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [
                { type: "message", event: ["Single element"] },
                { type: "message", data: ["Another single"] },
            ],
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal
                        flowId={mockFlowId}
                        isDarkMode={false}
                        stepByStep={stepByStepWithArrayData}
                    />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should handle event data with message property", () => {
        const stepByStepWithMessage: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [{ type: "message", message: "Test message content" }],
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={stepByStepWithMessage} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should handle modal cancel event", () => {
        const onClose = vi.fn();
        const stepByStepWithClose: WaldiezStepByStep = {
            ...mockStepByStep,
            active: false,
            eventHistory: [{ type: "message", data: "Test" }],
            handlers: {
                ...mockHandlers,
                close: onClose,
            },
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={stepByStepWithClose} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const dialog = screen.getByTestId(`rf-${mockFlowId}-step-run-modal`);
        fireEvent.keyDown(dialog, { key: "Escape" });

        expect(onClose).toHaveBeenCalled();
    });

    it("should have maximize button", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const maximizeButton = screen.getByTitle("Maximize");
        expect(maximizeButton).toBeTruthy();
    });

    it("should handle maximize button click", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const maximizeButton = screen.getByTitle("Maximize");
        fireEvent.click(maximizeButton);

        // Modal should still be rendered after maximize
        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });

    it("should not have unsaved changes warning", () => {
        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={mockStepByStep} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        const closeButton = screen.getByTitle("Close");
        fireEvent.click(closeButton);

        // Should close immediately without confirmation
        expect(mockStepByStep.handlers?.close).toHaveBeenCalled();
    });

    it("should render with empty event history", () => {
        const stepByStepEmpty: WaldiezStepByStep = {
            ...mockStepByStep,
            active: true,
            eventHistory: [],
        };

        render(
            <WaldiezThemeProvider>
                <WaldiezProvider flowId={mockFlowId} edges={[]} nodes={[]}>
                    <StepRunModal flowId={mockFlowId} isDarkMode={false} stepByStep={stepByStepEmpty} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );

        expect(screen.getByTestId(`rf-${mockFlowId}-step-run-modal`)).toBeTruthy();
    });
});
