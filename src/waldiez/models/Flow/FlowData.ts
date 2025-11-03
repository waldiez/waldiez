/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Edge, Node, Viewport } from "@xyflow/react";

import {
    WaldiezAgentAssistant,
    WaldiezAgentCaptain,
    WaldiezAgentDocAgent,
    WaldiezAgentGroupManager,
    WaldiezAgentRagUser,
    WaldiezAgentReasoning,
    WaldiezAgentUserProxy,
} from "@waldiez/models/Agent";
import { WaldiezChat } from "@waldiez/models/Chat";
import { WaldiezModel } from "@waldiez/models/Model";
import { WaldiezTool } from "@waldiez/models/Tool";

/**
 * Waldiez Flow Data
 * @param nodes - The nodes
 * @param edges - The edges
 * @param agents - The agents
 * @param models - The models
 * @param tools - The tools
 * @param chats - The chats
 * @param isAsync - Is async
 * @param cacheSeed - The cache seed
 * @param viewport - The viewport
 * @see {@link WaldiezAgentUserProxy}
 * @see {@link WaldiezAgentAssistant}
 * @see {@link WaldiezAgentRagUser}
 * @see {@link WaldiezModel}
 * @see {@link WaldiezTool}
 * @see {@link WaldiezChat}
 * @see {@link WaldiezFlowData}
 */
export class WaldiezFlowData {
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport;
    agents: {
        userProxyAgents?: WaldiezAgentUserProxy[];
        assistantAgents?: WaldiezAgentAssistant[];
        ragUserProxyAgents?: WaldiezAgentRagUser[];
        reasoningAgents?: WaldiezAgentReasoning[];
        captainAgents?: WaldiezAgentCaptain[];
        groupManagerAgents?: WaldiezAgentGroupManager[];
        docAgents?: WaldiezAgentDocAgent[];
    };
    models: WaldiezModel[];
    tools: WaldiezTool[];
    chats: WaldiezChat[];
    isAsync?: boolean = false;
    cacheSeed?: number | null = null;
    silent?: boolean = false;

    constructor(
        props: {
            nodes: Node[];
            edges: Edge[];
            viewport: Viewport;
            agents: {
                userProxyAgents?: WaldiezAgentUserProxy[];
                assistantAgents?: WaldiezAgentAssistant[];
                ragUserProxyAgents?: WaldiezAgentRagUser[];
                reasoningAgents?: WaldiezAgentReasoning[];
                captainAgents?: WaldiezAgentCaptain[];
                groupManagerAgents?: WaldiezAgentGroupManager[];
                docAgents?: WaldiezAgentDocAgent[];
            };
            models: WaldiezModel[];
            tools: WaldiezTool[];
            chats: WaldiezChat[];
            isAsync?: boolean;
            cacheSeed?: number | null;
            silent?: boolean;
        } = {
            nodes: [],
            edges: [],
            viewport: {
                x: 0,
                y: 0,
                zoom: 1,
            },
            agents: {
                userProxyAgents: [],
                assistantAgents: [],
                ragUserProxyAgents: [],
                reasoningAgents: [],
                captainAgents: [],
                groupManagerAgents: [],
                docAgents: [],
            },
            models: [],
            tools: [],
            chats: [],
            isAsync: false,
            cacheSeed: null,
            silent: false,
        },
    ) {
        this.nodes = props.nodes;
        this.edges = props.edges;
        this.viewport = props.viewport;
        this.agents = props.agents;
        this.models = props.models;
        this.tools = props.tools;
        this.chats = props.chats;
        this.isAsync = props.isAsync;
        this.cacheSeed = props.cacheSeed;
        this.silent = props.silent;
    }
}
