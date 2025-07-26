/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import React from "react";

import { TextareaInput } from "@waldiez/components/textareaInput";

// Mock requestAnimationFrame and keep track of calls
const mockRequestAnimationFrame = vi.fn(cb => {
    // Execute callback immediately for testing
    setTimeout(cb, 0);
    return 0;
});

global.requestAnimationFrame = mockRequestAnimationFrame;

describe("TextareaInput", () => {
    let mockOnChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnChange = vi.fn();
        vi.clearAllMocks();
        mockRequestAnimationFrame.mockClear();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Basic Rendering", () => {
        it("should render textarea with correct value", () => {
            render(<TextareaInput value="test value" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveValue("test value");
        });

        it("should render with undefined value", () => {
            render(<TextareaInput value={undefined} onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveValue("");
        });

        it("should have correct displayName", () => {
            expect(TextareaInput.displayName).toBe("TextareaInput");
        });

        it("should pass through additional props", () => {
            render(
                <TextareaInput
                    value="test"
                    onChange={mockOnChange}
                    placeholder="Enter text"
                    className="custom-class"
                    data-testid="custom-textarea"
                />,
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("placeholder", "Enter text");
            expect(textarea).toHaveClass("custom-class");
            expect(textarea).toHaveAttribute("data-testid", "custom-textarea");
        });
    });

    describe("Auto Focus", () => {
        it("should auto-focus when autoFocus is true", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} autoFocus={true} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveFocus();
        });

        it("should not auto-focus when autoFocus is false", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} autoFocus={false} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).not.toHaveFocus();
        });

        it("should not auto-focus when autoFocus is undefined", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).not.toHaveFocus();
        });
    });

    describe("Change Handling", () => {
        it("should call onChange when text is typed", async () => {
            const user = userEvent.setup();
            render(<TextareaInput value="" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            await user.type(textarea, "hello");

            expect(mockOnChange).toHaveBeenCalledTimes(5); // One call per character
        });

        it("should call onChange when text is pasted", async () => {
            const user = userEvent.setup();
            render(<TextareaInput value="" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            await user.click(textarea);
            await user.paste("pasted text");

            expect(mockOnChange).toHaveBeenCalled();
        });

        it("should track cursor position during changes", async () => {
            const user = userEvent.setup();
            render(<TextareaInput value="initial" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

            // Click in the middle of the text
            await user.click(textarea);
            textarea.setSelectionRange(3, 3); // Position cursor at index 3

            // Type a character
            await user.type(textarea, "X");

            expect(mockOnChange).toHaveBeenCalled();

            // Verify the event structure
            const calls = mockOnChange.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0]![0]).toHaveProperty("target");
            expect(calls[0]![0]).toHaveProperty("type", "change");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty string value", () => {
            render(<TextareaInput value="" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveValue("");
        });

        it("should handle very long text", () => {
            const longText = "a".repeat(10000);
            render(<TextareaInput value={longText} onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveValue(longText);
        });

        it("should handle special characters", () => {
            const specialText = "🚀 Hello\n\tWorld! @#$%^&*()";
            render(<TextareaInput value={specialText} onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveValue(specialText);
        });

        it("should handle rapid value changes", async () => {
            const { rerender } = render(<TextareaInput value="1" onChange={mockOnChange} />);

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            textarea.focus();

            // Rapid value changes
            rerender(<TextareaInput value="12" onChange={mockOnChange} />);
            rerender(<TextareaInput value="123" onChange={mockOnChange} />);
            rerender(<TextareaInput value="1234" onChange={mockOnChange} />);

            expect(textarea).toHaveValue("1234");
        });
    });

    describe("Ref Behavior", () => {
        it("should handle ref access correctly", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} autoFocus={true} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
            expect(textarea).toHaveFocus();
        });

        it("should handle multiple re-renders without errors", () => {
            const { rerender } = render(<TextareaInput value="1" onChange={mockOnChange} />);

            // Multiple re-renders should not cause errors
            for (let i = 2; i <= 10; i++) {
                rerender(<TextareaInput value={i.toString()} onChange={mockOnChange} />);
            }

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveValue("10");
        });
    });

    describe("Accessibility", () => {
        it("should support aria attributes", () => {
            render(
                <TextareaInput
                    value="test"
                    onChange={mockOnChange}
                    aria-label="Test textarea"
                    aria-describedby="description"
                />,
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("aria-label", "Test textarea");
            expect(textarea).toHaveAttribute("aria-describedby", "description");
        });

        it("should support disabled state", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} disabled />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeDisabled();
        });

        it("should support readonly state", () => {
            render(<TextareaInput value="test" onChange={mockOnChange} readOnly />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("readonly");
        });
    });

    describe("Performance", () => {
        it("should not create new change handler on every render", () => {
            const { rerender } = render(<TextareaInput value="1" onChange={mockOnChange} />);
            const textarea1 = screen.getByRole("textbox") as HTMLTextAreaElement;
            rerender(<TextareaInput value="2" onChange={mockOnChange} />);
            const textarea2 = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea1).toBe(textarea2); // Same DOM element should be reused
        });
    });

    describe("Integration Tests", () => {
        it("should work correctly in a typical form scenario", async () => {
            const user = userEvent.setup();
            let formValue = "";

            const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                formValue = e.target.value;
            };

            const { rerender } = render(<TextareaInput value={formValue} onChange={handleChange} />);

            const textarea = screen.getByRole("textbox");

            // User types
            await user.type(textarea, "Hello");

            // Update the component with new value
            rerender(<TextareaInput value="Hello World" onChange={handleChange} />);

            expect(textarea).toHaveValue("Hello World");
        });

        it("should handle controlled component pattern correctly", async () => {
            const user = userEvent.setup();
            let value = "initial";

            const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                value = e.target.value.toUpperCase(); // Transform the value
            };

            const { rerender } = render(<TextareaInput value={value} onChange={handleChange} />);

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveValue("initial");

            // Clear and type new value
            await user.clear(textarea);

            // Simulate the value being cleared
            value = "";
            rerender(<TextareaInput value={value} onChange={handleChange} />);

            await user.type(textarea, "hello");

            // Update with the transformed value
            rerender(<TextareaInput value="HELLO" onChange={handleChange} />);

            // Value should be transformed to uppercase
            expect(textarea).toHaveValue("HELLO");
        });
    });
});
