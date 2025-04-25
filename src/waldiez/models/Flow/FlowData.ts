/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node, Viewport } from "@xyflow/react";

import {
    WaldiezAgentAssistant,
    WaldiezAgentCaptain,
    WaldiezAgentGroupManager,
    WaldiezAgentRagUser,
    WaldiezAgentReasoning,
    WaldiezAgentSwarm,
    WaldiezAgentUserProxy,
} from "@waldiez/models/Agent";
import { WaldiezChat } from "@waldiez/models/Chat";
import { WaldiezModel } from "@waldiez/models/Model";
import { WaldiezSkill } from "@waldiez/models/Skill";

/**
 * Waldiez Flow Data
 * @param nodes - The nodes
 * @param edges - The edges
 * @param agents - The agents
 * @param models - The models
 * @param skills - The skills
 * @param chats - The chats
 * @param isAsync - Is async
 * @param cacheSeed - The cache seed
 * @param viewport - The viewport
 * @see {@link WaldiezAgentUserProxy}
 * @see {@link WaldiezAgentAssistant}
 * @see {@link WaldiezAgentGroupManager}
 * @see {@link WaldiezAgentRagUser}
 * @see {@link WaldiezAgentSwarm}
 * @see {@link WaldiezModel}
 * @see {@link WaldiezSkill}
 * @see {@link WaldiezChat}
 * @see {@link WaldiezFlowData}
 */
export class WaldiezFlowData {
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport;
    agents: {
        users: WaldiezAgentUserProxy[];
        assistants: WaldiezAgentAssistant[];
        managers: WaldiezAgentGroupManager[];
        rag_users: WaldiezAgentRagUser[];
        swarm_agents: WaldiezAgentSwarm[];
        reasoning_agents: WaldiezAgentReasoning[];
        captain_agents: WaldiezAgentCaptain[];
    };
    models: WaldiezModel[];
    skills: WaldiezSkill[];
    chats: WaldiezChat[];
    isAsync?: boolean = false;
    cacheSeed?: number | null = 41;

    constructor(
        props: {
            nodes: Node[];
            edges: Edge[];
            viewport: Viewport;
            agents: {
                users: WaldiezAgentUserProxy[];
                assistants: WaldiezAgentAssistant[];
                managers: WaldiezAgentGroupManager[];
                rag_users: WaldiezAgentRagUser[];
                swarm_agents: WaldiezAgentSwarm[];
                reasoning_agents: WaldiezAgentReasoning[];
                captain_agents: WaldiezAgentCaptain[];
            };
            models: WaldiezModel[];
            skills: WaldiezSkill[];
            chats: WaldiezChat[];
            isAsync?: boolean;
            cacheSeed?: number | null;
        } = {
            nodes: [],
            edges: [],
            viewport: {
                x: 0,
                y: 0,
                zoom: 1,
            },
            agents: {
                users: [],
                assistants: [],
                managers: [],
                rag_users: [],
                swarm_agents: [],
                reasoning_agents: [],
                captain_agents: [],
            },
            models: [],
            skills: [],
            chats: [],
            isAsync: false,
            cacheSeed: 41,
        },
    ) {
        this.nodes = props.nodes;
        this.edges = props.edges;
        this.viewport = props.viewport;
        this.agents = props.agents;
        this.models = props.models;
        this.skills = props.skills;
        this.chats = props.chats;
        this.isAsync = props.isAsync;
        this.cacheSeed = props.cacheSeed;
    }
}
