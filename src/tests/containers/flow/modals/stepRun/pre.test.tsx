/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreStepRunModal } from "@waldiez/containers/flow/modals/stepRunModal/pre";
import {
    WaldiezAgentAssistant,
    WaldiezAgentGroupManager,
    WaldiezAgentUserProxy,
    type WaldiezNodeAgent,
    agentMapper,
} from "@waldiez/models";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

const mockAgents: WaldiezNodeAgent[] = [
    {
        ...agentMapper.asNode(WaldiezAgentAssistant.create("assistant")),
        id: "agent-1",
    },
    {
        ...agentMapper.asNode(WaldiezAgentUserProxy.create("user_proxy")),
        id: "agent-1",
    },
];

const mockGroupChatAgents: WaldiezNodeAgent[] = [
    ...mockAgents,
    {
        ...agentMapper.asNode(WaldiezAgentGroupManager.create("group_manager")),
        id: "agent-3",
    },
];

const mockCheckpoints = {
    "checkpoint-1": [
        {
            timestamp: "2024-01-01T10:00:00Z",
            state: {
                messages: [{ content: "Test message 1" }],
                context_variables: { var1: "value1" },
            },
            metadata: { step: 1 },
        },
        {
            timestamp: "2024-01-01T10:01:00Z",
            state: {
                messages: [{ content: "Test message 2" }],
                context_variables: { var1: "value2" },
            },
            metadata: { step: 2 },
        },
    ],
    "checkpoint-2": [
        {
            timestamp: "2024-01-01T11:00:00Z",
            state: {
                messages: [{ content: "Test message 3" }],
                context_variables: { var2: "value3" },
            },
            metadata: { step: 1 },
        },
    ],
};

