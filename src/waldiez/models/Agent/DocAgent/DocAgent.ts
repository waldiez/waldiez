/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgent, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentDocAgentData } from "@waldiez/models/Agent/DocAgent/DocAgentData";

/**
 * Waldiez Agent Document Agent.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("doc_agent")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentDocAgentData}
 * @param rest - Any other data
 * @see {@link WaldiezAgent}
 */
export class WaldiezAgentDocAgent extends WaldiezAgent {
    data: WaldiezAgentDocAgentData;
    agentType: WaldiezNodeAgentType = "doc_agent";

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentDocAgentData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.agentType = "doc_agent";
        this.data = props.data;
        this.rest = props.rest || {};
    }
}
