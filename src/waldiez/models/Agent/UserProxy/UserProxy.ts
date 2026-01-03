/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { WaldiezAgent, type WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentUserProxyData } from "@waldiez/models/Agent/UserProxy/UserProxyData";

/**
 * Waldiez User Proxy Agent.
 * @param id - The id of the user proxy
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent (user)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentUserProxyData}
 */
export class WaldiezAgentUserProxy extends WaldiezAgent {
    data: WaldiezAgentUserProxyData;
    agentType: WaldiezNodeAgentType = "user_proxy";
    constructor(props: {
        id: string;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        agentType: WaldiezNodeAgentType;
        data: WaldiezAgentUserProxyData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.agentType = "user_proxy";
        this.data = props.data;
        this.rest = props.rest || {};
    }
}
