/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezTimelineData } from "@waldiez/types";
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

export class TimelineDataHandler implements MessageHandler {
    canHandle(type: string): boolean {
        return type === "timeline";
    }

    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || !data.content || typeof data.content !== "object") {
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
