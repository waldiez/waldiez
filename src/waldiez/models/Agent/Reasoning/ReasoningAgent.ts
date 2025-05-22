/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgent, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";
import { WaldiezAgentReasoningData } from "@waldiez/models/Agent/Reasoning/ReasoningAgentData";

/**
 * WaldiezAgentReasoning
 * @param id - The id of the reasoning agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (reasoning)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentReasoningData}
 * @param rest - Any other data
 */
export class WaldiezAgentReasoning extends WaldiezAgent {
    data: WaldiezAgentReasoningData;
    agentType: WaldiezNodeAgentType = "reasoning";

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentReasoningData;
        rest?: { [key: string]: unknown };
    }) {
        super(props);
        this.data = props.data;
        this.agentType = "reasoning";
        this.rest = props.rest || {};
    }
}