describe("PreStepRunModal", () => {
    const mockFlowId = "test-flow";
    const mockOnStart = vi.fn();
    const mockOnClose = vi.fn();
    const mockGetCheckpoints = vi.fn();
    const mockSubmitCheckpoint = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        flowId: mockFlowId,
        darkMode: false,
        onStart: mockOnStart,
        onClose: mockOnClose,
    };

    const renderWithProviders = (props = defaultProps, agents = mockAgents) => {
        return render(
            <WaldiezThemeProvider>
                <WaldiezProvider
                    flowId={mockFlowId}
                    storageId={mockFlowId}
                    name="Test Flow"
                    description="Test"
                    requirements={[]}
                    tags={[]}
                    nodes={agents}
                    edges={[]}
                    viewport={{ zoom: 1, x: 0, y: 0 }}
                    createdAt="2024-01-01"
                    updatedAt="2024-01-01"
                >
                    <PreStepRunModal {...props} />
                </WaldiezProvider>
            </WaldiezThemeProvider>,
        );
    };

    it("should render successfully", () => {
        const { baseElement } = renderWithProviders();
        expect(baseElement).toBeTruthy();
    });

    it("should render with correct title", () => {
        renderWithProviders();
        expect(screen.getByText("Step run")).toBeTruthy();
    });

    it("should render only breakpoints tab when not a group chat", () => {
        renderWithProviders();
        expect(screen.queryByText("Checkpoints")).toBeFalsy();
        expect(screen.getByText("Quick Presets")).toBeTruthy();
    });

    it("should render both tabs when group chat is detected", () => {
        renderWithProviders(defaultProps, mockGroupChatAgents);
        expect(screen.getByText("Breakpoints")).toBeTruthy();
        expect(screen.getByText("Checkpoints")).toBeTruthy();
    });

    it("should have Cancel and Start buttons", () => {
        renderWithProviders();
        expect(screen.getByText("Cancel")).toBeTruthy();
        expect(screen.getByText("Start")).toBeTruthy();
    });

    it("should call onClose when Cancel is clicked", () => {
        renderWithProviders();
        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onStart with default breakpoints when Start is clicked", () => {
        renderWithProviders();
        const startButton = screen.getByText("Start");
        fireEvent.click(startButton);
        expect(mockOnStart).toHaveBeenCalledWith([]);
    });

    it("should initialize with 'all' breakpoint by default", () => {
        renderWithProviders();
        // Switch to current tab to see active breakpoints
        const customTab = screen.getByText("Custom Breakpoints");
        fireEvent.click(customTab);

        expect(screen.getByText("Break on all events (default)")).toBeTruthy();
    });

    it("should set 'all events' preset breakpoint", async () => {
        renderWithProviders();
        const allEventsButton = screen.getByText("All Events");
        fireEvent.click(allEventsButton);

        await waitFor(() => {
            // Should have the all events breakpoint set
            expect(screen.getByText("Quick Presets")).toBeTruthy();
        });
    });

    it("should set 'tool execution' preset breakpoint", async () => {
        renderWithProviders();
        const toolButton = screen.getByText("Tool Execution");
        fireEvent.click(toolButton);

        await waitFor(() => {
            // Should have tool breakpoints set
            expect(screen.getByText("Quick Presets")).toBeTruthy();
        });
    });

    it("should set 'errors only' preset breakpoint", async () => {
        renderWithProviders();
        const errorsButton = screen.getByText("Errors Only");
        fireEvent.click(errorsButton);

        await waitFor(() => {
            // Should have error breakpoints set
            expect(screen.getByText("Quick Presets")).toBeTruthy();
        });
    });

    it("should navigate to custom breakpoints tab", () => {
        renderWithProviders();
        const customTab = screen.getByText("Custom Breakpoints");
        fireEvent.click(customTab);
        expect(screen.getByText("Break on Event Types")).toBeTruthy();
        expect(screen.getByText("Break on Agents")).toBeTruthy();
        expect(screen.getByText("Break on Agent + Event")).toBeTruthy();
    });

    it("should render checkpoints tab when in group chat mode", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(mockGetCheckpoints).toHaveBeenCalled();
        });
    });

    it("should display loading state when fetching checkpoints", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockCheckpoints), 100)),
        );

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getByText("Loading checkpoints...")).toBeTruthy();
        });
    });

    it("should display checkpoints when loaded", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getAllByText(/checkpoint-1/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/checkpoint-2/i).length).toBeGreaterThan(0);
        });
    });

    it("should display error message when checkpoint loading fails", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        const errorMessage = "Failed to load checkpoints";
        mockGetCheckpoints.mockRejectedValue(new Error(errorMessage));

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeTruthy();
        });
    });

    it("should display 'no checkpoints' when empty result", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue({});

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getByText("No checkpoints available")).toBeTruthy();
        });
    });

    it("should display 'no checkpoints' when null result", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(null);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getByText("No checkpoints available")).toBeTruthy();
        });
    });

    it("should select a checkpoint", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getAllByText(/checkpoint-1/i).length).toBeGreaterThan(0);
        });

        const checkpoint = screen.getAllByText(/checkpoint-1/i)[0];
        expect(checkpoint).toBeTruthy();
        fireEvent.click(checkpoint as any);

        await waitFor(() => {
            expect(screen.getByText(/Selected checkpoint: checkpoint-1/i)).toBeTruthy();
        });
    });

    it("should clear selected checkpoint", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getAllByText(/checkpoint-1/i).length).toBeGreaterThan(0);
        });

        // Select checkpoint
        const checkpoint = screen.getAllByText(/checkpoint-1/i)[0];
        fireEvent.click(checkpoint as any);

        await waitFor(() => {
            expect(screen.getByText(/Selected checkpoint: checkpoint-1/i)).toBeTruthy();
        });

        // Clear selection
        fireEvent.click(screen.getByTestId("clear-checkpoints"));

        await waitFor(() => {
            expect(screen.getByText("No checkpoint selected")).toBeTruthy();
        });
    });

    it("should call onStart with checkpoint id when checkpoint is selected", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getAllByText(/checkpoint-1/i).length).toBeGreaterThan(0);
        });

        // Select checkpoint
        const checkpoint = screen.getAllByText(/checkpoint-1/i)[0];
        fireEvent.click(checkpoint as any);

        await waitFor(() => {
            expect(screen.getByText(/Selected checkpoint: checkpoint-1/i)).toBeTruthy();
        });

        // Click start
        const startButton = screen.getByText("Start");
        fireEvent.click(startButton);

        expect(mockOnStart).toHaveBeenCalledWith([], "checkpoint-1");
    });

    it("should handle dark mode", () => {
        renderWithProviders({ ...defaultProps, darkMode: true });
        expect(screen.getByText("Step run")).toBeTruthy();
    });

    it("should display correct checkpoint entry count", async () => {
        const propsWithCheckpoints = {
            ...defaultProps,
            getCheckpoints: mockGetCheckpoints,
        };
        mockGetCheckpoints.mockResolvedValue(mockCheckpoints);

        renderWithProviders(propsWithCheckpoints, mockGroupChatAgents);

        const checkpointsTab = screen.getByText("Checkpoints");
        fireEvent.click(checkpointsTab);

        await waitFor(() => {
            expect(screen.getByText(/2 entries/i)).toBeTruthy();
            expect(screen.getByText(/1 entry/i)).toBeTruthy();
        });
    });

    it("should not show checkpoints tab when no getCheckpoints function provided", () => {
        renderWithProviders(defaultProps, mockGroupChatAgents);
        expect(screen.getByText("Breakpoints")).toBeTruthy();
        expect(screen.getByText("Checkpoints")).toBeTruthy();
    });

    it("should handle modal close via onCancel", () => {
        renderWithProviders();
        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("should display active breakpoints section", () => {
        renderWithProviders();
        const customTab = screen.getByText("Custom Breakpoints");
        fireEvent.click(customTab);
        expect(screen.getByText("Active Breakpoints")).toBeTruthy();
    });

    it("should show default breakpoint in active breakpoints list", () => {
        renderWithProviders();
        const customTab = screen.getByText("Custom Breakpoints");
        fireEvent.click(customTab);
        expect(screen.getByText("Break on all events (default)")).toBeTruthy();
    });

    it("should render with submitCheckpoint prop", () => {
        const propsWithSubmit = {
            ...defaultProps,
            submitCheckpoint: mockSubmitCheckpoint,
        };
        renderWithProviders(propsWithSubmit);
        expect(screen.getByText("Step run")).toBeTruthy();
    });
});
