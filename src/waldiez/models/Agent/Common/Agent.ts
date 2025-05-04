/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgentData } from "@waldiez/models/Agent/Common/AgentData";
import { WaldiezAgentType, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common/types";
import { capitalize, getId } from "@waldiez/utils";

/**
 * Waldiez Agent.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("user_proxy" | "assistant" | "rag_user_proxy" | "reasoning" | "captain")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentData}
 */
export class WaldiezAgent {
    id: string;
    type = "agent";
    agentType: WaldiezNodeAgentType;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezAgentData;
    rest?: { [key: string]: unknown };

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentData;
        rest?: { [key: string]: unknown };
    }) {
        this.id = props.id;
        this.agentType = props.agentType;
        this.name = props.name;
        this.description = props.description;
        this.tags = props.tags;
        this.requirements = props.requirements;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.data = props.data;
        this.rest = props.rest;
    }

    static create(agentType: WaldiezAgentType): WaldiezAgent {
        const name = capitalize(agentType.replace("_", " "));
        const description = `A new ${name} agent`;
        const agent = new WaldiezAgent({
            id: `wa-${getId()}`,
            agentType,
            name,
            description,
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezAgentData(),
        });
        updateAgentDataProps(agent, agentType);
        return agent;
    }
}

const updateAgentDataProps = (agent: WaldiezAgent, agentType: WaldiezAgentType) => {
    if (["user_proxy", "rag_user_proxy"].includes(agentType)) {
        agent.data.humanInputMode = "ALWAYS";
        if (agentType === "rag_user_proxy") {
            addRagUserProps(agent.data);
        }
    }
    if (agentType === "reasoning") {
        addReasoningProps(agent.data);
    }
    if (agentType === "captain") {
        addCaptainProps(agent.data);
    }
};

const addRagUserProps = (agentData: WaldiezAgentData) => {
    (agentData as any).retrieveConfig = {
        task: "default" as "code" | "qa" | "default",
        vectorDb: "chroma" as "chroma" | "pgvector" | "mongodb" | "qdrant",
        dbConfig: {
            model: "all-MiniLM-L6-v2",
            useMemory: false,
            useLocalStorage: false,
            localStoragePath: null,
            connectionUrl: null,
        },
        docsPath: [],
        newDocs: true,
        model: null,
        chunkTokenSize: null,
        contextMaxTokens: null,
        chunkMode: "multi_lines" as "multi_lines" | "one_line",
        mustBreakAtEmptyLine: true,
        useCustomEmbedding: false,
        embeddingFunction: null,
        customizedPrompt: null,
        customizedAnswerPrefix: null,
        updateContext: true,
        collectionName: "autogen-docs",
        getOrCreate: true,
        overwrite: false,
        useCustomTokenCount: false,
        customTokenCountFunction: null,
        useCustomTextSplit: false,
        customTextSplitFunction: null,
        customTextTypes: [],
        recursive: true,
        distanceThreshold: -1,
        n_results: null,
    };
};

const addReasoningProps = (agentData: WaldiezAgentData) => {
    (agentData as any).verbose = true;
    (agentData as any).reasonConfig = {
        method: "beam_search" as "beam_search" | "mcts" | "lats" | "dfs",
        max_depth: 3,
        forest_size: 1,
        rating_scale: 10,
        beam_size: 3,
        answer_approach: "pool" as "pool" | "best",
        nsim: 3,
        exploration_constant: 1.41,
    };
};

const addCaptainProps = (agentData: WaldiezAgentData) => {
    (agentData as any).agentLib = [];
    (agentData as any).toolLib = null;
    (agentData as any).maxRound = 10;
    (agentData as any).maxTurns = 5;
};
