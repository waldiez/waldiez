/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type FC } from "react";

import { AgentEventInfo } from "@waldiez/components/stepByStep/agentInfo";
import { getContentString } from "@waldiez/components/stepByStep/utils";

export const EventAgentsList: FC<{
    agents: any[];
    darkMode: boolean;
}> = ({ agents, darkMode }) => {
    // eslint-disable-next-line max-statements
    const getAgentStats = (agentName: string) => {
        if (!Array.isArray(agents) || agents.length === 0) {
            return { count: 0, lastActivity: "No activity" };
        }
        const globalMessages: any[] = agents.flatMap(a =>
            a?.chat_messages ? Object.values(a.chat_messages).flat() : [],
        );
        const authored = globalMessages.filter(m => m && m.name === agentName);
        if (authored.length === 0) {
            return { count: 0, lastActivity: "No activity" };
        }
        const norm = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);

        const isMeaningful = (c: unknown) => {
            if (typeof c !== "string") {
                return false;
            }
            const t = c.trim().toLowerCase();
            return t !== "" && t !== "none";
        };

        const clip = (s: string, n = 80) => (s.length > n ? s.slice(0, n) + "..." : s);

        const seen = new Set<string>();
        const uniqueAuthored = authored.filter(m => {
            const fp = JSON.stringify({
                name: m.name ?? null,
                content: norm(m.content) ?? null,
                tool_calls: Array.isArray(m.tool_calls)
                    ? m.tool_calls.map((c: any) => c?.id ?? null).sort()
                    : [],
            });
            if (seen.has(fp)) {
                return false;
            }
            seen.add(fp);
            return true;
        });

        let count = 0;
        let lastActivity = "No activity";

        for (const msg of uniqueAuthored) {
            const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
            const hasContent = isMeaningful(msg.content);
            count += toolCalls.length;
            if (hasContent) {
                count += 1;
            }
            if (toolCalls.length > 0) {
                const last = toolCalls[toolCalls.length - 1];
                const fname = last?.function?.name || "tool";
                lastActivity = `Called ${fname}`;
            } else if (hasContent) {
                const text =
                    typeof getContentString === "function"
                        ? getContentString(msg.content)
                        : String(norm(msg.content));
                lastActivity = clip(text);
            }
        }

        return { count, lastActivity };
    };

    return (
        <div className="event-agents-details overflow-auto">
            {agents.map((agent, index) => {
                const stats = getAgentStats(agent.name);
                return (
                    <AgentEventInfo
                        key={`agent-${index}`}
                        agentData={agent}
                        stats={stats}
                        darkMode={darkMode}
                    />
                );
            })}
        </div>
    );
};
