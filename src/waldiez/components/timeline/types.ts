/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type WaldiezTimelineItem = {
    id: string;
    type: "session" | "gap";
    start: number;
    end: number;
    duration: number;
    agent?: string;
    cost?: number;
    color: string;
    label: string;
    gap_type?: string;
    real_duration?: number;
    compressed?: boolean;
    prompt_tokens?: number;
    completion_tokens?: number;
    tokens?: number;
    agent_class?: string;
    is_cached?: boolean;
    llm_model?: string;
    y_position?: number;
    session_id?: string;
    real_start_time?: string;
};

export type WaldiezTimelineCostPoint = {
    time: number;
    cumulative_cost: number;
    session_cost: number;
    session_id: number | string;
};

export type WaldiezTimelineAgentInfo = {
    name: string;
    class: string;
    color: string;
};

export type WaldiezTimelineData = {
    timeline: WaldiezTimelineItem[];
    cost_timeline: WaldiezTimelineCostPoint[];
    summary: {
        total_sessions: number;
        total_time: number;
        total_cost: number;
        total_agents: number;
        total_events: number;
        total_tokens: number;
        avg_cost_per_session: number;
        compression_info: {
            gaps_compressed: number;
            time_saved: number;
        };
    };
    metadata: {
        time_range: [number, number];
        cost_range: [number, number];
        colors?: Record<string, string>;
    };
    agents: WaldiezTimelineAgentInfo[];
};
