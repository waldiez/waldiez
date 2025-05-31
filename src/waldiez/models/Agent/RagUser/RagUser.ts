/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgent, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentRagUserData } from "@waldiez/models/Agent/RagUser/RagUserData";

/**
 * WaldiezAgentRagUser
 * @param id - The id of the rag user agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (rag_user_proxy)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent.
 * @param rest - Any other data
 * @see {@link WaldiezAgentRagUserData}
 */
export class WaldiezAgentRagUser extends WaldiezAgent {
    data: WaldiezAgentRagUserData;
    agentType: WaldiezNodeAgentType = "rag_user_proxy";

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentRagUserData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.data = props.data;
        this.agentType = "rag_user_proxy";
        this.rest = props.rest || {};
    }
}
