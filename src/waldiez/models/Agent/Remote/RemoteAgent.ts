/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { WaldiezAgent, type WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentRemoteData } from "@waldiez/models/Agent/Remote/RemoteAgentData";

/**
 * Waldiez Agent Remote.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("assistant")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentRemoteAgentData}
 * @param rest - Any other data
 * @see {@link WaldiezAgent}
 */
export class WaldiezAgentRemote extends WaldiezAgent {
    data: WaldiezAgentRemoteData;
    agentType: WaldiezNodeAgentType = "remote";

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentRemoteData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.agentType = "remote";
        this.data = props.data;
        this.rest = props.rest || {};
    }
}
