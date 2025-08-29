/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezTimelineData } from "@waldiez/types";
import type { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

export class TimelineDataHandler implements MessageHandler {
    canHandle(type: string): boolean {
        return type === "timeline";
    }

    /**
     * Validates if the provided data is a valid timeline message.
     * @param data - The data to validate.
     * @returns True if the data is a valid timeline message, false otherwise.
     */
    static isTimelineMessage(data: any): boolean {
        return Boolean(
            (data && data.type === "timeline") ||
                /* c8 ignore next 9 */
                (data &&
                    data.type === "print" &&
                    "data" in data &&
                    data.data &&
                    typeof data.data === "object" &&
                    "type" in data.data &&
                    data.data.type === "timeline" &&
                    "content" in data.data &&
                    data.data.content &&
                    typeof data.data.content === "object"),
        );
    }

    // eslint-disable-next-line complexity
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        /* c8 ignore next 3 */
        if (!data || typeof data !== "object") {
            return undefined;
        }
        if (data.type === "print" && data.data && data.data.type === "timeline") {
            return this.handle(data.data);
        }
        if (!data.content || typeof data.content !== "object") {
            return undefined;
        }
        const timeline = Array.isArray(data.content.timeline) ? data.content.timeline : [];
        const cost_timeline = Array.isArray(data.content.cost_timeline) ? data.content.cost_timeline : [];
        const summary =
            typeof data.content.summary === "object" && data.content.summary !== null
                ? data.content.summary
                : undefined;
        const metadata =
            typeof data.content.metadata === "object" && data.content.metadata !== null
                ? data.content.metadata
                : undefined;
        const agents = Array.isArray(data.content.agents) ? data.content.agents : [];

        if (
            !summary ||
            !metadata ||
            !Array.isArray(timeline) ||
            timeline.length === 0 ||
            !Array.isArray(cost_timeline) ||
            cost_timeline.length === 0 ||
            !Array.isArray(agents) ||
            agents.length === 0
        ) {
            return undefined;
        }

        const timelineData: WaldiezTimelineData = {
            timeline,
            cost_timeline,
            summary,
            metadata,
            agents,
        };

        return { timeline: timelineData };
    }
}
