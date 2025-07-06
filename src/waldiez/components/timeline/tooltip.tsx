/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezTimelineCostPoint } from "@waldiez/types";

export const TimelineTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }
    const d = payload[0].payload as WaldiezTimelineCostPoint;
    return (
        <div className="card">
            <div className="card-content">
                <div className="font-semibold text-sm">Cumulative Cost: ${d.cumulative_cost?.toFixed(6)}</div>
                <div className="text-xs space-y-0_5">
                    <div>Session Cost: ${d.session_cost?.toFixed(6)}</div>
                    <div>Session: {d.session_id}</div>
                </div>
            </div>
        </div>
    );
};
