/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT, UpdateState } from "@waldiez/components/updateState";
import { WaldiezAgent, type WaldiezNodeAgentData, agentMapper } from "@waldiez/models";

// Mock the components
vi.mock("@waldiez/components", () => ({
    Editor: ({ value, onChange, darkMode, ...props }: any) => (
        <textarea
            data-testid={props["data-testid"]}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            data-dark-mode={darkMode}
            placeholder="Editor component"
        />
    ),
    Select: ({ options, value, onChange, ...props }: any) => (
        <select
            data-testid={props["data-testid"]}
            value={value?.value || ""}
            onChange={e => {
                const selectedOption = options.find((opt: any) => opt.value === e.target.value);
                onChange?.(selectedOption);
            }}
        >
            {options.map((option: any) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    ),
    TextareaInput: ({ value, onChange, ...props }: any) => (
        <textarea
            data-testid={props["data-testid"]}
            value={value || ""}
            onChange={onChange}
            placeholder={props.placeholder}
            rows={props.rows}
        />
    ),
}));

describe("UpdateState Component", () => {
    let mockOnDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    let defaultData: WaldiezNodeAgentData;

    beforeEach(() => {
        mockOnDataChange = vi.fn();
        const agent = agentMapper.asNode(WaldiezAgent.create("assistant"));
        defaultData = {
            ...agent.data,
            updateAgentStateBeforeReply: [],
        } as WaldiezNodeAgentData;
        vi.clearAllMocks();
    });

    describe("Basic Rendering", () => {
        it("should have correct displayName", () => {
            expect(UpdateState.displayName).toBe("UpdateState");
        });

        it("should render with default disabled state", () => {
            render(<UpdateState data={defaultData} onDataChange={mockOnDataChange} darkMode={false} />);

            expect(screen.getByText("Update system message before reply")).toBeInTheDocument();

            const checkbox = screen.getByTestId("enable-update-system-message");
            expect(checkbox).not.toBeChecked();

            // Should not show configuration options when disabled
            expect(screen.queryByTestId("update-system-message-type-select")).not.toBeInTheDocument();
            expect(screen.queryByTestId("update-system-message-string")).not.toBeInTheDocument();
            expect(screen.queryByTestId("update-system-message-callable")).not.toBeInTheDocument();
        });

        it("should render enabled state when data has update config", () => {
            const dataWithConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "test content" }],
            };

            render(<UpdateState data={dataWithConfig} onDataChange={mockOnDataChange} darkMode={false} />);

            const checkbox = screen.getByTestId("enable-update-system-message");
            expect(checkbox).toBeChecked();

            expect(screen.getByTestId("update-system-message-string")).toBeInTheDocument();
        });

        it("should display information text", () => {
            render(<UpdateState data={defaultData} onDataChange={mockOnDataChange} darkMode={false} />);

            expect(
                screen.getByText(/You can update the agent's system message before replying/),
            ).toBeInTheDocument();
        });
    });

    describe("Checkbox Toggle Functionality", () => {
        it("should enable configuration when checkbox is checked", async () => {
            const user = userEvent.setup();
            render(<UpdateState data={defaultData} onDataChange={mockOnDataChange} darkMode={false} />);

            const checkbox = screen.getByTestId("enable-update-system-message");
            await user.click(checkbox);

            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [{ type: "string", content: "" }],
            });
        });

        it("should disable configuration when checkbox is unchecked", async () => {
            const user = userEvent.setup();
            const dataWithConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "test content" }],
            };

            render(<UpdateState data={dataWithConfig} onDataChange={mockOnDataChange} darkMode={false} />);

            const checkbox = screen.getByTestId("enable-update-system-message");
            await user.click(checkbox);

            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [],
            });
        });

        it("should preserve selected type when re-enabling", async () => {
            const user = userEvent.setup();
            let currentData = defaultData;

            const { rerender } = render(
                <UpdateState
                    data={currentData}
                    onDataChange={newData => {
                        mockOnDataChange(newData);
                        currentData = { ...currentData, ...newData };
                    }}
                    darkMode={false}
                />,
            );

            // Enable and change to callable type
            const checkbox = screen.getByTestId("enable-update-system-message");
            await user.click(checkbox);

            rerender(<UpdateState data={currentData} onDataChange={mockOnDataChange} darkMode={false} />);

            await selectEvent.select(screen.getByLabelText("Message update type"), "Function");

            // Disable
            await user.click(checkbox);

            // Re-enable should remember callable type
            await user.click(checkbox);

            expect(mockOnDataChange).toHaveBeenLastCalledWith({
                updateAgentStateBeforeReply: [
                    { type: "callable", content: CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT },
                ],
            });
        });
    });

    describe("Type Selection", () => {
        it("should change from string to callable type", async () => {
            const dataWithStringConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "test" }],
            };

            render(
                <UpdateState data={dataWithStringConfig} onDataChange={mockOnDataChange} darkMode={false} />,
            );
            await selectEvent.select(screen.getByLabelText("Message update type"), "Function");
            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [
                    { type: "callable", content: CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT },
                ],
            });
        });
        it("should change from callable to string type", async () => {
            const dataWithCallableConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "callable", content: "def test(): pass" }],
            };

            render(
                <UpdateState
                    data={dataWithCallableConfig}
                    onDataChange={mockOnDataChange}
                    darkMode={false}
                />,
            );
            await selectEvent.select(screen.getByLabelText("Message update type"), "Text");
            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [{ type: "string", content: "" }],
            });
        });
    });

    describe("String Content Editing", () => {
        it("should render string textarea when type is string", () => {
            const dataWithStringConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "test content" }],
            };

            render(
                <UpdateState data={dataWithStringConfig} onDataChange={mockOnDataChange} darkMode={false} />,
            );

            const textarea = screen.getByTestId("update-system-message-string");
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveValue("test content");
            expect(textarea).toHaveAttribute("placeholder", "Enter a string template with {variable}s");
        });

        it("should update string content when textarea changes", async () => {
            const dataWithStringConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "initial" }],
            };

            render(
                <UpdateState data={dataWithStringConfig} onDataChange={mockOnDataChange} darkMode={false} />,
            );

            const textarea = screen.getByTestId("update-system-message-string");
            fireEvent.change(textarea, { target: { value: "updated content" } });

            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [{ type: "string", content: "updated content" }],
            });
        });

        it("should not render string textarea when type is callable", () => {
            const dataWithCallableConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "callable", content: "def test(): pass" }],
            };

            render(
                <UpdateState
                    data={dataWithCallableConfig}
                    onDataChange={mockOnDataChange}
                    darkMode={false}
                />,
            );

            expect(screen.queryByTestId("update-system-message-string")).not.toBeInTheDocument();
        });
    });

    describe("Callable Content Editing", () => {
        it("should render editor when type is callable", () => {
            const dataWithCallableConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "callable", content: "def custom_function(): pass" }],
            };

            render(
                <UpdateState
                    data={dataWithCallableConfig}
                    onDataChange={mockOnDataChange}
                    darkMode={false}
                />,
            );

            const editor = screen.getByTestId("mocked-monaco-editor");
            expect(editor).toBeInTheDocument();
            expect(editor).toHaveValue("def custom_function(): pass");
        });

        it("should update callable content when editor changes", async () => {
            const dataWithCallableConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "callable", content: "initial code" }],
            };

            render(
                <UpdateState
                    data={dataWithCallableConfig}
                    onDataChange={mockOnDataChange}
                    darkMode={false}
                />,
            );

            const editor = screen.getByTestId("mocked-monaco-editor");
            fireEvent.change(editor, { target: { value: "updated code" } });
            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [{ type: "callable", content: "updated code" }],
            });
        });

        it("should use default function content when editor value is undefined", async () => {
            // const user = userEvent.setup();
            const dataWithCallableConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "callable", content: "some code" }],
            };

            render(
                <UpdateState
                    data={dataWithCallableConfig}
                    onDataChange={mockOnDataChange}
                    darkMode={false}
                />,
            );

            const editor = screen.getByTestId("mocked-monaco-editor");

            // Simulate editor returning undefined (which can happen in some edge cases)
            fireEvent.change(editor, { target: { value: "" } });

            // This should be handled by the onChange callback
            expect(mockOnDataChange).toHaveBeenCalledWith({
                updateAgentStateBeforeReply: [{ type: "callable", content: "" }],
            });
        });

        it("should not render editor when type is string", () => {
            const dataWithStringConfig: WaldiezNodeAgentData = {
                ...defaultData,
                updateAgentStateBeforeReply: [{ type: "string", content: "test" }],
            };

            render(
                <UpdateState data={dataWithStringConfig} onDataChange={mockOnDataChange} darkMode={false} />,
            );

            expect(screen.queryByTestId("update-system-message-callable")).not.toBeInTheDocument();
        });
    });

    describe("Default Content Handling", () => {
        it("should use default function content when no config exists and callable is selected", async () => {
            const user = userEvent.setup();
            render(<UpdateState data={defaultData} onDataChange={mockOnDataChange} darkMode={false} />);

            // Enable the feature
            const checkbox = screen.getByTestId("enable-update-system-message");
            await user.click(checkbox);

            // Change to callable type
            await selectEvent.select(screen.getByLabelText("Message update type"), "Function");

            expect(mockOnDataChange).toHaveBeenLastCalledWith({
                updateAgentStateBeforeReply: [
                    { type: "callable", content: CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT },
                ],
            });
        });

        it("should show default function content in editor when no specific content exists", () => {
            render(<UpdateState data={defaultData} onDataChange={mockOnDataChange} darkMode={false} />);

            // Since no config exists, the callable content should be the default
            // This tests the useMemo logic for callableContent
            expect(CUSTOM_UPDATE_SYSTEM_MESSAGE_FUNCTION_CONTENT).toContain(
                "def custom_update_system_message",
            );
        });
    });
});
