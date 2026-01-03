/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ActivityType } from "@waldiez/containers/nodes/agent/ActivityIcon";
import { ActivityIcon } from "@waldiez/containers/nodes/agent/ActivityIcon";

// Mock react-icons
vi.mock("react-icons/fa", () => ({
    FaCircle: ({ className }: { className?: string }) => (
        <span data-testid="fa-circle" className={className}>
            Circle Icon
        </span>
    ),
    FaCog: ({ className }: { className?: string }) => (
        <span data-testid="fa-cog" className={className}>
            Cog Icon
        </span>
    ),
    FaCommentDots: ({ className }: { className?: string }) => (
        <span data-testid="fa-comment-dots" className={className}>
            Comment Icon
        </span>
    ),
    FaHourglassHalf: () => <span data-testid="fa-hourglass-half">Hourglass Icon</span>,
}));

describe("ActivityIcon", () => {
    describe("null/undefined activity", () => {
        it("should return null when activity is null", () => {
            const { container } = render(<ActivityIcon activity={null} />);
            expect(container.firstChild).toBeNull();
        });

        it("should return null when activity is undefined", () => {
            const { container } = render(<ActivityIcon activity={undefined} />);
            expect(container.firstChild).toBeNull();
        });

        it("should return null when activity is empty string", () => {
            const { container } = render(<ActivityIcon activity="" />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe("thinking activity", () => {
        it("should render thinking icon with default title", () => {
            render(<ActivityIcon activity="thinking" />);

            const icon = screen.getByTitle("Thinking");
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass("agent-activity-icon", "is-thinking");
            expect(icon).toHaveAttribute("data-activity", "thinking");

            // Check for hourglass icon
            expect(screen.getByTestId("fa-hourglass-half")).toBeInTheDocument();

            // Check for typing dots
            const typingDots = screen.getByLabelText("thinking");
            expect(typingDots).toHaveClass("typing-dots");
            expect(typingDots.querySelectorAll("i")).toHaveLength(3);
        });

        it("should render thinking icon with custom title", () => {
            render(<ActivityIcon activity="thinking" title="Processing..." />);

            const icon = screen.getByTitle("Processing...");
            expect(icon).toBeInTheDocument();
        });

        it("should apply custom className", () => {
            render(<ActivityIcon activity="thinking" className="custom-class" />);

            const icon = screen.getByTitle("Thinking");
            expect(icon).toHaveClass("agent-activity-icon", "is-thinking", "custom-class");
        });
    });

    describe("tool activity", () => {
        it("should render tool icon with default title", () => {
            render(<ActivityIcon activity="tool" />);

            const icon = screen.getByTitle("Running tool");
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass("agent-activity-icon", "is-tool");
            expect(icon).toHaveAttribute("data-activity", "tool");

            // Check for cog icon with gear class
            const cogIcon = screen.getByTestId("fa-cog");
            expect(cogIcon).toBeInTheDocument();
            expect(cogIcon).toHaveClass("gear");
        });

        it("should render tool icon with custom properties", () => {
            render(<ActivityIcon activity="tool" title="Executing function" className="tool-custom" />);

            const icon = screen.getByTitle("Executing function");
            expect(icon).toHaveClass("agent-activity-icon", "is-tool", "tool-custom");
        });
    });

    describe("message activity", () => {
        it("should render message icon with default title", () => {
            render(<ActivityIcon activity="message" />);

            const icon = screen.getByTitle("Composing");
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass("agent-activity-icon", "is-message");
            expect(icon).toHaveAttribute("data-activity", "message");

            // Check for comment dots icon
            const commentIcon = screen.getByTestId("fa-comment-dots");
            expect(commentIcon).toBeInTheDocument();
            expect(commentIcon).toHaveClass("bubble");

            // Check for typing dots
            const typingDots = screen.getByLabelText("typing");
            expect(typingDots).toHaveClass("typing-dots");
            expect(typingDots.querySelectorAll("i")).toHaveLength(3);
        });

        it("should render message icon with custom properties", () => {
            render(<ActivityIcon activity="message" title="Writing response" className="msg-class" />);

            const icon = screen.getByTitle("Writing response");
            expect(icon).toHaveClass("agent-activity-icon", "is-message", "msg-class");
        });
    });

    describe("unknown/custom activity", () => {
        it("should render fallback icon for unknown activity", () => {
            render(<ActivityIcon activity="custom-activity" />);

            const icon = screen.getByTitle("custom-activity");
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass("agent-activity-icon");
            expect(icon).toHaveAttribute("data-activity", "custom-activity");

            // Check for circle icon with status-dot class
            const circleIcon = screen.getByTestId("fa-circle");
            expect(circleIcon).toBeInTheDocument();
            expect(circleIcon).toHaveClass("status-dot");
        });

        it("should handle custom activity with all properties", () => {
            render(<ActivityIcon activity="special-state" title="Special State" className="special-class" />);

            const icon = screen.getByTitle("Special State");
            expect(icon).toHaveClass("agent-activity-icon", "special-class");
            expect(icon).toHaveAttribute("data-activity", "special-state");
        });

        it("should handle activity types with special characters", () => {
            const specialActivity = "activity-with-特殊-chars!@#" as ActivityType;
            render(<ActivityIcon activity={specialActivity} />);

            const icon = screen.getByTitle(specialActivity as any);
            expect(icon).toHaveAttribute("data-activity", specialActivity);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined className gracefully", () => {
            render(<ActivityIcon activity="thinking" className={undefined} />);

            const icon = screen.getByTitle("Thinking");
            expect(icon).toHaveClass("agent-activity-icon", "is-thinking");
            expect(icon.className).not.toContain("undefined");
        });

        it("should handle empty className", () => {
            render(<ActivityIcon activity="tool" className="" />);

            const icon = screen.getByTitle("Running tool");
            expect(icon).toHaveClass("agent-activity-icon", "is-tool");
        });

        it("should handle multiple classNames", () => {
            render(<ActivityIcon activity="message" className="class1 class2 class3" />);

            const icon = screen.getByTitle("Composing");
            expect(icon).toHaveClass("agent-activity-icon", "is-message", "class1", "class2", "class3");
        });

        it("should handle very long custom activity names", () => {
            const longActivity = "a".repeat(100) as ActivityType;
            render(<ActivityIcon activity={longActivity} />);

            const icon = screen.getByTitle(longActivity as any);
            expect(icon).toHaveAttribute("data-activity", longActivity);
        });
    });

    describe("typescript type safety", () => {
        it("should accept valid activity types", () => {
            const validActivities: ActivityType[] = [
                "thinking",
                "tool",
                "message",
                "custom-type",
                null,
                undefined,
            ];

            validActivities.forEach(activity => {
                const { container } = render(<ActivityIcon activity={activity} />);
                if (activity) {
                    expect(container.firstChild).toBeTruthy();
                } else {
                    expect(container.firstChild).toBeNull();
                }
            });
        });
    });

    describe("accessibility", () => {
        it("should have proper aria labels for thinking activity", () => {
            render(<ActivityIcon activity="thinking" />);

            const typingDots = screen.getByLabelText("thinking");
            expect(typingDots).toBeInTheDocument();
        });

        it("should have proper aria labels for message activity", () => {
            render(<ActivityIcon activity="message" />);

            const typingDots = screen.getByLabelText("typing");
            expect(typingDots).toBeInTheDocument();
        });

        it("should use title attribute for screen readers", () => {
            render(<ActivityIcon activity="tool" title="Custom tool description" />);

            const icon = screen.getByTitle("Custom tool description");
            expect(icon).toBeInTheDocument();
        });
    });

    describe("CSS class composition", () => {
        it("should maintain proper class order", () => {
            render(<ActivityIcon activity="thinking" className="extra" />);

            const icon = screen.getByTitle("Thinking");
            // The order should be: base class, modifier class, custom class
            expect(icon.className).toBe("agent-activity-icon is-thinking extra");
        });

        it("should handle falsy className values", () => {
            const classNames = [null, undefined, 0, ""];

            classNames.forEach(className => {
                const { container } = render(<ActivityIcon activity="tool" className={className as any} />);

                const icon = container.querySelector(".agent-activity-icon");
                expect(icon?.className).toMatch("agent-activity-icon is-tool");
            });
        });
    });
});
