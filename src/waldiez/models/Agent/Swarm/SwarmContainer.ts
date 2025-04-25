/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgent, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentSwarmContainerData } from "@waldiez/models/Agent/Swarm/SwarmContainerData";

/**
 * Swarm agent
 * @param id - The id of the swarm agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (swarm)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentSwarmContainerData}
 * @param rest - Any other data
 */
export class WaldiezAgentSwarmContainer extends WaldiezAgent {
    data: WaldiezAgentSwarmContainerData;
    agentType: WaldiezNodeAgentType = "swarm_container";

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentSwarmContainerData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.data = props.data;
        this.rest = props.rest || {};
    }
}
