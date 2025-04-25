/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { AfterWork } from "@waldiez/components";
import { WaldiezAgentSwarmAfterWorkProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";
import { isAfterWork } from "@waldiez/store/utils";
import { WaldiezNodeAgentSwarm, WaldiezSwarmAfterWork } from "@waldiez/types";

export const WaldiezAgentSwarmAfterWork = (props: WaldiezAgentSwarmAfterWorkProps) => {
    const { agentConnections, data, darkMode, onDataChange } = props;
    const afterWorkTargets = agentConnections.target.nodes.filter(
        agent => agent.data.agentType === "swarm",
    ) as WaldiezNodeAgentSwarm[];
    const onAfterWorkChange = (value: WaldiezSwarmAfterWork | null) => {
        const handoffs = data.handoffs.filter(handoff => !isAfterWork(handoff));
        if (value) {
            handoffs.push(value);
        }
        onDataChange({ handoffs });
    };
    const currentAfterWorks = data.handoffs.filter(handoff =>
        isAfterWork(handoff),
    ) as WaldiezSwarmAfterWork[];
    const currentAfterWork: WaldiezSwarmAfterWork | null =
        currentAfterWorks.length > 0 ? currentAfterWorks[0] : null;
    return (
        <div className="agent-panel agent-swarm-afterWork-panel">
            <AfterWork
                agents={afterWorkTargets}
                darkMode={darkMode}
                onChange={onAfterWorkChange}
                value={currentAfterWork}
            />
        </div>
    );
};
