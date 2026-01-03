/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC } from "react";
import { FaCircle, FaCog, FaCommentDots, FaHourglassHalf } from "react-icons/fa";

export type ActivityType = "thinking" | "tool" | "message" | (string & {}) | null | undefined;

export const ActivityIcon: FC<{
    activity: ActivityType;
    title?: string;
    className?: string;
}> = ({ activity, title, className }) => {
    if (!activity) {
        return null;
    }

    if (activity === "thinking") {
        return (
            <span
                className={`agent-activity-icon is-thinking ${className ?? ""}`}
                title={title ?? "Thinking"}
                data-activity="thinking"
            >
                <FaHourglassHalf />
                <span className="typing-dots" aria-label="thinking">
                    <i></i>
                    <i></i>
                    <i></i>
                </span>
            </span>
        );
    }

    if (activity === "tool") {
        return (
            <span
                className={`agent-activity-icon is-tool ${className ?? ""}`}
                title={title ?? "Running tool"}
                data-activity="tool"
            >
                <FaCog className="gear" />
            </span>
        );
    }

    if (activity === "message") {
        return (
            <span
                className={`agent-activity-icon is-message ${className ?? ""}`}
                title={title ?? "Composing"}
                data-activity="message"
            >
                <FaCommentDots className="bubble" />
                <span className="typing-dots" aria-label="typing">
                    <i></i>
                    <i></i>
                    <i></i>
                </span>
            </span>
        );
    }

    // Unknown: fall back to a subtle dot
    return (
        <span
            className={`agent-activity-icon ${className ?? ""}`}
            title={title ?? String(activity)}
            data-activity={String(activity)}
        >
            <FaCircle className="status-dot" />
        </span>
    );
};
